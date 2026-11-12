# ADR-0017: SSRF-hardened website auditor

- Status: Accepted
- Date: 2026-11-12

## Context

The website AI-readiness audit, the fix writer and agent tools fetch **user-supplied URLs** from
our infrastructure: robots.txt, sitemaps, pages, llms.txt. A malicious user (or a prompt-injected
page, ADR-0028) can point us at `http://169.254.169.254/` (cloud metadata credentials),
`http://localhost:5432`, internal Render services, or a domain whose DNS later **rebinds** to a
private IP after validation. Redirects can bounce a "safe" URL to an internal one. Huge or
compressed responses can exhaust memory.

## Decision

All outbound fetching of user-influenced URLs goes through **one** hardened client
(`audits.fetcher`), and nothing else is allowed to make such requests (lint rule + review).

1. Allow only `http`/`https`, ports 80/443, no userinfo in URLs; IDNA-normalize hosts.
2. Resolve DNS ourselves and **reject if any** address is loopback, private (10/8, 172.16/12,
   192.168/16), CGNAT (100.64/10), link-local (169.254/16, including metadata), 0/8, multicast,
   reserved, broadcast, IPv6 loopback/unique-local (fc00::/7)/link-local (fe80::/10), or
   IPv4-mapped/6to4/NAT64 encodings of those (Python `ipaddress` + explicit checks).
3. **Pin** the TCP connection to the validated IP (custom transport), sending the original
   `Host` header and TLS SNI. A second DNS lookup can't change the target (rebinding defense).
4. Redirects followed **manually**, max 5, re-running steps 1 to 3 on every hop.
5. Limits: connect 3 s, total 10 s, body 2 MB streamed (also caps decompressed size), ≤ 50
   pages per audit, 1 req/s per host.
6. Fetch and obey `robots.txt` for our user agent:
   `RecommendrAuditBot/1.0 (+https://recommendr.app/bot)`. We report the site's rules for AI
   crawlers; we don't impersonate them.
7. Runs only in workers (never in the web process); egress logs record the URL, resolved IP and
   outcome.

```python
async def fetch(url: str) -> FetchResult:
    for hop in range(MAX_REDIRECTS + 1):
        target = validate_url(url)                 # scheme, port, host normalization
        ip = await resolve_and_check(target.host)  # all A/AAAA must be public
        resp = await client.get_pinned(target, ip, limits=LIMITS)
        if not resp.is_redirect: return resp
        url = urljoin(url, resp.headers["location"])
    raise TooManyRedirects
```

## Alternatives considered

- **Plain httpx with a hostname blocklist:** bypassable via DNS rebinding, redirects, decimal or
  IPv6 encodings.
- **Egress proxy (e.g. smokescreen) only:** good defense in depth and a candidate later, but an
  extra service for self-hosters; we keep in-process checks and may add a proxy in hosted
  production.
- **Third-party crawling API:** cost, and it would ship customer URLs to another processor; a
  dependency for a core feature.
- **Headless browser:** needed only for JS-rendered sites; much larger attack surface. Deferred,
  and if added it must run sandboxed behind the same egress policy.

## Consequences

- \+ Closes SSRF, rebinding and redirect-chain attacks, including those driven by prompt injection.
- \+ Polite and transparent crawling builds trust with site owners.
- − No JavaScript rendering: some single-page-app sites audit as "not crawlable". That's arguably
  the correct finding, since many AI crawlers don't render JS either.
- − Custom transport code needs thorough tests (table-driven tests of address classes, a fake DNS
  rebinding resolver, redirect chains).

## Related

- [system-design §8k](../system-design.md#k-ssrf-safe-crawling-adr-0017), [ADR-0028](0028-prompt-injection-defenses.md)
