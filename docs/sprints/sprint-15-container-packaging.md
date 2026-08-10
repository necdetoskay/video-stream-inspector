# Sprint 15 — Container Packaging

## Goal
Ship a reproducible local production runtime with Chromium, persistent downloads, health checks, and a non-root process.

## Acceptance criteria
- production image builds in CI
- application runs as a non-root user
- Chromium required by Playwright is present in the runtime image
- `VSI_DOWNLOAD_DIR` defaults to `/data/downloads`
- `/data/downloads` is a declared persistent volume
- container healthcheck calls `/api/readyz`
- docker-compose exposes port 3000 and persists downloads
- existing typecheck, tests, and Next.js production build remain green

## Security boundaries
The container does not add credentials, cookies, DRM support, redirect bypass, HLS/DASH acquisition, or privileged host access. It runs without root privileges at runtime.
