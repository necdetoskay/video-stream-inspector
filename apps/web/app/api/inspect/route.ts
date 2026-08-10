import { inspectPage } from "@vsi/inspector";
import { NextResponse } from "next/server";
import { validateInspectionUrl } from "../../../lib/validate-inspection-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    const validation = validateInspectionUrl(body.url);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const report = await inspectPage(validation.url);
    return NextResponse.json(report);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Inspection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
