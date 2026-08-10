# Sprint 08 — Web Acquisition Wiring

## Goal

Wire the web inspection flow toward permitted direct-file acquisition without turning the downloader into a general-purpose arbitrary URL endpoint.

## Required chain

1. User inspects a public page URL.
2. Inspector returns observed candidates.
3. Only an observed `direct` candidate may enter acquisition preparation.
4. The user must make an explicit authorization assertion (`owned`, `permission`, or `public-domain`).
5. The server re-evaluates the acquisition policy.
6. The server binds any acquisition intent to the exact inspected candidate URL and media kind.
7. The downloader still performs its own public-network validation immediately before fetch.
8. No caller-supplied cookies, authorization headers, bearer tokens, or browser credentials are accepted.

## Fail-closed rules

- HLS and DASH remain discovery-only in this sprint.
- Candidates with protection/authentication uncertainty must not receive an acquisition intent.
- A raw client-supplied media URL must never be sufficient to invoke the downloader.
- Acquisition intents must be opaque and unforgeable, and must bind to the exact candidate.
- The downloader's existing opaque policy permit and public-network guard remain mandatory.

## Acceptance criteria

- [ ] web UI can explicitly capture the user's authorization basis for a direct candidate
- [ ] server creates an opaque candidate-bound acquisition intent only for an eligible inspected direct candidate
- [ ] forged or URL-swapped intents are rejected
- [ ] HLS/DASH candidates cannot receive an acquisition intent
- [ ] private/reserved targets remain blocked at acquisition time
- [ ] no credentials/tokens can be injected into acquisition requests
- [ ] tests cover allow, no-authorization, forged intent, URL swap, non-direct candidate, and private-network rejection
- [ ] full CI and production build remain green

## Explicit non-goals

- DRM circumvention
- authenticated-session extraction
- cookie/header replay
- signed-token harvesting
- HLS/DASH downloading
- FFmpeg integration

## Next implementation step

Introduce a server-side acquisition-intent capability that is derived from an inspection result rather than from an arbitrary download URL. The intent will become the only web-facing path that can reach the direct downloader.
