# Architecture

## System intent

Video Stream Inspector is a local-first inspection tool. It separates observation from acquisition so that discovering a media endpoint never automatically implies permission to download it.

## Components

### `apps/web`
User-facing Next.js application. Accepts a URL, starts an inspection, and presents normalized findings and policy decisions.

### `packages/browser`
Owns Playwright lifecycle and browser instrumentation. It may observe requests, responses, frames, DOM media elements, and navigation events. It must not contain download policy.

### `packages/media`
Pure media classification and normalization. It identifies direct files, HLS manifests, DASH manifests, MIME types, likely quality/resolution metadata, and confidence/reason fields.

### `packages/analyzer`
Coordinates browser observations and media classification into an `InspectionReport`. It is read-oriented: discovery alone must never write media to disk.

### `packages/policy`
Defines whether an acquisition request is allowed. Initial policy is fail-closed: blocked/unknown protection signals prevent downloading. No DRM bypass, credential extraction, token forging, paywall bypass, or access-control circumvention is supported.

### `packages/downloader`
Performs permitted downloads only after receiving an explicit allow decision from `packages/policy`. Future FFmpeg integration belongs here.

### `fixtures/media-site`
Deterministic local pages used for E2E verification: direct MP4, HLS, DASH, delayed JavaScript media loading, and blocked/protected simulations.

## Core flow

```text
URL
  -> browser observation
  -> media candidate extraction
  -> media classification
  -> InspectionReport
  -> user requests acquisition
  -> policy evaluation
      -> denied: explain reason
      -> allowed: downloader
```

## Non-goals

- DRM circumvention or decryption.
- Forging or stealing authorization tokens.
- Circumventing authentication, paywalls, geographic restrictions, or other access controls.
- Building site-specific piracy extractors.

## Architectural rules

1. Analyzer is side-effect free with respect to media acquisition.
2. Downloader requires a positive policy decision.
3. Unknown protection state is not equivalent to permission.
4. Browser instrumentation records only data necessary for media inspection and debugging.
5. Third-party websites are never required for automated tests; fixtures are canonical.
6. Results must explain how each candidate was found and why it was classified.

## Initial domain model

```ts
type MediaKind = "direct" | "hls" | "dash" | "unknown";

type MediaCandidate = {
  url: string;
  kind: MediaKind;
  mimeType?: string;
  source: "network" | "dom" | "script";
  confidence: number;
  reasons: string[];
};

type ProtectionSignal = {
  kind: "drm" | "auth" | "signed-url" | "unknown";
  evidence: string;
};

type InspectionReport = {
  pageUrl: string;
  finalUrl: string;
  candidates: MediaCandidate[];
  protectionSignals: ProtectionSignal[];
};
```

The model will evolve through ADRs rather than silently changing cross-package contracts.
