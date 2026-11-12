# ADR-0013: Immutable observations, lineage and backfills

- Status: Accepted
- Date: 2026-11-12

## Context

Raw AI answers are expensive to get (provider calls) and **impossible to re-get**: the same
question asked tomorrow, or on a newer model, gives a different answer. Everything we show is
derived from those answers by components that will keep improving: extractors, prompt templates,
the entity resolver (ADR-0012), fact checkers. If derived data is overwritten in place we can't
explain a number, compare versions, roll back a bad extractor, or recompute history after a fix.

## Decision

1. **Observations are immutable.** `observations` (and `private_observations`) are INSERT-only;
   the app roles have no UPDATE/DELETE grants. Corrections are new derived rows, never edits.
2. **Lineage on every derived row:** `extractor_version`, `resolver_version`,
   `prompt_template_version`, and provider `model` identifiers, plus the observation key.
   Every dashboard number can be traced: read model → rollup → interpretations → observations.
3. **Versioned side-by-side derivation:** a new extractor version writes **new rows next to old
   ones** (version is part of the key). A `current_versions(component, version)` row says which
   version read models use.
4. **Backfills are jobs.** Shipping a new version enqueues one backfill job per partition (low
   priority class, fair-queued as a system org, ADR-0006). Archived partitions are backfilled from
   R2 Parquet via DuckDB (ADR-0016).
5. **Atomic switch:** when the backfill completes **and** the eval gate passes, read models are
   rebuilt from source for the new version and `current_versions` is flipped in one transaction.
   Rollback = flip back (the old rows are still there until garbage-collected after 30 days).

```sql
-- example: interpretations keyed by version
PRIMARY KEY (project_id, observation_key, extractor_version, resolver_version)
-- read models select WHERE (extractor_version, resolver_version) = current_versions(...)
```

## Alternatives considered

- **Mutable derived data, updated in place:** less storage, but no rollback, no A/B comparison, no
  audit trail, and a crash halfway through leaves mixed versions.
- **Recompute on read:** always fresh, but far too slow for dashboards (CQRS, ADR-0015) and
  expensive when extraction involves LLM calls.
- **Event sourcing everything:** overkill. Observations already *are* our immutable event log;
  derived state is a function of them plus versions.

## Consequences

- \+ Explainability: any metric can be explained down to raw answers and component versions,
  which is our "honest measurement" positioning.
- \+ Safe evolution: new extractors are compared with old ones on real data before switching.
- \+ Recovery from bugs: fix, bump the version, backfill, flip.
- − Storage overhead during transitions (two versions of interpretations). Bounded by GC after
  30 days.
- − Backfills consume capacity and, for LLM-based extractors, money. They're scheduled at low
  priority and estimated before launch.
- − Every query must filter on current versions. Centralized in the read-model builders, never
  hand-written in endpoints.

## Related

- [system-design §8i](../system-design.md#i-lineage-and-backfills-adr-0013), [ADR-0012](0012-entity-resolution-cascade.md),
  [ADR-0015](0015-partitioning-rollups-cqrs.md), [ADR-0016](0016-r2-parquet-archival-with-duckdb.md)
