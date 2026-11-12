# ADR-0010: Budget reservations (authorize/capture)

- Status: Accepted
- Date: 2026-11-12
- Revision history: 2026-11-12: revised before first publication for the BYOK/free-tier product
  model (ADR-0022, ADR-0023, ADR-0024); payments removed from scope.

## Context

Every provider call costs money, on the user's own key (BYOK) or on the platform's free-tier
key. Many workers run concurrently. Limits must hold under concurrency: the free tier's
entitlements (samples, runs), an optional per-key monthly cap the user sets on their BYOK key, and
the global `PLATFORM_MONTHLY_BUDGET_USD` (ADR-0023). Checking "spent so far" *after* calls lets N
concurrent workers all pass the check and overshoot. Actual cost is only known after the call
(tokens, search fees).

## Decision

Bracket every provider call (and every agent model call, ADR-0027) with **authorize** and
**capture**, like a card payment:

```
authorize(scopes, est_cost, idem_key):
  for scope in FIXED ORDER [org_quota, byok_key, platform]:   -- fixed order avoids deadlocks
     if scope applies:
        UPDATE quota_buckets / platform_budget
           SET reserved = reserved + :est
         WHERE <scope row> AND used + reserved + :est <= limit_value
        -- 0 rows → ROLLBACK all holds in this transaction → return BLOCKED(scope)
  INSERT usage_ledger(entry_type='authorize', scope, key_id, cost=:est, idempotency_key=:idem||':auth')
call provider
capture(actual, idem_key):  reserved -= est, used += actual;
                            INSERT usage_ledger(entry_type='capture', idempotency_key=:idem||':cap')
release(idem_key) on failure before any cost: reserved -= est; INSERT ledger 'release'
```

- **Scopes:** `org_quota` (free-tier entitlements from `plan_entitlements`), `byok_key` (optional
  user-set monthly cap per key; usage is always recorded per key even without a cap), `platform`
  (global monthly budget, free-tier calls only).
- **Atomic and concurrency-safe:** the conditional UPDATE is the check and the hold in one
  statement; overshoot is bounded by (actual − estimate) of in-flight calls. Estimates use the
  p90 cost per engine/model, refreshed from the ledger.
- **Idempotent:** ledger entries have unique idempotency keys derived from the provider-call key
  `(run_id, question_id, engine, sample_index)`; retries and zombies (ADR-0004) can't double-charge.
- **Sweeper:** authorizations without capture/release older than lease + 10 min are released
  (appending a `release` entry), so crashed workers don't leak budget.
- **Ledger is the source of truth:** `usage_ledger` is append-only (INSERT/SELECT grants only).
  `quota_buckets` and `platform_budget` are derived counters that can be rebuilt from the
  ledger at any time; a nightly job verifies they match.
- **Extensible to paid plans without schema rewrite:** limits come from `plans` /
  `plan_entitlements` rows; a paid plan later is new rows plus a payments module writing
  `adjust` entries. No payments are built now.
- **Self-hosted:** `DEPLOYMENT_MODE=self_hosted` disables `org_quota` and `platform` scopes;
  only optional `byok_key` caps apply. Usage is still recorded.

## Alternatives considered

- **Post-hoc accounting (check spent before, record after):** races under concurrency; overshoot
  is unbounded with many workers.
- **In-memory or Redis counters:** fast, but another store, and not atomic with job state;
  counters would drift from the ledger on crashes.
- **Serialize all calls per org through one worker:** correct, but kills throughput and fairness.
- **Rely on provider-side limits only:** providers don't know our quotas or the platform budget,
  and a BYOK key's own provider spend limit is coarse and monthly.

## Consequences

- \+ Hard limits hold under concurrency; the platform budget can't be exceeded by more than one
  in-flight batch (≤ $1, system-design §3).
- \+ Per-key and per-org cost reports come straight from the ledger.
- \+ Same mechanism covers agents, extraction and sampling.
- − Two extra writes per provider call (~5.5 statements/call total, system-design §4).
- − Budget rows of very large orgs can become hot; split into sub-buckets at 10x.
- − Estimates hold capacity briefly; a too-high estimate can block a call that would have fit.

## Related

- ADR-0004 (idempotency vs zombies), ADR-0007 (who pays in shared cells), ADR-0022 (BYOK), ADR-0023 (free tier and platform cap), ADR-0024 (self-hosting), ADR-0027 (agent budgets)
- system-design §8f, §8m
