# ADR-0006: Weighted fair scheduling across tenants

- Status: Accepted
- Date: 2026-11-12

## Context

Tenants differ by orders of magnitude: an agency can track 50 projects × 100 questions × 4
engines, a local bakery 1 project × 10 questions. With FIFO, a large agency's nightly batch
(tens of thousands of jobs) would delay every small customer's run by hours, breaking the run
completion SLO (99% terminal within 6 h, system-design §3). Free-tier work runs on a capped
platform budget and must never crowd out BYOK users (ADR-0023), but should not starve either.
Interactive work (on-demand checks, agent tool calls) needs to jump ahead of scheduled batches.

## Decision

**Start-time fair queuing (SFQ) implemented as a sort key on the jobs table**, plus a small number
of strict priority classes.

At enqueue (same transaction as the job INSERT):

```
V            = virtual time = virtual_finish of the most recently claimed job (stored in a 1-row table,
               updated lazily by claimers)
start        = max(org_sched.last_finish[org], V)
virtual_finish = start + est_cost(job) / weight(org)
org_sched.last_finish[org] = virtual_finish
```

Claim order: `ORDER BY priority_class, virtual_finish` with the partial index
`(priority_class, virtual_finish) WHERE status = 'queued'` (ADR-0003). One index scan, no
per-org loops.

- **Weights:** BYOK orgs 1.0; free tier **0.25** (lower priority, never starved); system work
  (backfills, archival) 0.1. Weights are config, not schema.
- **priority_class:** 0 interactive (on-demand runs, agent tools), 1 scheduled runs,
  2 maintenance/backfills. Strict between classes, fair within a class. Class 0 is rate-limited
  per org to prevent abuse of "interactive" as a fast lane.
- **est_cost** is in "provider call units" (sample jobs ≈ expected samples; extraction ≈ 0.2), so
  fairness is about the scarce resource (provider calls), not job count.
- Retries keep their original tag (no penalty and no jump ahead); `run_after` handles backoff.
- Per-provider AIMD limits (ADR-0011) apply after claim; a job that can't get a provider slot is
  re-queued with a short `run_after` without losing its tag.

## Alternatives considered

- **FIFO:** simple; large tenants starve small ones (the problem itself).
- **Per-org queues with round-robin claiming:** fair, but claiming means scanning orgs with work
  (N queries or a `DISTINCT ON` over orgs), which gets expensive with thousands of orgs and
  doesn't express weights cleanly.
- **Strict priority by plan:** starves the lower tier under sustained load (free tier would get
  nothing on busy days).
- **Deficit round robin in a worker-side scheduler:** needs a central scheduler process holding
  state; harder with N stateless workers.
- **Rate-limit large orgs at enqueue:** wastes capacity when the system is idle.

## Consequences

- \+ Small orgs' jobs are tagged near virtual time and get picked within seconds even during a
  huge agency batch; big orgs still use all idle capacity (work-conserving).
- \+ Free tier yields gracefully under load without starving.
- \+ Implemented in SQL with one index; testable with a deterministic simulator (phase 3).
- − Tags depend on cost estimates; bad estimates skew fairness (estimates are refreshed from the ledger).
- − The `org_sched` row per org is updated at every enqueue (hot for a single huge enqueue);
  mitigated by computing tags for a batch enqueue in one statement.
- − Fairness is approximate across priority classes by design.

## Related

- ADR-0003 (queue), ADR-0011 (AIMD), ADR-0023 (free tier priority)
- system-design §3 (run completion SLO), §8e
