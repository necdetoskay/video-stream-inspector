# Sprint 02 — Browser Network Inspector

## Goal
Observe media references produced by a real browser and convert them into a deterministic `InspectionReport` without downloading media bodies or adding site-specific extraction logic.

## Scope
- Chromium via Playwright.
- Response URL + Content-Type observation.
- DOM `video`, `audio`, and `source` URL observation.
- Reuse `@vsi/media` classification.
- Deduplicate the same URL seen through multiple evidence channels.
- Ignore unsupported resources such as ordinary JSON.
- Deterministic local HTTP fixture; no third-party streaming site dependency.

## Verification scenario
The fixture page contains a direct MP4 in the DOM and asynchronously requests HLS, DASH, and JSON resources. A real headless Chromium session must report exactly the three media resources. The MP4 must contain both `dom` and `network` evidence, proving deduplication rather than duplicate findings.

## Safety boundary
This sprint observes URLs and response metadata only. It does not bypass DRM, forge credentials/tokens, decrypt protected media, or implement downloading.

## Exit criteria
- dependency installation passes;
- TypeScript typecheck passes;
- existing Sprint 01 tests remain green;
- real Chromium inspection test passes in CI.
