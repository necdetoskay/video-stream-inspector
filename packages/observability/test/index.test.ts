import { describe, expect, it, vi } from "vitest";
import { emitSafeEvent } from "../src/index";

describe("safe observability", () => {
  it("OBS-001 emits only allowlisted fields", () => {
    const sink = vi.fn();
    const event = emitSafeEvent(sink, {
      event: "acquisition.denied",
      outcome: "deny",
      decisionCode: "deny-protection-signal",
      mediaKind: "direct",
      timestamp: "2026-08-10T00:00:00.000Z",
    });

    expect(event).toEqual({
      event: "acquisition.denied",
      outcome: "deny",
      decisionCode: "deny-protection-signal",
      mediaKind: "direct",
      timestamp: "2026-08-10T00:00:00.000Z",
    });
    expect(JSON.stringify(event)).not.toContain("token");
    expect(JSON.stringify(event)).not.toContain("http");
    expect(JSON.stringify(event)).not.toContain("authorizationNote");
  });

  it("OBS-002 does not provide fields for secrets or raw URLs", () => {
    const sink = vi.fn();
    const event = emitSafeEvent(sink, {
      event: "inspection.completed",
      candidateCount: 3,
      timestamp: "2026-08-10T00:00:00.000Z",
    });
    expect(Object.keys(event).sort()).toEqual(["candidateCount", "event", "timestamp"]);
  });
});
