# Sprint 13 — Safe Acquisition UI

## Goal
Expose the already-hardened direct-media acquisition flow through the local web UI without widening the acquisition boundary.

## Flow
1. User inspects a page.
2. Server returns an opaque `inspectionId` plus observed candidates.
3. Only `direct` candidates render an acquisition action.
4. User must explicitly confirm authorization and select an allowed authorization basis.
5. Client requests a short-lived inspection-bound intent.
6. Client sends that intent to the policy-gated direct acquisition endpoint.
7. Server policy, intent consumption, public-network validation, downloader limits, and safe observability remain authoritative.

## Safety invariants
- HLS and DASH remain inspection-only.
- The UI never asks for or forwards cookies, auth headers, credentials, DRM keys, or access tokens.
- The user cannot supply an arbitrary acquisition URL separate from an observed candidate.
- Intent tokens are transient implementation details and are not displayed in the UI.
- Explicit authorization is required before the acquisition action is enabled.
- Server-side policy remains authoritative; client controls are not a security boundary.

## Acceptance criteria
- Direct candidates show a save action only after explicit authorization confirmation.
- HLS/DASH candidates show inspection-only messaging and no acquisition action.
- The client requests an inspection-bound intent before acquisition.
- Successful acquisition reports filename, bytes, and MIME type only.
- Failed acquisition surfaces a bounded error without exposing token data.
- Typecheck, all regression tests, and Next.js production build pass in CI.
