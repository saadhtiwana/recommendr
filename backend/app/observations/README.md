# observations

The global, non-tenant observation layer: immutable raw AI answers keyed by `(normalized_question_hash, engine, locale, model, date, sample_index)`, shared across tenants for identical public questions. Contains only public AI output, never tenant-private data. Partitioned monthly; old partitions are archived to R2 as Parquet. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
