# ADR-0012: Entity resolution cascade

- Status: Accepted
- Date: 2026-11-12

## Context

Answers mention businesses in many surface forms: "Joe's Plumbing", "Joes Plumbing & Heating
Ltd", "joesplumbing.co.uk", "the Joe's on Main St". Every metric (mention rate, rank, share of
voice) depends on mapping each mention to **the project's brand**, **a known competitor**, or
**other**. At ~928k observations/day with ~6 entities each, that is about 5.5M mentions/day to
resolve, per interested project. Calling an LLM for every mention would cost more than the
sampling itself; exact matching alone misses many legitimate variants (low recall → understated
visibility, which is exactly the error customers would notice).

## Decision

Resolve with a **cascade ordered by cost**, where each stage either accepts, rejects or passes
ambiguous cases on:

| Stage | Method | Accept | Ambiguous → next | Reject |
|---|---|---|---|---|
| 1 | Exact match on normalized aliases (NFKC, casefold, strip legal suffixes "Inc/LLC/Ltd/GmbH", punctuation, "the"), or a cited domain equal to the brand/competitor domain | match | — | — |
| 2 | `pg_trgm` similarity vs aliases (GIN `gin_trgm_ops` index on `alias_norm`) | ≥ 0.60 | 0.30 to 0.60 | < 0.30 |
| 3 | Embedding cosine: (name + 200-char context) vs brand profile embedding (name, category, location, domain) | ≥ 0.85 | 0.70 to 0.85 | < 0.70 |
| 4 | LLM adjudication, structured output `{same_entity: yes/no/unsure, reason}` | yes | unsure → **unresolved** bucket shown to the user | no |

```sql
SELECT alias_id, similarity(alias_norm, $1) AS s
FROM brand_aliases WHERE project_id = $2 AND alias_norm % $1      -- uses the trigram GIN index
ORDER BY s DESC LIMIT 3;
```

- Thresholds are **starting points**. Phase 5 tunes them on the golden set (`/evals`) so that
  each stage's auto-accept precision is ≥ 0.97, and reports per-stage precision/recall.
- Location disambiguation: same name + different city counts as a different entity unless the
  domain matches (stage 3 and 4 inputs include location).
- Results are cached per `(entity_string_norm, project_id, resolver_version)`.
- User feedback ("yes, that's us" / "no") becomes an alias or a negative alias, which feeds
  stage 1 next time.
- Every interpretation row stores `resolver_version` (ADR-0013).

## Alternatives considered

- **LLM for every mention:** most accurate in isolation, but ~5.5M calls/day multiplied by
  projects; slow, costly, and non-deterministic (resolution would drift across runs).
- **Exact match only:** cheap and deterministic, but poor recall on real-world name variants;
  understates visibility.
- **Fuzzy (trigram) only:** confuses similar names ("Smith Dental" vs "Smyth Dental" in another
  city) without context.
- **Embeddings only:** needs a vector index for everything; less precise than exact matching for
  the easy 80%, and harder to explain.
- **External knowledge graph / entity linking (Wikidata, Google KG):** small local businesses are
  mostly absent from them.

## Consequences

- \+ Expected volume: about 80% resolved at stage 1, about 15% at stages 2 and 3, under 5% at
  the LLM. Costs stay a small fraction of sampling.
- \+ Each stage is testable and explainable ("matched alias 'Joes Plumbing' at 0.82").
- \+ Unresolved cases are surfaced honestly instead of guessed.
- − Four mechanisms to maintain and threshold. Mitigated by eval-driven tuning and versioning.
- − Embedding model choice affects stage 3; changing it is a `resolver_version` bump with a
  backfill (ADR-0013).

## Related

- [system-design §8h](../system-design.md#h-entity-resolution-cascade-adr-0012), [ADR-0013](0013-immutable-observations-lineage-backfills.md),
  [evals/README](../../evals/README.md)
