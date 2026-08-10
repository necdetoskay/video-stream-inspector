# Sprint 11 — ULTEF Direct Acquisition Journey

## Goal

Verify the production acquisition chain as a readable, scenario-based integration suite after media observation.

## Scenario matrix

### ULTEF-ACQUIRE-001 — Happy path

Observed direct candidate → inspection record → single-use intent → explicit authorization → no protection signal → policy permit → public-network validation → downloader → file written.

Expected: PASS, exactly one fetch, `video/mp4`, fixture bytes persisted.

### ULTEF-ACQUIRE-002 — Replay

Reuse an already-consumed acquisition intent.

Expected: rejected before a second network fetch.

### ULTEF-ACQUIRE-003 — Unauthorized

Use a valid observed candidate and intent but deny explicit authorization.

Expected: policy denial before intent consumption and before network. A later authorized retry with the same still-valid intent may proceed.

### ULTEF-ACQUIRE-004 — Protection signal

Use explicit authorization but provide a DRM/protection signal.

Expected: fail closed before intent consumption and before network.

### ULTEF-ACQUIRE-005 — Candidate URL swap

Issue an intent for one observed candidate and attempt to use it for another URL.

Expected: exact-URL capability check rejects before network.

## Test boundary

The test suite does not contact third-party media sites. The outbound media response is deterministically mocked while the registry, intent store, policy gate, downloader, public-target validation, and filesystem path execute through production code.

Browser/media discovery remains covered by the Playwright inspector suite. Sprint 11 specifically proves the downstream acquisition chain and its fail-closed invariants.

## Acceptance criteria

- All five ULTEF scenarios pass in CI.
- Existing media, inspector, policy, network, downloader, and web tests remain green.
- Typecheck remains green.
- Next.js production build remains green.
- No HLS/DASH acquisition, credential forwarding, redirect following, DRM handling, or access-control bypass is introduced.
