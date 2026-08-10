import { NextResponse } from "next/server";
import { acquisitionIntentStore, inspectionRegistry } from "../../../lib/acquisition-state";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { inspectionId?: string; candidateUrl?: string };
    if (!body.inspectionId || !body.candidateUrl) {
      return NextResponse.json({ error: "inspectionId and candidateUrl are required" }, { status: 400 });
    }

    try {
      const candidate = inspectionRegistry.assertDirectCandidate(body.inspectionId, body.candidateUrl);
      const intent = acquisitionIntentStore.issue({ url: candidate.url, kind: "direct" });
      return NextResponse.json(intent);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Acquisition intent denied";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Acquisition intent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
