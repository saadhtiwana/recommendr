# ADR-0005: Transactional outbox for step transitions

- Status: Accepted
- Date: 2026-11-12

## Context

A run advances through steps: `sample` jobs fan out per (question, engine), `extract` follows each
sample, `aggregate` must start exactly once when the **last** extraction finishes, then read
models, alerts and optional agents. Two failure windows exist if "save result" and "enqueue
next" are separate actions:

1. Result saved, crash before enqueue: the run stalls forever.
2. Next step enqueued, result rolled back: the next step runs on missing data.

External effects (emails, MCP notifications, alert delivery) have the same dual-write problem.

## Decision

**Step results and successor enqueues commit in the same transaction**, guarded by the fencing
token (ADR-0004):

```sql
BEGIN;
  SELECT set_config('app.org_id', :org, true);              -- RLS context (ADR-0014)
  INSERT INTO interpretations (...) VALUES (...);            -- step result
  UPDATE fanin_counters SET remaining = remaining - 1
    WHERE run_id = :run AND step = 'extract' RETURNING remaining;
  -- if remaining = 0:
  INSERT INTO jobs (kind, idempotency_key, ...) VALUES ('aggregate', 'run:' || :run || ':aggregate', ...)
    ON CONFLICT (idempotency_key) DO NOTHING;
  UPDATE jobs SET status = 'succeeded' WHERE id = :job AND fencing_token = :tok AND status = 'running';
  -- 0 rows → ROLLBACK
COMMIT;
```

- Because jobs live in the same database, the `jobs` table **is** the outbox for internal steps;
  no relay process is needed.
- **Deterministic idempotency keys** (`run:{id}:aggregate`, `run:{id}:alert`,
  `obs:{key}:extract:v{n}`) make re-enqueues no-ops, so retries and races are harmless.
- **Fan-in** uses a per-(run, step) counter row decremented in the same transaction; the job
  that brings it to 0 enqueues the successor. A retried job doesn't double-decrement because its
  first attempt either committed (and is never retried) or rolled back entirely.
- **External effects** are INSERTed into the `outbox` table in the same transaction; a dispatcher
  job sends them (at-least-once) with the outbox `idempotency_key` passed to the downstream API
  where supported, and marks `dispatched_at`.

## Alternatives considered

- **Enqueue after commit:** the crash window (1) above; needs a recovery sweeper that scans for
  stuck runs, which is more complex and slower than not having the window.
- **Two-phase commit / XA across DB and a broker:** not available on managed Postgres+broker
  combos in practice, operationally fragile.
- **Polling the run state for "all children done" (orchestrator loop):** works, but adds a
  scan per run, latency, and a singleton orchestrator to keep alive.
- **Event sourcing for runs:** powerful but heavyweight for a DAG with a handful of step types.

## Consequences

- \+ No stuck runs and no orphan steps by construction; easy invariants to test.
- \+ Retries are safe because enqueue is idempotent.
- − All step handlers must write through the shared unit of work (enforced by the handler base).
- − Fan-in counter rows are hot for very wide runs (thousands of children); acceptable at our
  width (~120-300 children per project run). Sharded counters are the fallback.
- − External effects are at-least-once; consumers must be idempotent (email dedupe keys, MCP
  notifications are advisory).

## Related

- ADR-0003 (Postgres queue), ADR-0004 (fencing), ADR-0020 (partial results at aggregate)
- system-design §5 (run lifecycle), §8e
