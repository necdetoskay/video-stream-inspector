# Sprint 04 — Policy Gate

## Objective

Create an explicit fail-closed authorization boundary between inspection and any future acquisition/download capability.

## Rules

1. Media discovery never grants permission to acquire it.
2. Acquisition requires an explicit positive user authorization assertion.
3. Any observed protection signal blocks acquisition.
4. Unknown protection state is treated as a denial signal, not permission.
5. Policy decisions are explainable and return stable machine-readable codes.
6. This sprint does not add a downloader or any DRM/access-control circumvention logic.

## Protection signals

- DRM
- authentication requirement
- signed/expiring URL
- paywall
- geographic restriction
- unknown protection

## Verification matrix

- Explicit authorization + no protection → ALLOW.
- No explicit authorization → DENY.
- Explicit authorization + DRM → DENY.
- Explicit authorization + auth → DENY.
- Explicit authorization + signed URL → DENY.
- Explicit authorization + paywall → DENY.
- Explicit authorization + geo restriction → DENY.
- Explicit authorization + unknown protection → DENY.
- Multiple protection signals preserve all evidence in the decision.

## Exit criteria

Sprint 04 is complete when the policy package passes typecheck/tests/build in CI and no acquisition code path can bypass the policy contract.
