# ADR-0016: Archive old observations to R2 as Parquet, query with DuckDB

- Status: Accepted
- Date: 2026-11-12

## Context

Raw observations and entity extractions grow ~106 GB/month in Postgres (system-design §4).
Keeping them hot forever on Neon is expensive and slows maintenance. But we **can't delete
them**: they are irreplaceable (ADR-0013), and backfills after an extractor improvement need
history. Access to old data is rare and batch-shaped (backfills, research, the public index),
never interactive.

## Decision

- **Hot retention 45 days** for `observations` and `entity_extractions` (tenant interpretations,
  rollups and read models stay hot).
- A monthly **archive job** per partition: export to **Parquet** (zstd, row groups ~128 MB,
  sorted by `(normalized_hash, engine, observed_date)`), upload to **Cloudflare R2** at
  `r2://recommendr-archive/observations/year=2026/month=10/part-000.parquet`, write a manifest
  (row count, checksum, schema version), verify by reading it back and comparing counts and
  checksums, **then** detach and drop the partition. Idempotent by manifest.
- **DuckDB** (`httpfs`) reads archived Parquet directly for backfills:

```sql
SELECT * FROM read_parquet('s3://recommendr-archive/observations/year=2026/month=*/*.parquet')
WHERE engine = 'perplexity' AND observed_date BETWEEN '2026-08-01' AND '2026-08-31';
```

- Private observations (`private_observations`, tenant data) are archived under a separate
  prefix per org so tenant deletion requests can delete their archive objects; they are never
  mixed into the shared archive.
- Self-hosted instances: archival is optional (`ARCHIVE_ENABLED=false` by default); any
  S3-compatible store works.

## Alternatives considered

- **Keep everything in Postgres:** simplest, but cost and maintenance grow linearly forever;
  Neon storage is priced for hot data.
- **S3/Glacier:** cheap at rest, but egress fees (S3) or retrieval delays (Glacier) penalize
  backfills. R2 has **no egress fees** and is S3-compatible.
- **BigQuery/Snowflake:** powerful, but a paid warehouse and credentials for a rare batch use
  case; DuckDB is free, embedded, and runs inside a worker.
- **CSV/JSON dumps:** larger, slow to scan, untyped.

## Consequences

- \+ Archive cost ≈ 0.7 KB/observation, about 28 GB/month at R2 prices (cents to a dollar per month).
- \+ Backfills over history are possible without restoring into Postgres.
- \+ Parquet is an open format, which fits the open-source positioning (exports, research).
- − Two storage tiers; queries spanning hot and archived data need code that unions both.
- − The archive job must be bulletproof (verify before drop). Covered by tests that simulate
  failures between upload and drop.
- − DuckDB memory use on big scans has to be bounded (`memory_limit`, partition pruning by path).

## Related

- [ADR-0013](0013-immutable-observations-lineage-backfills.md), [ADR-0015](0015-partitioning-rollups-cqrs.md),
  [ADR-0024](0024-self-hosting-with-docker-compose.md)
