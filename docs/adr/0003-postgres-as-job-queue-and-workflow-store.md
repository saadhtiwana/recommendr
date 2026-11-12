# ADR-0003: Postgres (Neon) as the job queue and workflow store

- Status: Accepted
- Date: 2026-11-12

## Context

A run is a DAG of steps (discover/fan-out -> sample -> extract -> aggregate -> project read models
-> alert -> optional background agents). We need durable jobs, leases, retries with backoff,
dead-lettering, fair scheduling across tenants (ADR-0006) and, above all, **atomicity between job
state and the data the job produces** (ADR-0004, ADR-0005). Planning load is ~200-250k jobs/day
(~3 jobs/s), system-design §4. Self-hosters should need nothing but Postgres (ADR-0024).

## Decision

Use **Postgres as the queue and workflow store**. The `jobs` table holds `status`, `priority_class`,
`org_id`, `virtual_finish`, `run_after`, `attempts`, `max_attempts`, `lease_owner`,
`lease_expires_at`, `fencing_token`, `idempotency_key` (UNIQUE), `last_error`, `payload`.

Claiming (worker role, **direct** Neon connection):

```sql
WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'queued' AND run_after <= now()
  ORDER BY priority_class, virtual_finish
  LIMIT :batch
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs j
SET status = 'running', lease_owner = :worker, lease_expires_at = now() + interval '60 seconds',
    fencing_token = j.fencing_token + 1, attempts = j.attempts + 1
FROM next WHERE j.id = next.id
RETURNING j.*;
```

Supporting index: `jobs_claim ON jobs (priority_class, virtual_finish) WHERE status = 'queued'`
(partial, so it stays small). A reaper requeues expired leases. Retries use exponential backoff
with full jitter (base 5 s, cap 1 h). Terminal rows are purged after 14 days.

**No LISTEN/NOTIFY.** Workers poll with **adaptive backoff** (0.5 s doubling to 60 s in
production, 10 min self-hosted; reset after a successful claim), because:

1. LISTEN needs a session-level connection; it doesn't work through Neon's **transaction pooler**
   (PgBouncer in transaction mode), and holding direct connections open just to listen wastes them.
2. Constant polling or permanently open listening connections would prevent Neon from
   **auto-suspending** idle compute (preview branches, small self-hosted installs, early days).
   Backoff lets the database sleep when there's no work.

Latency cost: an idle-to-busy transition can wait up to the current backoff. Interactive work
(on-demand runs, agent tool calls) is enqueued by the API, which then nudges latency by
lowering the backoff ceiling while interactive jobs are pending (`priority_class` 0).

## Alternatives considered

- **Redis + Celery (or RQ/Dramatiq):** popular and fast, but a second stateful system; the job
  state and the job's results live in different stores, so "result committed and next step
  enqueued" is no longer atomic (needs an outbox anyway). Celery's visibility-timeout semantics
  give at-least-once without fencing; fair queuing across tenants is not built in.
  Self-hosters would need Redis too.
- **AWS SQS (+ Step Functions):** managed and durable, but no transactions with our DB (outbox
  required), 15-min visibility max per receive, vendor lock-in, and impossible to self-host
  without AWS. Fair scheduling across tenants would need one queue per org or a custom layer.
- **Temporal:** the strongest workflow semantics (durable execution, timers, signals). Rejected
  for now: a large additional cluster (or a paid cloud) to operate, a new programming model, and
  a heavy self-hosting burden. It's the leading candidate at 100x if workflows outgrow our model
  (system-design §10).
- **pg-boss/Graphile Worker/procrastinate-style libraries:** similar idea; we'd still need custom
  fencing, fair queuing and outbox semantics, so we implement the small core ourselves on the
  same table design (procrastinate remains a reference).

## Consequences

- \+ One system to run, back up and reason about; atomic job/state transitions (ADR-0005).
- \+ Fencing tokens are just a column checked in the same transaction (ADR-0004).
- \+ Weighted fair queuing is one ORDER BY on an indexed tag (ADR-0006).
- \+ Self-hosting needs only Postgres.
- − Job churn creates dead tuples and vacuum pressure; mitigated by partial indexes, a 14-day
  purge, autovacuum tuning, and daily partitioning of `jobs` at 10x.
- − Polling adds pickup latency (bounded by backoff) and a small baseline load.
- − A ceiling exists. Move the queue off Postgres when p99 claim latency > 100 ms, jobs exceed
  ~30% of DB write load, or autovacuum can't keep up (system-design §10).

## Related

- ADR-0004 (fencing), ADR-0005 (outbox), ADR-0006 (fair scheduling), ADR-0014 (pooler and RLS), ADR-0019 (Neon)
- system-design §8e, §9, §10
