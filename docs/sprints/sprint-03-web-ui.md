# Sprint 03 — Web Inspection UI

## Objective

Expose the read-only browser inspection pipeline through a small local Next.js interface without introducing media acquisition.

## Scope

- Next.js web application under `apps/web`.
- URL submission with protocol validation.
- Server-side invocation of `@vsi/browser`.
- Human-readable display of final URL, media kind, confidence, MIME type, observation sources, and classification reasons.
- Responsive local-first UI.

## Acceptance criteria

1. `pnpm dev` starts `@vsi/web`.
2. A valid HTTP(S) URL can be submitted to `/api/inspect`.
3. Invalid/non-HTTP URLs fail clearly.
4. Browser inspection results are rendered without any download action.
5. Existing Sprint 01/02 tests remain green.
6. Next.js build and TypeScript checks pass in CI.

## Non-goals

- Download buttons or FFmpeg integration.
- DRM or access-control handling.
- Site-specific extractor logic.
- Public hosting/security hardening; SSRF protections are scheduled before any non-local deployment.
