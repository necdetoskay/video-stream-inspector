import { inspectPage } from "@vsi/inspector";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    if (!body.url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    let parsed: URL;
    try {
      parsed = new URL(body.url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only http and https URLs are supported" }, { status: 400 });
    }

    const report = await inspectPage(parsed.toString(), { waitAfterLoadMs: 1200 });
    return NextResponse.json(report);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Inspection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
