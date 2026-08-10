import { inspectPage } from "@vsi/inspector";
import { createPublicNetworkGuard } from "@vsi/network-policy";
import { NextResponse } from "next/server";
import { inspectionRegistry } from "../../../lib/acquisition-state";
import { validateInspectionUrl } from "../../../lib/validate-inspection-url";

export const runtime = "nodejs";

const publicNetworkGuard = createPublicNetworkGuard();

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    const validation = validateInspectionUrl(body.url);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
      await publicNetworkGuard(validation.url);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Network target is not allowed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const report = await inspectPage(validation.url, { requestGuard: publicNetworkGuard });
    const record = inspectionRegistry.register({
      pageUrl: report.pageUrl,
      finalUrl: report.finalUrl,
      candidates: report.candidates
        .filter((candidate) => candidate.kind !== "unknown")
        .map((candidate) => ({ url: candidate.url, kind: candidate.kind })),
    });

    return NextResponse.json({ ...report, inspectionId: record.id, inspectionExpiresAt: record.expiresAt });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Inspection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
