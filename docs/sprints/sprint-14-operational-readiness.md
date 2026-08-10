# Sprint 14 — Operational Readiness

## Goal
Make the local web application observable to supervisors and fail closed when its download storage is unavailable.

## Scope
- `/api/healthz` liveness endpoint.
- `/api/readyz` readiness endpoint.
- Runtime validation of the configured `VSI_DOWNLOAD_DIR`.
- Automatic creation of the configured download directory when possible.
- Read/write permission verification before declaring readiness.
- Deterministic readiness tests.

## Scenarios
### READY-001 — Writable storage
Given a writable configured directory path, readiness creates/verifies the directory and returns ready.

### READY-002 — Invalid storage target
Given a configured path that is a regular file, readiness returns not-ready and does not claim service readiness.

## Acceptance criteria
- health does not depend on outbound network access.
- readiness does not expose local filesystem paths in HTTP responses.
- unavailable storage yields HTTP 503 from `/api/readyz`.
- typecheck, tests, and production build pass in CI.
