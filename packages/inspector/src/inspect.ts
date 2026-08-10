import { chromium, type Browser } from "playwright";
import { classifyMedia, type MediaKind } from "@vsi/media";

export type EvidenceSource = "network" | "dom";
export type MediaEvidence = {
  url: string;
  kind: Exclude<MediaKind, "unknown">;
  confidence: number;
  reasons: string[];
  sources: EvidenceSource[];
  mimeTypes: string[];
};

export type InspectionReport = {
  pageUrl: string;
  media: MediaEvidence[];
};

export async function inspectPage(pageUrl: string, browser?: Browser): Promise<InspectionReport> {
  const ownedBrowser = browser ?? await chromium.launch({ headless: true });
  const page = await ownedBrowser.newPage();
  const found = new Map<string, MediaEvidence>();

  const record = (url: string, mimeType: string | undefined, source: EvidenceSource) => {
    const result = classifyMedia({ url, mimeType });
    if (result.kind === "unknown") return;
    const key = url;
    const existing = found.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (mimeType && !existing.mimeTypes.includes(mimeType)) existing.mimeTypes.push(mimeType);
      existing.confidence = Math.max(existing.confidence, result.confidence);
      existing.reasons = [...new Set([...existing.reasons, ...result.reasons])];
      return;
    }
    found.set(key, {
      url,
      kind: result.kind,
      confidence: result.confidence,
      reasons: result.reasons,
      sources: [source],
      mimeTypes: mimeType ? [mimeType] : [],
    });
  };

  page.on("response", (response) => {
    const contentType = response.headers()["content-type"];
    record(response.url(), contentType, "network");
  });

  try {
    await page.goto(pageUrl, { waitUntil: "networkidle" });
    const domUrls = await page.locator("video, audio, source").evaluateAll((nodes) =>
      nodes.flatMap((node) => {
        const element = node as HTMLMediaElement | HTMLSourceElement;
        const urls: string[] = [];
        if (element instanceof HTMLMediaElement && element.currentSrc) urls.push(element.currentSrc);
        const src = element.getAttribute("src");
        if (src) urls.push(new URL(src, document.baseURI).href);
        return urls;
      }),
    );
    for (const url of domUrls) record(url, undefined, "dom");
    return { pageUrl, media: [...found.values()].sort((a, b) => a.url.localeCompare(b.url)) };
  } finally {
    await page.close();
    if (!browser) await ownedBrowser.close();
  }
}
