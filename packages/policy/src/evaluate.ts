export type AuthorizationBasis = "owned" | "permission" | "public-domain" | "other";

export type AuthorizationAssertion = {
  authorized: boolean;
  basis?: AuthorizationBasis;
  note?: string;
};

export type ProtectionKind = "drm" | "auth" | "signed-url" | "paywall" | "geo" | "unknown";

export type ProtectionSignal = {
  kind: ProtectionKind;
  evidence: string;
};

export type AcquisitionPolicyInput = {
  authorization: AuthorizationAssertion;
  protectionSignals: ProtectionSignal[];
};

export type PolicyDecisionCode =
  | "allow-explicit-authorization"
  | "deny-no-authorization"
  | "deny-protection-signal";

export type PolicyDecision = {
  allowed: boolean;
  code: PolicyDecisionCode;
  reasons: string[];
};

const acquisitionPermitBrand: unique symbol = Symbol("vsi.acquisition-permit");

export type AcquisitionPermit = Readonly<{
  decisionCode: "allow-explicit-authorization";
  [acquisitionPermitBrand]: true;
}>;

export function evaluateAcquisitionPolicy(input: AcquisitionPolicyInput): PolicyDecision {
  if (!input.authorization.authorized) {
    return {
      allowed: false,
      code: "deny-no-authorization",
      reasons: ["explicit-user-authorization-required"],
    };
  }

  if (input.protectionSignals.length > 0) {
    return {
      allowed: false,
      code: "deny-protection-signal",
      reasons: input.protectionSignals.map(
        (signal) => `protection:${signal.kind}:${signal.evidence}`,
      ),
    };
  }

  return {
    allowed: true,
    code: "allow-explicit-authorization",
    reasons: [
      `authorization-basis:${input.authorization.basis ?? "other"}`,
      "no-protection-signals-observed",
    ],
  };
}

export function issueAcquisitionPermit(input: AcquisitionPolicyInput): {
  decision: PolicyDecision;
  permit: AcquisitionPermit | null;
} {
  const decision = evaluateAcquisitionPolicy(input);
  if (!decision.allowed || decision.code !== "allow-explicit-authorization") {
    return { decision, permit: null };
  }

  const permit = Object.freeze({
    decisionCode: decision.code,
    [acquisitionPermitBrand]: true as const,
  }) as AcquisitionPermit;

  return { decision, permit };
}

export function isAcquisitionPermit(value: unknown): value is AcquisitionPermit {
  if (typeof value !== "object" || value === null) return false;
  return (value as Record<PropertyKey, unknown>)[acquisitionPermitBrand] === true;
}
