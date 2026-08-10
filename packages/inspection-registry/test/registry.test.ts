import { describe, expect, it } from "vitest";
import { createInspectionRegistry } from "../src/index";

describe("inspection registry", () => {
  it("INSPECTION-001 registers and returns observed candidates", () => {
    const registry = createInspectionRegistry({ now: () => 1000 });
    const record = registry.register({
      pageUrl: "https://example.com/page",
      finalUrl: "https://example.com/page",
      candidates: [{ url: "https://cdn.example.com/movie.mp4", kind: "direct" }],
    });
    expect(record.id).toHaveLength(32);
    expect(registry.get(record.id)?.candidates).toEqual(record.candidates);
  });

  it("INSPECTION-002 rejects unobserved URL swapping", () => {
    const registry = createInspectionRegistry();
    const record = registry.register({
      pageUrl: "https://example.com/page",
      finalUrl: "https://example.com/page",
      candidates: [{ url: "https://cdn.example.com/movie.mp4", kind: "direct" }],
    });
    expect(() => registry.assertDirectCandidate(record.id, "https://evil.example/movie.mp4"))
      .toThrow("Candidate was not observed");
  });

  it("INSPECTION-003 rejects HLS and DASH acquisition", () => {
    const registry = createInspectionRegistry();
    const record = registry.register({
      pageUrl: "https://example.com/page",
      finalUrl: "https://example.com/page",
      candidates: [
        { url: "https://cdn.example.com/master.m3u8", kind: "hls" },
        { url: "https://cdn.example.com/manifest.mpd", kind: "dash" },
      ],
    });
    expect(() => registry.assertDirectCandidate(record.id, record.candidates[0]!.url))
      .toThrow("Only direct media candidates");
    expect(() => registry.assertDirectCandidate(record.id, record.candidates[1]!.url))
      .toThrow("Only direct media candidates");
  });

  it("INSPECTION-004 expires records fail-closed", () => {
    let clock = 1000;
    const registry = createInspectionRegistry({ ttlMs: 100, now: () => clock });
    const record = registry.register({
      pageUrl: "https://example.com/page",
      finalUrl: "https://example.com/page",
      candidates: [{ url: "https://cdn.example.com/movie.mp4", kind: "direct" }],
    });
    clock = 1100;
    expect(registry.get(record.id)).toBeUndefined();
    expect(() => registry.assertDirectCandidate(record.id, record.candidates[0]!.url))
      .toThrow("missing or expired");
  });
});
