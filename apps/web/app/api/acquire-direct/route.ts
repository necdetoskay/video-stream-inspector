import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { emitSafeEvent, jsonConsoleSink } from "@vsi/observability";
import { acquireDirect } from "../../../lib/acquire-direct";
import type { AuthorizationBasis, ProtectionSignal } from "@vsi/policy";

export const runtime = "nodejs";

const ALLOWED_BASES = new Set<AuthorizationBasis>(["owned", "permission", "public-domain", "other"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      intentToken?: string;
      candidateUrl?: string;
      authorized?: boolean;
      authorizationBasis?: AuthorizationBasis;
      authorizationNote?: string;
      protectionSignals?: ProtectionSignal[];
    };

    if (!body.intentToken || !body.candidateUrl) {
      return NextResponse.json({ error: "intentToken and candidateUrl are required" }, { status: 400 });
    }
    if (body.authorizationBasis && !ALLOWED_BASES.has(body.authorizationBasis)) {
      return NextResponse.json({ error: "Invalid authorization basis" }, { status: 400 });
    }

    const outcome = await acquireDirect({
      intentToken: body.intentToken,
      candidateUrl: body.candidateUrl,
      authorization: {
        authorized: body.authorized === true,
        basis: body.authorizationBasis,
        note: body.authorizationNote,
      },
      protectionSignals: Array.isArray(body.protectionSignals) ? body.protectionSignals : [],
      outputDirectory: resolve(process.env.VSI_DOWNLOAD_DIR ?? ".vsi-downloads"),
    });

    if (!outcome.ok) {
      emitSafeEvent(jsonConsoleSink, {
        event: "acquisition.denied",
        outcome: "deny",
        decisionCode: outcome.decision.code,
        mediaKind: "direct",
      });
      return NextResponse.json({ error: "Acquisition denied", decision: outcome.decision }, { status: 403 });
    }

    emitSafeEvent(jsonConsoleSink, {
      event: "acquisition.completed",
      outcome: "success",
      decisionCode: outcome.decision.code,
      mediaKind: "direct",
      bytes: outcome.download.bytes,
      mimeType: outcome.download.mimeType,
    });

    return NextResponse.json({
      decision: outcome.decision,
      download: {
        filename: outcome.download.path.split(/[\\/]/).pop(),
        bytes: outcome.download.bytes,
        mimeType: outcome.download.mimeType,
      },
    });
  } catch (cause) {
    emitSafeEvent(jsonConsoleSink, {
      event: "acquisition.failed",
      outcome: "failure",
      mediaKind: "direct",
    });
    const message = cause instanceof Error ? cause.message : "Acquisition failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
