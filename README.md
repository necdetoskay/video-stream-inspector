# Video Stream Inspector

A local-first TypeScript application for inspecting web pages for media delivery technologies such as direct MP4, HLS, and MPEG-DASH, with an explicit policy boundary for downloading only content the operator is authorized to save.

## Goals

- Inspect a URL in a real browser context.
- Observe page and network activity for media candidates.
- Classify MP4, HLS (`.m3u8`), DASH (`.mpd`), and unknown media endpoints.
- Report findings without attempting DRM bypass or access-control circumvention.
- Download only media that is explicitly allowed by project policy and user authorization.
- Provide deterministic fixtures so the analyzer can be tested without relying on third-party sites.

## Planned stack

- TypeScript
- Node.js
- pnpm workspaces
- Playwright
- Next.js web UI
- FFmpeg integration for permitted media workflows
- Vitest + Playwright tests

## Repository status

Sprint 00 establishes the project charter, architecture boundaries, workspace structure, and test strategy. Functional browser inspection begins in Sprint 01.

See [`docs/roadmap.md`](docs/roadmap.md) and [`docs/sprints/sprint-00-foundation.md`](docs/sprints/sprint-00-foundation.md).

## Safety and usage boundary

This project is intended for media you own, control, have permission to download, or that is otherwise lawfully downloadable. It must not be used to bypass DRM, authentication, paywalls, expiring authorization mechanisms, or other technical access controls.

## License

No license has been selected yet. Until a license is added, normal copyright restrictions apply.
