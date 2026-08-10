# Sprint 17 — Full Web E2E Journey

## Goal
Verify the production container through the real browser UI, server APIs, policy gate, downloader, and filesystem in one deterministic CI journey.

## Scenario: ULTEF-WEB-001
1. Start the production image with `VSI_E2E_FIXTURE_MODE=1` and a bind-mounted download directory.
2. Seed one synthetic inspection record for the MDN CC0 flower MP4.
3. Use Playwright against the real web UI.
4. Confirm save action is disabled before authorization.
5. Select `Public domain` authorization.
6. Request acquisition through the real intent and direct-acquisition endpoints.
7. Verify the UI reports success.
8. Verify exactly one non-empty file exists in the mounted download directory.

## Safety boundary
`VSI_E2E_FIXTURE_MODE` is disabled by default. The gated seed endpoint returns 404 unless explicitly enabled. It does not weaken SSRF checks, add credentials, bypass DRM/protection controls, enable redirects, or enable HLS/DASH acquisition.

## Acceptance
CI must pass typecheck, all regression tests, Next.js build, production container build, container smoke verification, and ULTEF-WEB-001.
