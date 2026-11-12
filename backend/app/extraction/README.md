# extraction

Tenant-scoped interpretation of observations: structured-output extraction of brand mentions, rank, sentiment, competitors and cited sources, plus the entity resolution cascade (exact alias -> pg_trgm -> embeddings -> LLM adjudication). Every derived record stores `extractor_version`, `prompt_template_version` and model identifiers for lineage and backfills. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
