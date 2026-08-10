# Roadmap

## Sprint 00 — Foundation

Establish charter, architecture boundaries, workspace skeleton, safety policy, and testing strategy.

Exit criteria:
- Repository has canonical architecture and roadmap docs.
- pnpm workspace skeleton exists.
- Analyzer/policy/downloader responsibilities are explicitly separated.
- Test strategy does not depend on third-party websites.

## Sprint 01 — Deterministic Media Detection

Build pure URL/MIME media classifiers and a local fixture server.

Targets:
- Direct MP4 detection.
- HLS `.m3u8` detection.
- DASH `.mpd` detection.
- MIME-based classification when extensions are absent.
- Unit tests with explainable classification reasons.

## Sprint 02 — Browser Network Inspector

Add Playwright instrumentation and normalize network/DOM observations into inspection reports.

Targets:
- Request/response observation.
- DOM `<video>/<source>` inspection.
- JavaScript-delayed media discovery.
- Redirect/final URL recording.
- Deduplication of candidates.

## Sprint 03 — Web UI

Create a local Next.js UI for URL submission and inspection reports.

Targets:
- URL validation.
- Inspection progress/state.
- Candidate list and source/evidence display.
- Clear protected/unknown-state warnings.

## Sprint 04 — Policy Gate

Implement fail-closed acquisition authorization.

Targets:
- Explicit user authorization assertion.
- Protection signal model.
- Denial reasons.
- Downloader inaccessible without an allow decision.
- Policy unit/integration tests.

## Sprint 05 — Permitted Downloads

Add direct-file downloads and FFmpeg-backed permitted HLS workflows using project fixtures and lawful test assets.

Targets:
- Output directory controls.
- Filename sanitization.
- Progress reporting.
- Cancellation and cleanup.
- No DRM/access-control circumvention paths.

## Sprint 06 — Production Hardening

Targets:
- SSRF defenses and local/private network policy.
- Request/time/size limits.
- Sandboxed browser configuration.
- Structured audit logs.
- Failure/recovery tests.
- Docker-based reproducible local runtime.

## Test philosophy

Each sprint adds an executable scenario to the project test suite. Reports should answer: what was tested, which page/fixture was used, what media was found, why it was classified that way, what policy decision occurred, and whether the expected outcome matched the observed result.
