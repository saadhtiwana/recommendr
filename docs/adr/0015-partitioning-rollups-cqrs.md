# ADR-0015: Partitioning, rollups and CQRS read models

- Status: Accepted
- Date: 2026-11-12

## Context

Write-heavy, append-only tables grow fast: about 61 GB/month of raw observations, 45 GB of
entity extractions and 14 GB of interpretations at the base estimate (system-design §4).
Dashboards must answer in p95 < 300 ms ("mention rate per engine per week for 30 questions over
6 months, with intervals"). Computing that from raw rows on every page view would scan millions
of rows, and deleting old rows with `DELETE` causes bloat and vacuum storms.

## Decision

1. **Monthly declarative range partitioning** on the date column for `observations`,
   `entity_extractions`, `interpretations`, `false_fact_findings` and `agent_steps`. A maintenance
   job creates partitions two months ahead. Retention = archive (ADR-0016) → `DETACH PARTITION
   CONCURRENTLY` → `DROP` (O(1), no bloat).
2. **Daily rollups maintained incrementally:** after a run's interpretations commit, the
   `aggregate` step upserts `daily_rollups(project_id, question_id, engine, locale, day)` with
   counts (`n`, `mentions`, `rank_sum`, `rank_n`, sentiment counts, `completeness`, `models[]`).
   Counts, not rates, so intervals and tests can be computed for any aggregation
   (Wilson needs x and n).
3. **CQRS read models:** the `project read models` step writes denormalized tables shaped for each
   dashboard view (visibility over time with CIs, share of voice, competitor gaps, latest
   false facts). The API reads **only** read models and rollups, never raw partitions.
4. **Rebuildable:** rollups and read models are derived and can be rebuilt from source of truth
   (ADR-0013) by a job, idempotently (`INSERT … ON CONFLICT DO UPDATE` with full recomputation of
   the affected keys).

```sql
CREATE TABLE observations (...) PARTITION BY RANGE (observed_date);
CREATE TABLE observations_2026_11 PARTITION OF observations
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
```

## Alternatives considered

- **Query raw tables with indexes:** fine at day one, falls over as tables reach billions of
  rows; deletes cause bloat.
- **Materialized views with `REFRESH`:** full refresh is O(total data) and locks or doubles
  storage (`CONCURRENTLY` needs unique indexes and still recomputes everything).
- **An OLAP store now (ClickHouse, BigQuery):** fast analytics, but a second datastore, CDC
  pipeline and operational cost before we need it. Revisit at 100x (system-design §10).
- **TimescaleDB:** nice hypertables and continuous aggregates, but not available on Neon, and
  self-hosting simplicity favors stock Postgres.

## Consequences

- \+ Dashboard reads are small indexed lookups; p95 target achievable.
- \+ Retention and archival are cheap partition operations.
- \+ Rollups store counts, which keeps statistics correct under any re-aggregation.
- − More moving parts: partition maintenance, rollup/read-model builders, and their idempotency
  tests.
- − Read models are eventually consistent: they update when a run's aggregate step commits, not
  instantly. Fine for daily/weekly runs; the UI shows "updated at".
- − Partition keys must be in primary keys/unique constraints (Postgres requirement), which shapes
  the observation key (date included).

## Related

- [system-design §7](../system-design.md#7-data-model), [ADR-0013](0013-immutable-observations-lineage-backfills.md),
  [ADR-0016](0016-r2-parquet-archival-with-duckdb.md)
