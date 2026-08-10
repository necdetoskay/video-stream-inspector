# Sprint 10 — Policy-Gated Direct Acquisition

## Goal
Wire the server-issued, inspection-bound direct-media intent through the fail-closed policy gate and only then into the hardened direct downloader.

## Required chain
`inspection -> observed direct candidate -> single-use intent -> explicit authorization + protection review -> policy permit -> public-network guard -> direct download`

## Safety invariants
- No acquisition without an inspection-bound intent.
- No acquisition without explicit authorization.
- Any protection signal denies acquisition.
- The intent is exact-URL bound, short-lived, and single-use.
- HLS and DASH remain inspection-only.
- The downloader independently re-validates the policy permit and public-network target.
- No cookies, credentials, auth headers, redirect following, DRM handling, token extraction, or protection bypass is introduced.

## Acceptance criteria
- Web server has a direct-acquisition orchestration boundary.
- Policy denial occurs before intent consumption and before download/network work.
- Successful acquisition consumes the exact direct intent and passes the opaque permit to the downloader.
- Output is written only to the configured local download directory.
- CI passes typecheck, all regression tests, and production build.
