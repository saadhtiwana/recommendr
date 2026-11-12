# ADR-0020: Partial results instead of zeros on provider failure

- Status: Accepted
- Date: 2026-11-12

## Context

Runs depend on four external providers and on credentials. Providers have outages, 429 storms
and timeouts; BYOK keys get revoked or run out of credit; the free tier can hit its cap. If a
run records "no observations" for an engine as **zero mentions**, the dashboard shows a crash in
visibility, change detection fires a statistically "significant" drop, and a customer may make
decisions based on an artifact of our infrastructure. That would destroy trust in a product whose
positioning is honest measurement.

## Decision

Missing data is **never** recorded as zero. Each (run, engine) has an explicit completeness state:

| State | Meaning | Shown as |
|---|---|---|
| `complete` | all planned samples collected | normal |
| `partial` | some samples collected, some failed after retries (outage, timeouts) | estimate with wider interval + "partial: provider errors" badge |
| `failed` | no samples collected because of provider errors | gap in the series, with the reason |
| `blocked` | not attempted: no usable credential (no BYOK key for this provider, key invalid/revoked, key monthly cap reached, free-tier quota or platform budget exhausted) | gap with an **actionable** message ("Add your Anthropic key", "Your key was rejected", "Free quota resets Dec 1") |

- `blocked` is distinct from `failed`: it is not an outage, it's a user/config state, and it
  doesn't retry automatically (it resumes when a key is added or the quota resets).
- Rollups store `completeness` per cell; read models and charts show gaps, never zeros; aggregates
  over engines state which engines are included.
- **Change detection and alerts use only cells that are complete in both periods** (ADR-0009).
  Partial cells may be shown, but never alert.
- A run reaches a terminal state when every engine is complete, partial, failed or blocked; the
  run SLO counts partial/failed/blocked as terminal (with reasons) so one provider can't stall a
  run forever. Retries continue until the run deadline (6 h).
- Cost: failed calls that were billed by the provider are still captured in the ledger (ADR-0010).

## Alternatives considered

- **Treat missing as zero:** simplest code; wrong numbers and false alerts.
- **Fail the whole run if any engine fails:** loses the good data from healthy engines and makes
  the run SLO hostage to the least reliable provider.
- **Silently drop the engine from aggregates:** no zeros, but users would compare inconsistent
  aggregates without knowing it. Hidden inconsistency is also dishonest.
- **Impute missing values (carry forward):** invents data; any imputation would need its own
  uncertainty model and could still mislead.

## Consequences

- \+ No phantom drops, no false alerts from outages or missing keys.
- \+ `blocked` turns credential problems into clear user actions, which is important for BYOK.
- \+ Run completion is bounded and observable per engine.
- − More states across rollups, read models, charts and the API, and every consumer must handle
  them. Typed enums and tests for each state.
- − Aggregates are sometimes computed over fewer engines; the UI must say so clearly.

## Related

- [ADR-0009](0009-change-detection-with-benjamini-hochberg.md), [ADR-0010](0010-budget-reservations.md),
  [ADR-0022](0022-byok-envelope-encryption.md), [ADR-0023](0023-free-tier-with-platform-spend-cap.md),
  [system-design §9](../system-design.md#9-failure-modes)
