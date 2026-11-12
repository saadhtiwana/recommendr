# ADR-0007: Shared observation layer with tenant interpretation layer

- Status: Accepted
- Date: 2026-11-12

## Context

Provider calls with web search are the dominant cost (~$0.012 each, system-design §4). Many
tenants track identical public questions ("best CRM for small agencies", "best dentist in
Austin"). Sampling the same question on the same engine, model, locale and day once per tenant
wastes money and provider rate limits. But AI answers are combined with tenant-specific
interpretation (which brand is "us", verified facts, competitors), and some questions contain
private information that must never leave the tenant.

## Decision

Split data into two layers:

```
OBSERVATION LAYER (global, no org_id)                   INTERPRETATION LAYER (tenant, RLS)
observations: PK (normalized_hash, engine, locale,      interpretations, false_fact_findings,
  model, observed_date, sample_index)                    daily_rollups, read models
answer text, citations, fan-out queries, model id       brand/competitor resolution, rank,
entity_extractions (brand-agnostic, versioned)           sentiment, fact checks
```

- **Normalization:** NFKC, casefold, whitespace/punctuation collapse, locale-specific stop
  phrases; `normalized_hash = sha256(normalized_text || locale)`.
- **Privacy boundary:** only questions marked **shareable** enter the global layer. Questions the
  user marks private, or the classifier flags (unreleased product names, people's names, content
  from uploads), go to `private_observations` under RLS and are never shared, never used in the
  public index (ADR-0025). The global layer stores only the question text and the provider's
  public output: **never** which org asked, which brand it tracks, or its facts. A tenant can read
  only observations whose hash matches one of its own questions; it can't enumerate others.
- **Concurrent dedupe:** `INSERT INTO observation_claims ... ON CONFLICT DO NOTHING`; the winner
  calls the provider; losers retry shortly and read. Expired claims can be taken over with a
  higher fencing token (ADR-0004).
- **Who pays (BYOK invariant):** samples are a shared deterministic prefix
  (`sample_index` 0..n-1). Each tenant evaluates its own stopping rule (ADR-0008) on its own brand.
  The tenant whose rule requests sample k pays for it with **its own key** (or its free-tier
  quota); reading existing samples is free. **No org's key is ever spent on another org's demand,
  and no tenant pays more than it would alone.**
- **Model compatibility:** the key includes `model`, so tenants share only when they sample the
  same engine/model/locale.
- **Opt-out:** an org can disable sharing; it then neither contributes nor reads, and pays the
  full cost. Self-hosted instances share only within the instance (ADR-0024).

### Honest savings math

40% of tracked (project, question) instances overlap, in groups of g = 3 (assumptions). Each group
still needs one set of samples, and that set must satisfy the strictest member's stopping rule
(E[max n] = 6.5 vs E[n] = 5):

```
without sharing: 60,000 × 4 × 5                                 = 1,200,000 calls/day
with sharing:    4 × (36,000 × 5 + 8,000 × 6.5) = 4 × 232,000   =   928,000 calls/day  (−22.7%)
```

So 40% overlap buys about **23%**, not 40%. The 40% figure is an upper bound that would require
every overlapping instance to be fully redundant and no max-n effect. Sensitivity in
system-design §4 (16% at g = 2, 29% at g = 5). Phase 4 measures the real overlap and reuse ratio.

## Alternatives considered

- **Per-tenant sampling only:** simplest privacy story, ~30% more provider spend (1.2M vs 928k
  calls/day) and more rate-limit pressure.
- **Share interpretations too:** interpretations encode tenant brands and facts, which would leak
  who tracks whom. Rejected.
- **Share across models/locales with normalization:** wrong: different models and locales give
  different answers; mixing them would bias metrics.
- **Opt-in sharing (default off):** savings would be small and the free tier unaffordable;
  default-on for shareable questions with a clear opt-out and privacy classification is the
  balance.

## Consequences

- \+ ~23% fewer provider calls at the planning scale, growing with tenants per category.
- \+ Raw answers are stored once; extraction of brand-agnostic entities runs once per observation.
- \+ The global layer is a clean seam to split out at 100x (system-design §10).
- − Two-layer data model and careful classification of private questions; misclassification is
  a privacy incident, so the classifier errs on private and users can override.
- − A shared cell runs until the most demanding tenant stops; payer attribution must be exact in
  the ledger (ADR-0010).
- − Opted-out orgs and private questions get no savings.

## Related

- ADR-0004 (claims fencing), ADR-0008 (stopping rule), ADR-0010 (who pays), ADR-0013 (immutability), ADR-0022 (BYOK), ADR-0025 (public index)
- system-design §4, §8d
