# ADR-0011: AIMD adaptive concurrency per provider and credential

- Status: Accepted
- Date: 2026-11-12

## Context

Sampling issues about 10.7 provider calls/s on average, with roughly 130 in flight and 260 at peak
(system-design §4), spread over four providers (OpenAI, Google, Perplexity, Anthropic). Each
provider rate-limits **per API key** (requests/min, tokens/min, sometimes concurrent requests),
and the limits:

- differ by provider, model, account tier and over time (they are raised as an account's spend grows);
- are mostly undocumented for web-search/grounding tools;
- are per **credential**. With BYOK (ADR-0022) every org's key has its own limit, and the
  platform free-tier key (ADR-0023) has another.

Several worker processes run concurrently, so a limit enforced inside one process isn't enough.
A 429 storm, where every worker retries at once, can collapse throughput and burn
retries.

## Decision

Use **AIMD (additive increase, multiplicative decrease)** concurrency control per
**(provider, credential scope)**, where the scope is `platform` or `byok:<key_id>`, coordinated
through Postgres.

```sql
provider_limits(provider text, credential_scope text,
                concurrency_limit real NOT NULL DEFAULT 4, in_flight int NOT NULL DEFAULT 0,
                max_limit real NOT NULL, last_decrease_at timestamptz, updated_at timestamptz,
                PRIMARY KEY (provider, credential_scope))
provider_slots(job_id uuid PRIMARY KEY, provider text, credential_scope text, acquired_at timestamptz)
```

```
acquire:  UPDATE provider_limits SET in_flight = in_flight + 1
          WHERE provider=$1 AND credential_scope=$2 AND in_flight < floor(concurrency_limit)
          RETURNING ...                          -- 0 rows → wait with jittered backoff
          INSERT INTO provider_slots(job_id, ...)  -- same transaction; lets the reaper reclaim leaks
release (success):  in_flight -= 1, limit = min(max_limit, limit + 1/limit)          -- ≈ +1 per window
release (429, timeout, 529/overloaded):
          in_flight -= 1,
          limit = CASE WHEN last_decrease_at < now() - window THEN greatest(1, limit * 0.5) ELSE limit END,
          last_decrease_at = now()               -- at most one halving per window
          + honor Retry-After: the job's run_after ≥ Retry-After
```

- Initial limit 4, `max_limit` per provider from config (default 64).
- **One halving per window** (window ≈ p50 latency, 15 s) so a burst of 429s caused by a single
  overload event doesn't collapse the limit to 1.
- Slots leaked by crashed workers are reclaimed by the lease reaper (ADR-0004) via
  `provider_slots.job_id`.
- Rows for revoked/idle BYOK scopes are garbage-collected after 30 days of inactivity.

## Alternatives considered

- **Fixed concurrency per provider:** simple, but either too low (wastes capacity on high-tier
  keys) or too high (429 storms on new or low-tier keys). Limits differ per BYOK key, so one
  number can't fit.
- **Token buckets with configured rates:** need to know each key's limit, which we usually don't.
  They also control rate rather than concurrency, while latency with web search varies 3 to 30 s.
- **Per-process AIMD:** no coordination, so N workers together overshoot N-fold.
- **Global (per-provider) AIMD scope:** one org's low-tier BYOK key returning 429 would throttle
  everybody else's keys. That's both unfair and wrong, because the limits really are per key.
- **Redis for coordination:** faster, but an extra stateful service (ADR-0003). ~22 small UPDATEs
  per second are trivial for Postgres.

## Consequences

- \+ Converges to each key's real capacity without configuration and adapts as limits change.
- \+ Per-key isolation: one tenant's limits never throttle another tenant's key.
- \+ Free-tier traffic (platform scope) is capped separately and, together with fair-queuing
  weight 0.25 (ADR-0006), yields first.
- − The classic AIMD sawtooth wastes a bit of capacity after each decrease. Acceptable for batch
  sampling.
- − A hot row per scope. At 10x, workers take local leases of `limit / workers` slots and
  reconcile periodically (system-design §10).
- − Doesn't model token-per-minute limits directly. A 429 caused by a TPM limit is still handled
  by the decrease.

## Related

- [system-design §8g](../system-design.md#g-aimd-rate-control-adr-0011), [ADR-0003](0003-postgres-as-job-queue-and-workflow-store.md),
  [ADR-0004](0004-leases-with-fencing-tokens.md), [ADR-0006](0006-weighted-fair-scheduling.md),
  [ADR-0022](0022-byok-envelope-encryption.md), [ADR-0023](0023-free-tier-with-platform-spend-cap.md)
