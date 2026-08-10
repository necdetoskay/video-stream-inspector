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

export type InspectionOptions = {
  browser?: Browser;
  requestGuard?: (url: string) => Promise<void>;
};

export async function inspectPage(
  pageUrl: string,
  options: InspectionOptions = {},
): Promise<InspectionReport> {
  if (options.requestGuard) await options.requestGuard(pageUrl);

  const ownedBrowser = options.browser ?? await chromium.launch({ headless: true });
  const context = await ownedBrowser.newContext();
  if (options.requestGuard) {
    const guard = options.requestGuard;
    await context.route("**/*", async (route) => {
      try {
        await guard(route.request().url());
        await route.continue();
      } catch {
        await route.abort("blockedbyclient");
      }
    });
  }

  const page = await context.newPage();
  const found = new Map<string, MediaEvidence>();

  const record = (url: string, mimeType: string | undefined, source: EvidenceSource) => {
    const result = classifyMedia({ url, mimeType });
    if (result.kind === "unknown") return;
    const existing = found.get(url);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (mimeType && !existing.mimeTypes.includes(mimeType)) existing.mimeTypes.push(mimeType);
      existing.confidence = Math.max(existing.confidence, result.confidence);
      existing.reasons = [...new Set([...existing.reasons, ...result.reasons])];
      return;
    }
    found.set(url, {
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
    await context.close();
    if (!options.browser) await ownedBrowser.close();
  }
}
