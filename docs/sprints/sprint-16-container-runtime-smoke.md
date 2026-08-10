# Sprint 16 — Container Runtime Smoke Verification

## Goal

Verify that the production image does not only build, but also starts correctly under Docker with the expected runtime security and readiness behavior.

## Acceptance criteria

- The production image starts successfully in CI.
- `/api/healthz` returns a successful response.
- `/api/readyz` returns a successful response with the configured download directory writable.
- The application process runs as a non-root user.
- Docker health status reaches `starting` or `healthy` during the smoke window.
- Container logs are emitted automatically on smoke-test failure.
- The container is always removed after the test.

## Safety boundary

This sprint adds runtime verification only. It does not add credentials, DRM handling, redirect bypass, HLS/DASH acquisition, private-network access, or broader download capability.
