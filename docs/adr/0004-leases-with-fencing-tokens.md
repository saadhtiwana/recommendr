# ADR-0004: Leases with fencing tokens

- Status: Accepted
- Date: 2026-11-12

## Context

Workers can crash (lost lease, job must be retried) or, worse, **pause and come back**: a long GC
pause, a VM freeze, a network partition to Neon, or an event loop blocked by a slow call. If the
lease expired meanwhile, the reaper hands the job to another worker. When the first worker wakes,
it still believes it owns the job (a **zombie**) and may write results a second time, overwrite
newer results, or double-enqueue successors. Leases alone can't prevent this, because the zombie
doesn't know its lease expired.

## Decision

Every claim increments `jobs.fencing_token` (system-design §8e). The worker carries
`(job_id, token)` and:

1. **Heartbeats** every 20 s for a 60 s lease:
   `UPDATE jobs SET lease_expires_at = now() + interval '60 seconds'
    WHERE id = :id AND fencing_token = :tok AND status = 'running'`.
   0 rows means the lease was lost, so the handler is cancelled.
2. **Commits** its result in one transaction ending with the guarded completion:

```sql
UPDATE jobs SET status = 'succeeded', lease_owner = NULL, updated_at = now()
WHERE id = :id AND fencing_token = :tok AND status = 'running';
-- rowcount = 0  →  ROLLBACK (results, fan-in decrement, successor enqueues all discarded)
```

3. **Mid-job writes** (observation claims, observations, quota reservations) are guarded the same
   way: they either run in a transaction that checks the token first, or carry the token in a
   conditional statement (e.g. `observation_claims` stores `fencing_token`, and takeovers require a
   strictly higher token).
4. **External side effects can't be fenced**, so they are made **idempotent**: provider calls use
   the key `(run_id, question_id, engine, sample_index)` (the observation primary key rejects a
   second insert), ledger entries carry unique idempotency keys (ADR-0010), and outbox messages
   are deduped by key (ADR-0005).

Lease length (60 s) is > 2 heartbeats + max expected DB stall, so a healthy but slow worker
doesn't lose its lease. A provider call (~12 s average) never spans a lease without heartbeats.

## Alternatives considered

- **Leases only (visibility timeouts, as in SQS/Celery):** at-least-once with no protection against
  late writes from zombies; correctness would depend on every write being idempotent and
  commutative, which "overwrite the aggregate" and "enqueue successor" are not.
- **Postgres advisory locks held for the job's duration:** session-scoped, so they're incompatible
  with transaction pooling, released on disconnect (good) but invisible to a worker that is
  partitioned and still writing through another connection.
- **`SELECT ... FOR UPDATE` held for the whole job:** keeps a transaction open for minutes,
  blocking vacuum, holding connections, and losing all work on any error.
- **Distributed lock service (etcd/ZooKeeper):** correct with fencing, but it's another system; the
  token already lives naturally in the row we update.

## Consequences

- \+ Zombie writes are rejected atomically; "exactly-once effect" for everything inside Postgres.
- \+ Simple to test: chaos tests pause/kill workers mid-job and assert no duplicates or lost results.
- − Every handler must route its writes through the fenced unit of work; enforced by the job
  handler base class (handlers never get a raw session).
- − A zombie can still waste one provider call (money). It is captured in the ledger, so
  accounting stays correct.
- − Heartbeats add ~1 small UPDATE per running job per 20 s (negligible: ~130 running jobs at
  peak is ~7 statements/s).

## Related

- ADR-0003 (queue), ADR-0005 (outbox), ADR-0007 (observation claims), ADR-0010 (ledger idempotency)
- system-design §8e, §9 (worker crash, zombie worker)
