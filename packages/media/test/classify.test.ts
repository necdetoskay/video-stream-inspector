import { describe, expect, it } from "vitest";
import { classifyMedia } from "../src/classify.js";

type Case = {
  id: string;
  input: { url: string; mimeType?: string };
  expectedKind: "direct" | "hls" | "dash" | "unknown";
  expectedReason?: string;
};

const cases: Case[] = [
  { id: "HLS-DETECT-001 extension+mime", input: { url: "https://fixture.local/video/master.m3u8", mimeType: "application/vnd.apple.mpegurl" }, expectedKind: "hls", expectedReason: "url-extension:.m3u8" },
  { id: "HLS-DETECT-002 query-string", input: { url: "https://fixture.local/video/master.m3u8?session=test", mimeType: "application/octet-stream" }, expectedKind: "hls" },
  { id: "HLS-DETECT-003 mime-only", input: { url: "https://fixture.local/api/manifest?id=42", mimeType: "application/x-mpegURL; charset=utf-8" }, expectedKind: "hls" },
  { id: "DASH-DETECT-001 extension+mime", input: { url: "https://fixture.local/video/manifest.mpd", mimeType: "application/dash+xml" }, expectedKind: "dash" },
  { id: "DASH-DETECT-002 mime-only", input: { url: "https://fixture.local/api/dash", mimeType: "application/dash+xml; charset=utf-8" }, expectedKind: "dash" },
  { id: "DIRECT-DETECT-001 mp4", input: { url: "https://fixture.local/assets/movie.mp4", mimeType: "video/mp4" }, expectedKind: "direct" },
  { id: "DIRECT-DETECT-002 mime-only", input: { url: "https://fixture.local/media?id=7", mimeType: "video/webm" }, expectedKind: "direct" },
  { id: "DIRECT-DETECT-003 audio", input: { url: "https://fixture.local/audio/sample.m4a", mimeType: "audio/mp4" }, expectedKind: "direct" },
  { id: "NEGATIVE-001 html", input: { url: "https://fixture.local/watch/123", mimeType: "text/html" }, expectedKind: "unknown", expectedReason: "no-supported-media-signal" },
  { id: "NEGATIVE-002 json", input: { url: "https://fixture.local/api/movie", mimeType: "application/json" }, expectedKind: "unknown" },
];

describe("classifyMedia deterministic media detection", () => {
  for (const testCase of cases) {
    it(testCase.id, () => {
      const result = classifyMedia(testCase.input);
      expect(result.kind).toBe(testCase.expectedKind);
      if (testCase.expectedReason) expect(result.reasons).toContain(testCase.expectedReason);
      if (testCase.expectedKind === "unknown") {
        expect(result.confidence).toBe(0);
      } else {
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
        expect(result.reasons.length).toBeGreaterThan(0);
      }
    });
  }
});
