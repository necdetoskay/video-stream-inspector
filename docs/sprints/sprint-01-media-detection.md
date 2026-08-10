# Sprint 01 — Deterministic Media Detection

## Objective

Implement the first executable domain capability: classify observed URLs/responses as direct media, HLS, DASH, or unknown without browser automation or downloading.

## Scope

- Create `@vsi/media` as a pure TypeScript package.
- Detect HLS from `.m3u8` and recognized HLS MIME types.
- Detect DASH from `.mpd` and `application/dash+xml`.
- Detect common direct video/audio resources from extension and MIME type.
- Normalize MIME parameters and URL query strings before classification.
- Return confidence plus human-readable evidence reasons.
- Add deterministic positive and negative unit cases.

## Test matrix

| ID | Scenario | Expected |
| --- | --- | --- |
| HLS-DETECT-001 | `.m3u8` + HLS MIME | `hls`, extension + MIME evidence |
| HLS-DETECT-002 | `.m3u8` with query string | `hls` |
| HLS-DETECT-003 | HLS MIME without extension | `hls` |
| DASH-DETECT-001 | `.mpd` + DASH MIME | `dash` |
| DASH-DETECT-002 | DASH MIME without extension | `dash` |
| DIRECT-DETECT-001 | MP4 URL + MIME | `direct` |
| DIRECT-DETECT-002 | Video MIME without extension | `direct` |
| DIRECT-DETECT-003 | Audio resource | `direct` |
| NEGATIVE-001 | HTML page | `unknown` |
| NEGATIVE-002 | JSON endpoint | `unknown` |

## Acceptance criteria

1. Classification is pure and performs no network or filesystem I/O.
2. Query strings do not break extension detection.
3. MIME parameters such as `; charset=utf-8` do not break MIME detection.
4. HLS and DASH take precedence over generic audio/video classification.
5. Unknown HTML/JSON endpoints are not falsely classified as media.
6. Every non-unknown result contains at least one evidence reason.
7. Tests use deterministic fixture-style URLs and require no third-party site.
8. `pnpm --filter @vsi/media test` is the canonical verification command.

## Result reporting

Vitest verbose case names carry stable test IDs so the output shows exactly which behavior was verified instead of only an aggregate pass/fail count.

## Out of scope

- Playwright/network capture.
- Manifest parsing or variant enumeration.
- DRM/protection inference.
- Downloading or FFmpeg.
- Site-specific extractors.

## Exit decision

Sprint 01 may be merged when typecheck and the ten deterministic cases pass. Sprint 02 will feed real browser network observations into this classifier using only the local fixture site.
