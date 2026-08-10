import { inspectionRegistry } from "../../../../lib/acquisition-state";

const FIXTURE_PAGE_URL = "https://example.test/e2e-media-page";
const FIXTURE_MEDIA_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export async function POST() {
  if (process.env.VSI_E2E_FIXTURE_MODE !== "1") {
    return new Response(null, { status: 404 });
  }

  const record = inspectionRegistry.register({
    pageUrl: FIXTURE_PAGE_URL,
    finalUrl: FIXTURE_PAGE_URL,
    candidates: [{ url: FIXTURE_MEDIA_URL, kind: "direct" }],
  });

  return Response.json({
    inspectionId: record.id,
    pageUrl: record.pageUrl,
    finalUrl: record.finalUrl,
    candidates: [
      {
        url: FIXTURE_MEDIA_URL,
        kind: "direct",
        mimeType: "video/mp4",
        sources: ["e2e-fixture"],
        confidence: 1,
        reasons: ["CI fixture candidate"],
      },
    ],
  });
}
