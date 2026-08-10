# Sprint 00 — Foundation

## Objective

Create a clean, testable repository foundation for Video Stream Inspector before implementing browser automation or downloads.

## Scope

- Define project purpose and explicit non-goals.
- Establish pnpm workspace layout.
- Define analyzer/browser/media/policy/downloader boundaries.
- Record a roadmap that grows functionality in testable increments.
- Establish deterministic local fixtures as the canonical E2E source.

## Acceptance criteria

1. `README.md` explains the lawful-use boundary and project goals.
2. `docs/architecture.md` documents the one-way inspection → policy → acquisition flow.
3. `docs/roadmap.md` defines staged delivery through production hardening.
4. Workspace root scripts exist for build, test, lint, and typecheck orchestration.
5. No code path for DRM bypass, credential extraction, token forging, or access-control circumvention is introduced.
6. Future automated tests are explicitly independent from third-party movie/streaming sites.

## Deliverables

- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/sprints/sprint-00-foundation.md`
- `.gitignore`

## Exit decision

Sprint 00 is complete when the foundation commit is present on `main` and its files can be fetched back from GitHub. Sprint 01 then begins with pure media classification and deterministic fixtures.
