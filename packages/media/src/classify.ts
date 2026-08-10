export type MediaKind = "direct" | "hls" | "dash" | "unknown";

export type ClassificationInput = {
  url: string;
  mimeType?: string;
};

export type ClassificationResult = {
  kind: MediaKind;
  confidence: number;
  reasons: string[];
};

const HLS_MIME_TYPES = new Set([
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "audio/mpegurl",
  "audio/x-mpegurl",
]);

const DASH_MIME_TYPES = new Set(["application/dash+xml"]);
const DIRECT_MIME_PREFIXES = ["video/", "audio/"];
const DIRECT_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".mp3", ".m4a", ".aac", ".ogg"];

function normalizeMimeType(mimeType?: string): string | undefined {
  if (!mimeType) return undefined;
  return mimeType.split(";", 1)[0]?.trim().toLowerCase();
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.split(/[?#]/, 1)[0]?.toLowerCase() ?? url.toLowerCase();
  }
}

export function classifyMedia(input: ClassificationInput): ClassificationResult {
  const mimeType = normalizeMimeType(input.mimeType);
  const pathname = pathnameOf(input.url);
  const reasons: string[] = [];

  if (pathname.endsWith(".m3u8")) reasons.push("url-extension:.m3u8");
  if (mimeType && HLS_MIME_TYPES.has(mimeType)) reasons.push(`mime:${mimeType}`);
  if (reasons.length > 0) {
    return { kind: "hls", confidence: reasons.length > 1 ? 1 : 0.95, reasons };
  }

  if (pathname.endsWith(".mpd")) reasons.push("url-extension:.mpd");
  if (mimeType && DASH_MIME_TYPES.has(mimeType)) reasons.push(`mime:${mimeType}`);
  if (reasons.length > 0) {
    return { kind: "dash", confidence: reasons.length > 1 ? 1 : 0.95, reasons };
  }

  const directExtension = DIRECT_EXTENSIONS.find((extension) => pathname.endsWith(extension));
  if (directExtension) reasons.push(`url-extension:${directExtension}`);
  if (mimeType && DIRECT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    reasons.push(`mime:${mimeType}`);
  }
  if (reasons.length > 0) {
    return { kind: "direct", confidence: reasons.length > 1 ? 1 : 0.9, reasons };
  }

  return { kind: "unknown", confidence: 0, reasons: ["no-supported-media-signal"] };
}
