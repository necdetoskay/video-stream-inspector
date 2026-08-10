# Sprint 06 — Network Security Hardening

## Objective

Reduce SSRF and private-network exposure before any acquisition capability is exposed through the web application.

## Controls

- Web inspection accepts only HTTP(S).
- Credential-bearing URLs are rejected.
- `localhost` and `.localhost` targets are rejected.
- IPv4 loopback, private, link-local, carrier-grade NAT, documentation, benchmark, multicast, and reserved ranges are rejected.
- IPv6 loopback, unique-local, link-local, multicast, documentation, and IPv4-mapped ranges are rejected.
- DNS answers are fail-closed: if any resolved address is private/reserved, the hostname is rejected.
- The initial inspection URL is checked before Chromium navigation.
- Playwright request routing applies the same guard to redirects and subresources; disallowed requests are aborted.

## Known boundary

DNS resolution and Chromium connection are separate operations, so DNS rebinding/time-of-check-to-time-of-use hardening remains a production follow-up. The current controls substantially reduce accidental/private-network access but are not represented as a complete sandbox boundary.

The downloader is not exposed through the web application. Before future download wiring, the same or stronger network policy must be enforced at acquisition time.

## Verification

- Public IPv4 and IPv6 accepted.
- Loopback/private/link-local IPv4 and IPv6 denied.
- Localhost names denied.
- Private DNS answer denied.
- Mixed public/private DNS answers denied.
- Public-only DNS answer accepted.
- Credential-bearing URL denied.
- Existing browser/media/web/policy/downloader regression suite remains green.
- Next.js production build remains green.
