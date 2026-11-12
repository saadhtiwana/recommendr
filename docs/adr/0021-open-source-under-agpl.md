# ADR-0021: Open source under AGPL-3.0

- Status: Accepted
- Date: 2026-11-12

## Context

Recommendr is positioned as the **free, open-source alternative** to closed, enterprise-priced AI
visibility tools (Profound, Peec AI). The value is in the system (measurement statistics, the
shared observation layer, extraction, the fix plan), and it is run as a **network service**.
Two risks shape the license choice:

1. A well-funded company takes the code, hosts it as a closed SaaS with improvements it never
   shares, and competes using our own work. With permissive licenses, and even with GPL
   (whose obligations trigger on *distribution*, not on network use), that is legal.
2. Self-hosters, agencies and contributors need a real OSI-approved license: "source-available"
   licenses scare off contributors, packagers and some companies' legal review.

## Decision

- License the repository under **GNU AGPL-3.0-or-later**.
- `LICENSE` contains the **verbatim** AGPL-3.0 text, so GitHub and license scanners detect it
  correctly. The copyright notice **"Copyright (C) 2026 Malik Saad Hayat"** and the
  "or any later version" grant live in `NOTICE` (and in source headers where useful).
- The AGPL §13 network-use clause applies: anyone who **modifies** Recommendr and lets users
  interact with it over a network must offer those users the corresponding source. The app will
  show a "Source" link in the footer pointing to the running version's source.
- Contributions are accepted under **inbound = outbound** (AGPL-3.0-or-later) with a
  **Developer Certificate of Origin** sign-off (`git commit -s`), not a CLA.
- Generated artifacts (FAQ content, JSON-LD, llms.txt, drafts) are the user's output, not
  derivative works of the program. The docs say so explicitly so businesses aren't worried about
  publishing them.

## Alternatives considered

- **MIT / Apache-2.0:** maximum adoption and no friction for companies. Rejected: they allow
  closed hosted forks with zero reciprocity, which is exactly the competitive risk. Apache-2.0's
  patent grant is nice, but AGPL-3.0 has its own patent clause.
- **GPL-3.0:** copyleft, but the obligation triggers only on distribution; a SaaS never
  distributes, so it gives no protection for a hosted product.
- **BSL / FSL (Business Source / Functional Source License):** prevents competing hosted use
  for a period, then converts to open source. Rejected: not OSI-approved, so it contradicts the
  "free, open-source" positioning, puts off contributors, and confuses self-hosters about what's
  allowed.
- **Elastic License v2 / SSPL:** source-available, explicitly not open source; same objections,
  and SSPL is widely rejected by distributions.
- **Open core (open MIT core + proprietary features):** a common business model, but it splits the
  codebase and makes "which features are free?" a constant question. We may revisit this only for
  a hosted-only paid tier, via a superseding ADR.

### DCO vs CLA

- A **CLA** (copyright assignment or a broad license to the maintainer) would let the project
  **relicense** later (e.g. dual-license commercially). Rejected for now: it adds friction
  (signing, a bot, legal review at contributors' employers) and erodes trust ("they might close
  it later").
- **DCO** is a lightweight, per-commit statement that the contributor has the right to submit the
  code. Consequence: relicensing away from AGPL would need every contributor's consent. We accept
  that as a credible commitment to staying open.

## Consequences

- \+ Hosted forks must share their modifications; improvements flow back to the community.
- \+ OSI-approved, so self-hosters, distributions and contributors are comfortable.
- \+ A credible "free and open" story against closed competitors.
- − Some companies ban AGPL dependencies internally, so a few potential contributors or adopters
  are lost. Self-hosting for internal use is unaffected (no modification-and-network-service
  obligation unless they modify it and expose it to users).
- − No commercial relicensing without all contributors (DCO choice).
- − The "Source" link and version stamping must be built and kept accurate (phase 13).
- − Third-party dependencies must stay AGPL-compatible; a license check (e.g. `pip-licenses`,
  `license-checker`) runs in CI.

## Related

- [`LICENSE`](../../LICENSE), [`NOTICE`](../../NOTICE), [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
- [ADR-0024](0024-self-hosting-with-docker-compose.md) self-hosting
- system-design §1, §11
