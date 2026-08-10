import { describe, expect, it } from "vitest";
import { validateInspectionUrl } from "./validate-inspection-url";

describe("validateInspectionUrl", () => {
  it("accepts http and normalizes the URL", () => {
    expect(validateInspectionUrl("http://example.com/path")).toEqual({
      ok: true,
      url: "http://example.com/path",
    });
  });

  it("accepts https", () => {
    expect(validateInspectionUrl("https://example.com")).toEqual({
      ok: true,
      url: "https://example.com/",
    });
  });

  it("rejects empty input", () => {
    expect(validateInspectionUrl(" ")).toEqual({ ok: false, error: "URL is required" });
  });

  it("rejects malformed input", () => {
    expect(validateInspectionUrl("not-a-url")).toEqual({ ok: false, error: "Invalid URL" });
  });

  it("rejects non-http protocols", () => {
    expect(validateInspectionUrl("file:///tmp/video.mp4")).toEqual({
      ok: false,
      error: "Only http and https URLs are supported",
    });
  });
});
