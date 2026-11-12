# ADR-0001: Modular monolith over microservices

- Status: Accepted
- Date: 2026-11-12

## Context

Recommendr's hard problems are measurement statistics, provider cost, correctness under failure
(crashes, zombie workers, provider outages) and tenant isolation. None of them is about scaling
independently deployed teams. The project starts with one maintainer, is open source (AGPL-3.0,
ADR-0021) and must be self-hostable with one `docker compose up` (ADR-0024). Load at the planning
scale (500 orgs, 2,000 projects) is ~10.7 provider calls/s and ~125 DB statements/s
(system-design §4), which one database and a handful of processes handle easily.

Most of the correctness guarantees we need are *transactional*: a step's result and the
enqueueing of its successors commit together (ADR-0005), a stale fencing token rolls back a whole
job's writes (ADR-0004), and budget authorization is a conditional UPDATE plus a ledger INSERT
(ADR-0010). Those are one-transaction properties in a single Postgres, and distributed-saga
properties across services.

## Decision

Build **one FastAPI codebase** on **one Postgres (Neon)**, deployed as three process types:

| Process | Entrypoint | Role |
|---|---|---|
| web | `uvicorn app.main:app` | REST API `/v1`, MCP `/mcp`, auth, reads of read models |
| worker | `python -m app.worker` | claims and executes workflow jobs (sampling, extraction, aggregation, agents) |
| scheduler | `python -m app.scheduler` | cron: enqueues due runs and maintenance jobs idempotently |

Internally the code is split into modules (`auth`, `orgs`, `projects`, `prompts`, `engines`,
`observations`, `runs`, `extraction`, `scoring`, `facts`, `audits`, `fixes`, `reports`,
`billing` (keys, quotas and usage), `alerts`, `workflow`, later `agents`, `mcp`). Rules:

- Each module **owns its tables**. Other modules call its **service interface** (typed Python
  functions with pydantic DTOs), never its tables or ORM models.
- Enforced in CI by an import-linter contract (no `from app.<other>.models import ...` outside
  the owning module; `scoring` is pure and imports nothing from the DB layer).
- Cross-module work that must be atomic shares the caller's `AsyncSession` through the service
  call; it never opens a second connection.

## Alternatives considered

- **Microservices (e.g. sampling service, extraction service, API service, billing service).**
  Rejected: every guarantee above becomes a distributed one (outbox per service, sagas,
  idempotent consumers everywhere), with network hops, versioned contracts, and N deployables for
  self-hosters. That is a lot of operational cost and no benefit at our scale.
- **Unstructured monolith ("just a Django-style app").** Rejected: without enforced boundaries
  the observation layer (global, non-tenant) and the interpretation layer (tenant, RLS) would
  blur, which is exactly the privacy boundary we must never blur (ADR-0007). It would also make the
  later split in system-design §10 a rewrite rather than an extraction.
- **Serverless functions per step.** Rejected: cold starts, execution time limits that are hostile
  to 12 s+ provider calls with adaptive sampling, and no clean self-hosting story.

## Consequences

- \+ Atomic multi-step guarantees are ordinary database transactions.
- \+ One image, three commands: identical on Render and in Docker Compose.
- \+ Fast local development and simple debugging (one process tree, one log stream).
- \+ Module interfaces are seams: the observation layer is the first candidate to split out at
  100x (system-design §10).
- − One deploy ships everything; a bad change in one module can take down the API. Mitigated
  by tests, CI gates, and separate process types (a worker bug doesn't crash the web process).
- − Discipline required: boundaries are enforced by lint rules, not by the network.
- − Process types scale independently, modules don't (fine until 100x).

## Related

- ADR-0002 (stack), ADR-0003 (Postgres as queue), ADR-0005 (outbox), ADR-0019 (hosting), ADR-0024 (self-hosting)
- system-design §5 (architecture), §10 (scaling: when to split)
