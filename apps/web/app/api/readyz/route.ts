import { NextResponse } from "next/server";
import { checkRuntimeReadiness } from "../../../lib/runtime-readiness";

export const runtime = "nodejs";

export async function GET() {
  const result = await checkRuntimeReadiness();
  if (!result.ready) {
    return NextResponse.json({ status: "not-ready", reason: result.reason }, { status: 503 });
  }
  return NextResponse.json({ status: "ready" });
}
