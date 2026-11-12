# ADR-0025: Public visibility index built only from public shared observations

- Status: Accepted (future phase: "public visibility index and launch")
- Date: 2026-11-12

## Context

The shared observation layer (ADR-0007) accumulates public AI answers to common questions
("best CRM for small agencies", "best dentist in Austin"). Publishing aggregate, statically
generated pages per category ("Who AI recommends for X, November 2026") is useful to the public,
shows the methodology working, and is good discovery for an open-source project. It is also the
place where a privacy mistake would be most visible: a page could reveal **what a specific tenant
is tracking** or contain private data.

## Decision

Build the index **only** from the global shared observation layer, under these rules:

1. **Only shareable questions:** questions marked tenant-private (by the user or the classifier)
   are never eligible; they are never in the shared layer to begin with.
2. **Only public-eligible questions:** a question qualifies if it is from the platform's
   **curated category question set**, *or* it is tracked by **≥ 5 distinct orgs** (k-anonymity
   with k = 5), so the index never reveals a single tenant's interest. Org counts are computed
   from hashes; tenant identities are never read into the index pipeline.
3. **PII screening:** an automated PII classifier screens questions and answer excerpts; new
   categories get manual review before their first publication.
4. **Never** built from interpretations, verified facts, private observations, alerts, agent
   traces or any tenant-scoped table. Entity extraction for the index is the **global**,
   brand-agnostic extraction.
5. **Methodology and uncertainty on every page:** sample sizes, Wilson intervals, engines and
   models, dates, and the limits of API-based measurement (ADR-0018).
6. **Statically generated** (Next.js SSG/ISR) and exemplary for crawlers: semantic HTML,
   JSON-LD, llms.txt entries.
7. **Corrections and removal:** businesses can request a correction or removal of their listing
   through a documented process; requests are logged and handled within a stated time.
8. Disabled on self-hosted instances (ADR-0024).

## Alternatives considered

- **No public index:** zero privacy risk, but loses a strong discovery channel and a public proof
  of the methodology. Rejected, as long as the rules above hold.
- **Include tenant-tracked questions without k-anonymity:** would expose what individual
  businesses (or their agencies) are tracking, which is competitive intelligence about our users.
  Rejected.
- **Use tenant interpretations (brand-level metrics):** those are tenant data and depend on
  tenant configuration (aliases, competitors). Rejected.
- **Dynamic (server-rendered on request) pages:** unnecessary load and worse crawlability than
  static pages; the data changes weekly at most.
- **Opt-in by tenants to contribute questions:** adds consent UI for little gain; k-anonymity
  plus the curated set already protects tenants. We may still add an opt-out for the
  k-anonymity path.

## Consequences

- \+ Public, crawlable pages that demonstrate the product and its statistical honesty.
- \+ Built from data we already collect; no extra provider spend for curated questions shared
  with tenants.
- − Needs a PII classifier, review workflow and a correction/removal process before launch.
- − Small categories may not reach k = 5, so coverage starts with the curated set.
- − Publishing "who AI recommends" invites disputes from businesses; clear methodology and a fast
  correction path are required.

## Related

- [ADR-0007](0007-shared-observation-layer.md), [ADR-0018](0018-provider-apis-as-measurement-source.md), [ADR-0024](0024-self-hosting-with-docker-compose.md)
- system-design §8o
