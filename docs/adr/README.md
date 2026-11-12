# Architecture Decision Records

One file per significant decision: Context, Decision, Alternatives considered, Consequences.
Decisions are **superseded, never silently changed**: a changed decision gets a new ADR, and the old
one is marked "Superseded by ADR-NNNN". The design these decisions add up to is described in
[`../system-design.md`](../system-design.md).

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-modular-monolith.md) | Modular monolith over microservices | Accepted |
| [0002](0002-fastapi-and-nextjs.md) | FastAPI backend + Next.js frontend | Accepted |
| [0003](0003-postgres-as-job-queue-and-workflow-store.md) | Postgres (Neon) as the job queue and workflow store | Accepted |
| [0004](0004-leases-with-fencing-tokens.md) | Leases with fencing tokens | Accepted |
| [0005](0005-transactional-outbox.md) | Transactional outbox for step transitions | Accepted |
| [0006](0006-weighted-fair-scheduling.md) | Weighted fair scheduling across tenants | Accepted |
| [0007](0007-shared-observation-layer.md) | Shared observation layer with tenant interpretation layer | Accepted |
| [0008](0008-wilson-intervals-and-adaptive-sampling.md) | Sampling with Wilson intervals and adaptive stopping | Accepted |
| [0009](0009-change-detection-with-benjamini-hochberg.md) | Change detection with Benjamini-Hochberg FDR control | Accepted |
| [0010](0010-budget-reservations.md) | Budget reservations (authorize/capture) | Accepted |
| [0011](0011-aimd-adaptive-concurrency.md) | AIMD adaptive concurrency per provider and credential | Accepted |
| [0012](0012-entity-resolution-cascade.md) | Entity resolution cascade | Accepted |
| [0013](0013-immutable-observations-lineage-backfills.md) | Immutable observations, lineage and backfills | Accepted |
| [0014](0014-row-level-security-with-set-local.md) | Postgres Row-Level Security with per-transaction tenant context | Accepted |
| [0015](0015-partitioning-rollups-cqrs.md) | Partitioning, rollups and CQRS read models | Accepted |
| [0016](0016-r2-parquet-archival-with-duckdb.md) | Archive old observations to R2 as Parquet, query with DuckDB | Accepted |
| [0017](0017-ssrf-hardened-website-auditor.md) | SSRF-hardened website auditor | Accepted |
| [0018](0018-provider-apis-as-measurement-source.md) | Provider APIs with web search as the measurement source, with honest limitations | Accepted |
| [0019](0019-render-and-neon-hosting.md) | Render + Neon hosting for the official hosted instance | Accepted |
| [0020](0020-partial-results-instead-of-zeros.md) | Partial results instead of zeros on provider failure | Accepted |
| [0021](0021-open-source-under-agpl.md) | Open source under AGPL-3.0 | Accepted |
| [0022](0022-byok-envelope-encryption.md) | Bring-your-own-keys with envelope encryption | Accepted |
| [0023](0023-free-tier-with-platform-spend-cap.md) | Free tier with a global platform spend cap | Accepted |
| [0024](0024-self-hosting-with-docker-compose.md) | Self-hosting via Docker Compose | Accepted |
| [0025](0025-public-visibility-index.md) | Public visibility index built only from public shared observations | Accepted (future phase: "public visibility index and launch") |
| [0026](0026-shared-tool-registry.md) | Shared tool registry for the internal agent and the MCP server | Accepted |
| [0027](0027-agent-safety.md) | Agent safety: budgets, approvals, grounding and tracing | Accepted |
| [0028](0028-prompt-injection-defenses.md) | Prompt injection defenses for untrusted content | Accepted |
| [0029](0029-mcp-server-transport-and-authorization.md) | MCP server transport and authorization | Accepted |
| [0030](0030-closed-loop-fix-publishing.md) | Closed-loop fix publishing with human approval | Accepted (later phase) |

Grouped by theme:

- **Architecture and hosting:** 0001, 0002, 0019, 0024
- **Reliability (workflow engine):** 0003, 0004, 0005, 0006, 0020
- **Cost:** 0007, 0010, 0011, 0023
- **Measurement and correctness:** 0008, 0009, 0012, 0013, 0018
- **Data, tenancy and security:** 0014, 0015, 0016, 0017, 0022
- **Open source and community:** 0021, 0025
- **Agents and MCP:** 0026, 0027, 0028, 0029, 0030
