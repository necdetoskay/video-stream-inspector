# Sprint 05 — Permitted Direct Download

## Objective

Add the first acquisition capability without weakening the policy boundary: direct HTTP(S) audio/video downloads only, using an opaque permit issued by `@vsi/policy`.

## Scope

- Opaque acquisition permit issued only after an allow policy decision.
- Runtime permit authenticity check in the downloader.
- Direct HTTP(S) download only.
- No custom request headers, cookies, credentials, bearer tokens, or authentication forwarding.
- Redirects are not automatically followed.
- Only `audio/*` and `video/*` responses are accepted.
- Output filenames are sanitized and existing files are not overwritten.
- Configurable maximum byte limit.
- Partial files are removed on failure.

## Explicit non-goals

- HLS/DASH acquisition.
- FFmpeg processing.
- DRM decryption or circumvention.
- Authentication/paywall/geographic restriction bypass.
- Signed or expiring URL acquisition when surfaced as a protection signal.
- UI download controls.

## Verification matrix

1. Valid policy permit + local direct MP4 fixture → saved successfully.
2. Forged permit → rejected before network acquisition.
3. Non-media content type → rejected.
4. Size above `maxBytes` → rejected.
5. Traversal-like filename → reduced to a safe leaf filename.

## Exit criteria

CI passes typecheck, all regression tests, downloader tests, and production build. No web endpoint exposes downloader functionality in this sprint.
