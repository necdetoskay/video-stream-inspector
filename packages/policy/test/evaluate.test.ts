import { describe, expect, it } from "vitest";
import { evaluateAcquisitionPolicy, type ProtectionKind } from "../src/index";

describe("evaluateAcquisitionPolicy", () => {
  it("POLICY-ALLOW-001 allows explicitly authorized unprotected media", () => {
    expect(evaluateAcquisitionPolicy({
      authorization: { authorized: true, basis: "owned" },
      protectionSignals: [],
    })).toEqual({
      allowed: true,
      code: "allow-explicit-authorization",
      reasons: ["authorization-basis:owned", "no-protection-signals-observed"],
    });
  });

  it("POLICY-DENY-001 denies without explicit authorization", () => {
    expect(evaluateAcquisitionPolicy({
      authorization: { authorized: false },
      protectionSignals: [],
    })).toEqual({
      allowed: false,
      code: "deny-no-authorization",
      reasons: ["explicit-user-authorization-required"],
    });
  });

  const protectedKinds: ProtectionKind[] = ["drm", "auth", "signed-url", "paywall", "geo", "unknown"];

  for (const kind of protectedKinds) {
    it(`POLICY-DENY-${kind} denies authorized media with ${kind} signal`, () => {
      const decision = evaluateAcquisitionPolicy({
        authorization: { authorized: true, basis: "permission" },
        protectionSignals: [{ kind, evidence: "fixture-signal" }],
      });

      expect(decision.allowed).toBe(false);
      expect(decision.code).toBe("deny-protection-signal");
      expect(decision.reasons).toEqual([`protection:${kind}:fixture-signal`]);
    });
  }

  it("POLICY-DENY-MULTI preserves all protection evidence", () => {
    const decision = evaluateAcquisitionPolicy({
      authorization: { authorized: true, basis: "owned" },
      protectionSignals: [
        { kind: "auth", evidence: "login-required" },
        { kind: "drm", evidence: "encrypted-media-extension" },
      ],
    });

    expect(decision).toEqual({
      allowed: false,
      code: "deny-protection-signal",
      reasons: [
        "protection:auth:login-required",
        "protection:drm:encrypted-media-extension",
      ],
    });
  });
});
