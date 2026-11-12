# Security Policy

Recommendr stores other people's AI provider API keys and multi-tenant business data, so we take
security reports seriously and appreciate responsible disclosure.

## Reporting a vulnerability

**Do not open a public issue, discussion or pull request.**

Report privately through GitHub's private vulnerability reporting:
**[Report a vulnerability](https://github.com/saadhtiwana/recommendr/security/advisories/new)**.

Please include:

- a description of the issue and its impact,
- steps to reproduce or a proof of concept (against your own self-hosted instance, never other users' data),
- affected version or commit, and deployment type (hosted or self-hosted).

## What to expect

| Step | Target |
|------|--------|
| Acknowledgement | within 3 business days |
| Initial assessment and severity | within 7 days |
| Fix for critical/high issues | within 30 days, coordinated with you |
| Public advisory | after a fix is available, crediting you unless you prefer otherwise |

## Scope

In scope: this repository, and the official hosted instance when there is one. Of particular
interest: cross-tenant data access (RLS bypass), API key vault exposure (keys returned, logged or
decryptable without the master key), SSRF in the website auditor, auth/session flaws, and
leakage of tenant-private questions into the shared observation layer or the public index.

Out of scope: denial of service through volume, social engineering, findings that need a
compromised host, and missing hardening headers without a demonstrated impact.

## Safe harbor

We won't pursue legal action for good-faith research that follows this policy: test only
against your own accounts or self-hosted instances, don't access or change other users' data,
avoid degrading the service, and give us reasonable time to fix before disclosure.

## Supported versions

Before 1.0, only the latest release and `main` get security fixes.
