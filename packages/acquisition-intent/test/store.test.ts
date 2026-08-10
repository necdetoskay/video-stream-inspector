import { describe, expect, it } from "vitest";
import { AcquisitionIntentStore } from "../src/index";

describe("AcquisitionIntentStore", () => {
  it("INTENT-001 issues and consumes an exact direct candidate once", () => {
    const store = new AcquisitionIntentStore(1_000);
    const intent = store.issue({ url: "https://example.com/video.mp4", kind: "direct" }, 100);
    const consumed = store.consume({ token: intent.token, url: "https://example.com/video.mp4", kind: "direct" }, 200);
    expect(consumed.url).toBe("https://example.com/video.mp4");
    expect(() => store.consume({ token: intent.token, url: intent.url, kind: "direct" }, 300)).toThrow("Invalid or already-used");
  });

  it("INTENT-002 rejects forged tokens", () => {
    const store = new AcquisitionIntentStore();
    expect(() => store.consume({ token: "forged", url: "https://example.com/video.mp4", kind: "direct" })).toThrow("Invalid or already-used");
  });

  it("INTENT-003 rejects URL swapping", () => {
    const store = new AcquisitionIntentStore();
    const intent = store.issue({ url: "https://example.com/a.mp4", kind: "direct" });
    expect(() => store.consume({ token: intent.token, url: "https://example.com/b.mp4", kind: "direct" })).toThrow("does not match candidate");
  });

  it("INTENT-004 rejects expired intents", () => {
    const store = new AcquisitionIntentStore(100);
    const intent = store.issue({ url: "https://example.com/a.mp4", kind: "direct" }, 1_000);
    expect(() => store.consume({ token: intent.token, url: intent.url, kind: "direct" }, 1_100)).toThrow("expired");
  });

  it("INTENT-005 rejects non-HTTP candidates at issuance", () => {
    const store = new AcquisitionIntentStore();
    expect(() => store.issue({ url: "file:///tmp/video.mp4", kind: "direct" })).toThrow("Only HTTP(S)");
  });
});
