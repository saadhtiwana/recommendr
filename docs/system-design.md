# Recommendr: System Design

> **Living document.** Status: **Phase 1 (design only, nothing implemented).** Each phase updates
> this file to match the real implementation. Decisions are recorded as ADRs in
> [`adr/`](adr/README.md); product behavior is specified in [`product-spec.md`](product-spec.md);
> self-hosting in [`self-hosting.md`](self-hosting.md).
>
> Numbers marked *(assumption)* are planning inputs to be replaced by measurements (provider
> prices and latencies in phase 4, sampling behavior in phase 6, load in phase 13).

---

## 1. Problem and goals

When people ask ChatGPT, Gemini, Perplexity or Claude "who's the best dentist in Austin?" or
"which CRM should a 10-person agency use?", the assistant names a few businesses and skips the
rest. For a growing share of customers that answer *is* the shortlist. Businesses can't see it:
there is no "AI search console". Answers vary from one sample to the next, depend on the model
version and on web search results, and sometimes state false facts (wrong hours, closed
locations, made-up prices).

Commercial tools (Profound, Peec AI) exist but are priced for enterprises and closed. **Recommendr
is the free, open-source (AGPL-3.0) alternative**: bring your own API keys (or use a small free
tier), self-host in minutes, and get measurements that are **honest about uncertainty** and
**focused on fixes**.

**Goals**

1. **Measure** whether, where and how AI assistants recommend a brand compared with competitors,
   with statistically honest uncertainty (intervals, significance tests, FDR control).
2. **Explain** why competitors are recommended instead: cited sources, attributes, gaps.
3. **Catch false facts** AI states about the brand, with evidence.
4. **Fix**: an AI-readiness audit of the website plus a prioritized fix plan with ready-to-use
   artifacts, drafted by grounded agents, and later (optionally) published with explicit approval.
5. **Free to run:** BYOK with per-key cost visibility; a capped free tier; one-command
   self-hosting.
6. **Engineering quality:** correctness under failure, tenant isolation, lineage and
   recomputation, and a design every line of which can be defended.

**Non-goals (for now):** scraping consumer chat apps (ADR-0018), payments (the design stays
extensible for them), real-time (sub-hourly) monitoring, social media or traditional SEO rank
tracking.

---

## 2. Functional requirements

| # | Requirement |
|---|---|
| F1 | Sign up with email+password or Google; create an organization; invite members with roles owner, admin, member, client-viewer (agency clients). |
| F2 | Create a **project**: brand (name, aliases, website, category, location), **verified facts**, competitors, locales, engines, cadence. |
| F3 | **Question discovery:** propose the questions customers ask AI (seeded from category, location, competitors, site content), clustered by intent; the user accepts/edits; questions containing private data are marked **tenant-private**. |
| F4 | **Runs:** on schedule or on demand, sample each question on each engine (ChatGPT, Gemini, Perplexity, Claude via APIs with web search/grounding) adaptively (3 to 10 samples). |
| F5 | **Extraction:** per answer, extract mentioned entities, rank/order, sentiment, cited sources, the engine's search fan-out queries (where exposed), and factual claims about the brand. |
| F6 | **Metrics:** mention rate with Wilson 95% intervals, average rank, share of voice, sentiment distribution, per question/engine/locale and aggregated, as time series annotated with model changes and incomplete data. |
| F7 | **Competitor gap analysis:** "why them, not me": where competitors appear and the brand doesn't, which sources are cited for them, and which attributes AI associates with them. |
| F8 | **False facts:** flag claims contradicting verified facts, with the answer, engine, model and sources as evidence. |
| F9 | **Website AI-readiness audit:** AI crawler rules in robots.txt (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended), JSON-LD, llms.txt, FAQ coverage, crawlability. |
| F10 | **Fix plan:** actions ranked by impact and effort, with generated artifacts (FAQ content, JSON-LD, llms.txt, page drafts, outreach drafts) and source opportunities. |
| F11 | **Alerts** only on statistically significant changes above a minimum effect size; **weekly AI report**. |
| F12 | **Agents and MCP:** ask-your-data chat (internal agent), background agents (diagnosis, actions, fix writer, competitor investigator), and an MCP server exposing the same tools (§14). |
| F13 | **BYOK key vault:** add/replace/revoke provider keys per org; keys are write-only; per-key and per-org usage and cost are visible. |
| F14 | **Free tier without keys:** 1 project, ≤ 10 questions, weekly, 2 engines on low-cost models, fixed sample cap; stops when the platform's monthly spend cap is reached. |
| F15 | **Self-hosting** with Docker Compose (BYOK only, quotas disabled). |
| F16 | *(later)* **Closed loop:** publish approved fixes (GitHub PR first), then measure impact before vs after. |
| F17 | *(later)* **Public AI visibility index:** static pages per category, built only from public shared observations. |

---

## 3. Non-functional requirements

| Property | Target | Notes / how measured |
|---|---|---|
| **Dashboard latency** | API p95 **< 300 ms**, p99 < 800 ms for dashboard reads; page LCP p75 < 2.0 s | Dashboards read precomputed read models only (CQRS, ADR-0015) |
| **Run completion SLO** | **99%** of scheduled runs reach a terminal state (complete, or **partial with reasons**) within **6 h** of their scheduled time; 95% within 2 h | Partial is a valid terminal state (ADR-0020); measured per run |
| **Alert false-positive budget** | Benjamini-Hochberg at **q = 0.10** per project per period, so **≤ 10%** of alerts are expected false discoveries; and **≤ 1** non-actionable alert per project per month (tracked via "not useful" feedback) | Plus minimum effect size **≥ 10 percentage points** (ADR-0009) |
| **Measurement honesty** | Every displayed rate has an interval and its n; nominal 95% Wilson intervals show **≥ 93% empirical coverage** in simulation, including adaptive stopping | Property and Monte Carlo tests (phase 6) |
| **Cost per tracked question-month** | Sampling (4 engines, daily, adaptive): **≤ $6.00** with sharing at the assumed $0.012/call (unshared baseline $7.20, §4). Weekly cadence: **≤ $1.05**. Free tier (2 engines, weekly, 3 samples, low-cost models): **≤ $0.20**. Platform overhead (extraction, adjudication, embeddings, agents) **≤ 10%** of sampling cost | Per-org/per-key ledger (ADR-0010) |
| **Tenant isolation** | **Zero** cross-tenant reads or writes. Every tenant table has `org_id` + RLS **enabled and forced** (CI check), application-level checks, and cross-tenant RLS tests. Shared observations never contain tenant-private data | Any violation is a Sev-1 (ADR-0014, ADR-0007) |
| **API key secrecy** | Provider keys are never returned after save, never logged, never in Sentry; DB dump alone can't decrypt them | Log/Sentry scrubber tests, envelope encryption (ADR-0022) |
| **Durability** | No lost or duplicated results when workers crash mid-job | Chaos tests (phase 3) |
| **Free-tier spend** | Platform spend never exceeds `PLATFORM_MONTHLY_BUDGET_USD` by more than one in-flight reservation batch (≤ $1) | Reservations against the platform budget (ADR-0023) |
| **Agent safety** | 100% of agent numeric claims cite tool results; 0 spend/publish tool executions without user approval; agent cost never exceeds its per-run cap | Agent evals + red-team suite in CI (ADR-0027/0028) |
| **Availability** | 99.5% monthly for the hosted API and dashboard (single region, small team) | Synthetic probes |

---

## 4. Capacity and cost estimates

### Assumptions

| Symbol | Assumption | Value |
|---|---|---|
| O | Organizations | **500** |
| P | Projects | **2,000** |
| Q | Questions per project | **30** |
| E | Engines | **4** |
| — | Cadence | **daily** (worst case; weekly is cheaper, see below) |
| n | Samples per (question, engine, day) | adaptive **3 to 10**; **E[n] = 5** *(assumption: 55% of pairs stop at 3 because outcomes are unanimous, 45% average about 7.4; see §8b)* |
| — | Cross-tenant overlap | **40%** of tracked (project, question) instances share an identical normalized question (same locale and model) with at least one other project, in groups of average size **g = 3** *(assumption)* |
| — | E[max n] in a shared group of 3 | **6.5** (shared samples must satisfy the most demanding tenant) *(assumption, simulated in phase 6)* |
| c | Blended provider cost per call with web search | **$0.012** *(assumption: ~$0.010 search/grounding fee + ~$0.002 tokens; low-cost models ~$0.006)* |
| L | Provider latency with search | **12 s** average *(assumption)* |
| — | Observation size | ~4 KB logical (answer ~2.4 KB, citations/fan-outs ~1.2 KB, metadata ~0.4 KB), **~2.2 KB on disk** after TOAST compression, with indexes |

### Provider calls per day

Tracked instances = P × Q = 2,000 × 30 = **60,000** (project, question) pairs, or **240,000**
(project, question, engine) pair-days.

**Without the shared observation layer** every project samples its own questions:

```
calls/day = 60,000 × 4 engines × 5 samples = 1,200,000      (range 720,000 at n=3 to 2,400,000 at n=10)
```

**With the shared observation layer** (ADR-0007):

```
singleton instances: 60,000 × 60%           = 36,000 questions
shared instances:    60,000 × 40% = 24,000  → 24,000 / g(3) = 8,000 unique questions
unique questions                             = 44,000

calls/day = 4 × (36,000 × 5  +  8,000 × 6.5)
          = 4 × (180,000 + 52,000)
          = 928,000 calls/day                → −272,000 (−22.7%)
```

Why "40% overlap" saves only about 23%, not 40%: each group of 3 still needs one set of samples,
and that set has to satisfy the strictest tenant's stopping rule (E[max n] = 6.5 > 5). Sensitivity:

| Group size g | Unique shared questions | Calls/day | Saving |
|---|---|---|---|
| 2 (E[max n] 6.0) | 12,000 | 1,008,000 | 16% |
| **3 (6.5)** | **8,000** | **928,000** | **23%** |
| 5 (7.0) | 4,800 | 854,400 | 29% |
| Upper bound (all redundant, no max effect) | — | 720,000 | 40% |

Local-business questions ("best plumber in Leeds") overlap less; agencies tracking one niche
overlap more. Phase 4 measures the real overlap.

### Provider cost

| | Calls/day | $/day | $/month (30 d) |
|---|---|---|---|
| Without sharing | 1,200,000 | $14,400 | **$432,000** |
| With sharing | 928,000 | $11,136 | **$334,080** |
| Saving | 272,000 | $3,264 | **≈ $98,000** |

Under BYOK this spend is on **users' own keys**. The sharing guarantee is that no tenant ever pays
more than it would alone (§8d). Per tracked question-month: 4 × 30 × 5 × $0.012 = **$7.20**
unshared, **≈ $5.57** with sharing; **$1.04** at weekly cadence; free tier
2 × 4.33 × 3 × $0.006 = **$0.16**. Daily cadence across 4 engines is expensive, so the product
defaults new BYOK projects to weekly, shows the projected monthly cost before enabling daily runs,
and lets users set a monthly cap per key.

**Free-tier sensitivity:** if 1,000 orgs used the free tier (1 project × 10 questions × 2 engines ×
3 samples, weekly, $0.006): 1,000 × 10 × 2 × 3 / 7 ≈ **8,600 calls/day ≈ $1,540/month**. A
`PLATFORM_MONTHLY_BUDGET_USD` of $500 covers about 320 free orgs. That is why the cap, pacing and
lower scheduling priority exist (ADR-0023).

### Storage growth per month (Postgres, with sharing)

| Data | Arithmetic | Per month |
|---|---|---|
| Raw observations (global) | 928k/day × 2.2 KB × 30 | **≈ 61 GB** (79 GB unshared) |
| Entity extractions (global, brand-agnostic) | 928k × ~1.6 KB (≈6 entities, ≈6 citations) × 30 | ≈ 45 GB |
| Tenant interpretations | 1.2M consumptions/day × ~400 B × 30 | ≈ 14 GB |
| Daily rollups | 240k pair-days × 250 B × 30 | ≈ 1.8 GB |
| Jobs (purged after 14 days) | ~250k jobs/day × 0.5 KB | steady ≈ 2 GB |
| **Total growth** | | **≈ 122 GB/month** |

Hot retention for raw observations and extractions is **45 days** (≈ 160 GB steady); older
partitions are archived to R2 as zstd Parquet (≈ 0.7 KB/observation ≈ **28 GB/month** including
extractions, < $1/month at R2 prices) and stay queryable with DuckDB (ADR-0016). Tenant
interpretations and rollups stay hot (≈ 16 GB/month).

### Workers

- Average call rate: 928,000 / 86,400 ≈ **10.7 calls/s** (the scheduler spreads runs across
  the day by hashing project id).
- In flight (Little's law): 10.7 × 12 s ≈ **130**; with a 2× peak ≈ **260**.
- A worker process is asyncio-based and I/O-bound: **64 concurrent provider calls** at about
  400 MB RSS. So **4 to 5 worker instances** at peak (plus AIMD limits, §8g); extraction adds
  about 186k small-LLM calls/day (5 observations per call), ≈ 7 in flight, which is negligible.
- Jobs: ~176k sample jobs (one per unique question × engine × day, which samples adaptively
  inside the job) + ~19k extraction batches + ~6k aggregate/read-model/alert jobs ≈ **200 to 250k
  jobs/day ≈ 3 jobs/s**.

### Neon load

| Source | Arithmetic | Statements/s |
|---|---|---|
| Per provider call: authorize (UPDATE budget/quota + INSERT ledger), INSERT observation, capture (UPDATE + INSERT), heartbeat share | 10.7 × ~5.5 | ~60 (peak ~120) |
| Extraction + interpretation writes | | ~30 |
| Job claim/complete/enqueue | ~3 jobs/s × ~3 | ~10 |
| Worker polling (adaptive; batch claims) | 5 workers × ≤ 2/s | ≤ 10 |
| Dashboard/API reads (read models) | ~50 concurrent users | ~15 |
| **Total** | | **≈ 125 avg, ≈ 250 peak** |

Neon at **2 to 4 CU** handles this comfortably. Connections: workers and scheduler use the direct
URL (~5 × 10 = 50 connections); the API uses the pooled URL. WAL is roughly 4 to 5 GB/day.
At this load production never auto-suspends. Auto-suspend matters for preview branches, small
self-hosted instances and the early days, which is why workers back off instead of polling
constantly (ADR-0003).

---

## 5. High-level architecture

```
                 ┌──────────────────────┐        ┌───────────────────────────┐
  Browser ──────►│ Next.js (Render web) │        │ MCP clients (Claude,      │
  (dashboard,    │ marketing: static    │        │ IDEs, agents) Streamable  │
   marketing)    │ dashboard: typed     │        │ HTTP + OAuth / stdio      │
                 │ client from OpenAPI  │        └─────────────┬─────────────┘
                 └──────────┬───────────┘                      │
                            │ HTTPS (session cookie)           │ Bearer (org-scoped token)
                            ▼                                  ▼
          ┌───────────────────────────────────────────────────────────────────────┐
          │                FastAPI modular monolith: ONE codebase                  │
          │                                                                         │
          │  web process (API)        worker process(es)          scheduler (cron)  │
          │  ─ REST /v1, MCP /mcp     ─ claim jobs SKIP LOCKED    ─ enqueue due     │
          │  ─ auth, RBAC, RLS ctx    ─ leases + fencing tokens     runs (idempotent)│
          │  ─ key vault (write-only) ─ run DAG steps:            ─ maintenance jobs │
          │  ─ reads read models        sample → extract →                          │
          │  ─ internal agent           aggregate → read models →                   │
          │                             alert → background agents                   │
          │                                                                         │
          │  modules: auth orgs projects prompts engines observations runs          │
          │           extraction scoring facts audits fixes reports billing*        │
          │           alerts workflow agents* mcp*   (*billing = keys/quotas/usage)  │
          │  shared tool registry ◄── used by internal agent AND MCP server         │
          └─────┬──────────────────────┬─────────────────────────┬──────────────────┘
                │ pooled (web)         │ direct (worker/cron)    │ provider calls via
                ▼                      ▼                         │ credential resolver
     ┌───────────────────────────────────────────────┐           │ (BYOK key → free-tier
     │ Neon Postgres                                  │           │  platform key → blocked)
     │  tenant tables (org_id + RLS, SET LOCAL)       │           ▼
     │  global observation layer (no tenant data)     │   ┌────────────────────────────┐
     │  jobs / outbox / ledger / key vault (cipher)   │   │ OpenAI · Gemini ·          │
     │  partitions, rollups, read models              │   │ Perplexity · Anthropic     │
     └─────────────────────┬──────────────────────────┘   │ (web search / grounding)   │
                           │ archive >45 d (Parquet)       └────────────────────────────┘
                           ▼
                 ┌────────────────────┐   DuckDB for backfills    ┌───────────────────────┐
                 │ Cloudflare R2      │◄──────────────────────────│ SSRF-safe crawler     │
                 │ Parquet archive    │                           │ (audits, fix writer)  │
                 └────────────────────┘                           └───────────────────────┘
```

**Run lifecycle:** scheduler enqueues `run(project, date)` (idempotency key) → the `discover/fan-out`
step expands it into per-(question, engine) `sample` jobs → each `sample` job resolves
credentials, reserves budget, reuses or creates shared observations up to the stopping rule,
captures cost → `extract` jobs (global entity extraction, then tenant interpretation) → when the
fan-in counter reaches zero, `aggregate` → `project read models` → `alert` (significance) →
optional background agents (diagnosis, actions). Each transition is committed atomically with the
step result (outbox, ADR-0005).

**Module boundaries:** each module owns its tables and exposes a Python service interface; no
module queries another module's tables. This keeps the monolith splittable (§10), and it is
enforced by an import-linter contract in CI.

---

## 6. API sketch

REST under `/v1`, JSON, pydantic models, documented by FastAPI's OpenAPI (the source for the
web's generated typed client). Session cookie for the browser; org-scoped bearer tokens for MCP.

| Area | Endpoints |
|---|---|
| Auth | `POST /v1/auth/signup`, `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/google/start`, `GET /v1/auth/google/callback`, `GET /v1/me` |
| Orgs & RBAC | `POST /v1/orgs`, `GET /v1/orgs/{org}`, `GET/POST /v1/orgs/{org}/members`, `POST /v1/orgs/{org}/invitations`, `PATCH /v1/orgs/{org}/members/{user}` (role) |
| **Keys (BYOK)** | `GET /v1/orgs/{org}/keys` (metadata only: provider, last4, created, last used, status) · `POST /v1/orgs/{org}/keys` `{provider, apiKey, label, monthlyCapUsd?}` (validates, encrypts, returns metadata only) · `PUT /v1/orgs/{org}/keys/{id}` (replace) · `DELETE /v1/orgs/{org}/keys/{id}` (revoke) |
| **Usage & quotas** | `GET /v1/orgs/{org}/usage?period=2026-11&groupBy=key|engine|project` · `GET /v1/orgs/{org}/quotas` |
| Projects | `POST/GET /v1/projects`, `GET/PATCH/DELETE /v1/projects/{id}`, `PUT /v1/projects/{id}/competitors`, `PUT /v1/projects/{id}/facts` |
| Questions | `POST /v1/projects/{id}/questions:discover` (async job) · `GET /v1/projects/{id}/questions` · `PATCH /v1/questions/{id}` (accept, edit, `private`) |
| Runs | `POST /v1/projects/{id}/runs` (on demand; returns run + projected cost) · `GET /v1/runs/{id}` (per-engine status: complete/partial/blocked + reasons) |
| Metrics | `GET /v1/projects/{id}/visibility?from&to&engine&groupBy` (rates + Wilson CI + n + annotations) · `GET /v1/projects/{id}/share-of-voice` · `GET /v1/projects/{id}/competitor-gaps` · `GET /v1/answers/{id}` (raw answer + extraction lineage) |
| Facts | `GET /v1/projects/{id}/false-facts` · `PATCH /v1/false-facts/{id}` (confirm/dismiss) |
| Audits & fixes | `POST /v1/projects/{id}/audits` · `GET /v1/audits/{id}` · `GET /v1/projects/{id}/actions` · `POST /v1/actions/{id}/artifacts` (generate) · `GET /v1/artifacts/{id}` |
| Alerts & reports | `GET /v1/projects/{id}/alerts` · `POST /v1/alerts/{id}/feedback` · `GET /v1/projects/{id}/reports/weekly/{week}` |
| Agents | `POST /v1/agent/sessions` · `POST /v1/agent/sessions/{id}/messages` (SSE stream) · `POST /v1/agent/approvals/{id}` (approve/deny spend/publish) · `GET /v1/agent/runs/{id}/trace` |
| MCP | `POST/GET /mcp` (Streamable HTTP) · `/.well-known/oauth-protected-resource` · OAuth authorization server endpoints (§14) |
| Ops | `GET /healthz` (liveness), `GET /readyz` (DB reachable) |

Conventions: cursor pagination, `Idempotency-Key` header on mutating POSTs, RFC 9457 problem
details for errors, ISO-8601 UTC timestamps.

---

## 7. Data model

### Tenancy rules

- **Tenant tables** carry `org_id uuid NOT NULL`, with `ENABLE` + `FORCE ROW LEVEL SECURITY` and the
  policy `USING (org_id = current_setting('app.org_id', true)::uuid) WITH CHECK (same)`.
  The application role is **not** the table owner and has no `BYPASSRLS` (ADR-0014).
- **Global tables** (observation layer) have no `org_id` and **never** contain tenant-private
  data. Tenant-private questions live in `private_*` tenant tables.
- Composite indexes lead with `org_id` (or `project_id`) for tenant tables.

### Core tables (abridged)

```sql
-- identity & tenancy
users(id uuid PK, email citext UNIQUE, password_hash text NULL, google_sub text UNIQUE NULL, created_at)
sessions(id uuid PK, user_id, token_hash bytea UNIQUE, expires_at, created_at, ip, user_agent)
orgs(id uuid PK, name, plan_id FK plans, tier text CHECK (tier IN ('free','byok','self_hosted')), created_at)
memberships(org_id, user_id, role CHECK (role IN ('owner','admin','member','client_viewer')), PK(org_id,user_id))   -- RLS
audit_log(id bigserial, org_id NULL, actor_user_id, action, target, ip, metadata jsonb, created_at)           -- append-only

-- projects (RLS)
projects(id uuid PK, org_id, name, website, category, location, locales text[], engines text[], cadence, created_at)
brand_aliases(id, org_id, project_id, alias, alias_norm)             -- INDEX gin(alias_norm gin_trgm_ops)
competitors(id, org_id, project_id, name, website, aliases text[])
verified_facts(id, org_id, project_id, kind, value jsonb, source, verified_at)
questions(id uuid PK, org_id, project_id, text, intent_cluster, locale,
          normalized_hash bytea,            -- sha256(normalize(text) || locale); key into the shared layer
          visibility text CHECK (visibility IN ('shareable','private')), status, created_at)
          -- INDEX (org_id, project_id), INDEX (normalized_hash) WHERE visibility='shareable'

-- global observation layer (NO org_id, NO tenant data), partitioned monthly by observed_date
observations(id uuid, normalized_hash bytea, question_text text, engine, locale, location,
             model text,                   -- exact provider model identifier
             observed_date date, sample_index smallint,
             answer text, citations jsonb, fanout_queries jsonb, raw_meta jsonb,
             prompt_template_version int, created_at,
             PRIMARY KEY (normalized_hash, engine, locale, model, observed_date, sample_index))
             PARTITION BY RANGE (observed_date)
observation_claims(...same key..., claimed_by_job uuid, fencing_token bigint, claimed_at)   -- in-flight dedupe
entity_extractions(observation_key..., extractor_version, entities jsonb, citations_norm jsonb, created_at)  -- global
private_observations(... same shape + org_id ...)                     -- RLS; tenant-private questions only
model_registry(engine, model, first_seen, last_seen)                   -- model-change annotations

-- interpretation layer (RLS), partitioned monthly
interpretations(id, org_id, project_id, question_id, observation_key..., extractor_version, resolver_version,
                brand_mentioned bool, brand_rank smallint NULL, sentiment, competitor_hits jsonb, run_id, created_at)
false_fact_findings(id, org_id, project_id, observation_key..., fact_id, claim, verdict, evidence jsonb, extractor_version)
daily_rollups(org_id, project_id, question_id, engine, locale, day, n, mentions, rank_sum, rank_n,
              sentiment_counts jsonb, completeness CHECK (completeness IN ('complete','partial','blocked')),
              models text[], PRIMARY KEY (project_id, question_id, engine, locale, day))
read_models.*                                                          -- dashboard projections, rebuildable

-- workflow (cross-tenant; worker role only)
runs(id, org_id, project_id, scheduled_for, status, engine_status jsonb, created_at)
jobs(id uuid PK, kind, status CHECK (status IN ('queued','running','succeeded','failed','dead','cancelled')),
     priority_class smallint, org_id, run_id NULL, payload jsonb,
     virtual_finish double precision,      -- fair-queuing tag (ADR-0006)
     run_after timestamptz, attempts int, max_attempts int,
     lease_owner text NULL, lease_expires_at timestamptz NULL, fencing_token bigint NOT NULL DEFAULT 0,
     idempotency_key text UNIQUE, last_error jsonb, created_at, updated_at)
     -- INDEX jobs_claim ON (priority_class, virtual_finish) WHERE status = 'queued'
     -- INDEX jobs_expired ON (lease_expires_at) WHERE status = 'running'
fanin_counters(run_id, step, remaining int, PRIMARY KEY (run_id, step))
outbox(id bigserial, kind, payload jsonb, idempotency_key UNIQUE, dispatched_at NULL)   -- external effects (email, MCP notifications)
provider_limits(provider, credential_scope, concurrency_limit real, in_flight int, updated_at, PK(provider, credential_scope))  -- AIMD

-- keys, quotas, usage (RLS where org-scoped)
provider_keys(id uuid PK, org_id, provider, label, ciphertext bytea, nonce bytea, wrapped_dek bytea, dek_nonce bytea,
              kek_version int, last4 char(4), status CHECK (status IN ('active','revoked','invalid')),
              monthly_cap_usd_micros bigint NULL, created_by, created_at, last_used_at, last_validated_at, revoked_at,
              replaced_by uuid NULL)        -- INDEX unique(org_id, provider) WHERE status='active'
plans(id, code, ...); plan_entitlements(plan_id, metric, limit_value, period)   -- 'free' plan now; paid plans later = rows
quota_buckets(org_id, period, metric, limit_value, reserved, used, PRIMARY KEY(org_id, period, metric))  -- RLS
usage_ledger(id bigserial, org_id NULL, scope CHECK (scope IN ('org_quota','byok_key','platform')), key_id NULL,
             entry_type CHECK (entry_type IN ('authorize','capture','release','adjust')),
             provider, model, units jsonb, cost_usd_micros bigint, run_id, job_id,
             idempotency_key text UNIQUE, created_at)                -- append-only (no UPDATE/DELETE grants)
platform_budget(period, limit_usd_micros, reserved, used, paced_release_until timestamptz, PRIMARY KEY(period))

-- agents & MCP (RLS)
agent_runs(id, org_id, kind, trigger, status, step_count, tokens_in, tokens_out, cost_usd_micros, cap_usd_micros, created_at)
agent_steps(id, org_id, agent_run_id, seq, type CHECK (type IN ('model_call','tool_call','approval','validation')),
            input jsonb, output jsonb, model, cost_usd_micros, created_at)        -- full replayable trace
approvals(id, org_id, agent_run_id, tool, args jsonb, requested_by, decided_by, decision, decided_at)
mcp_clients(id, org_id, name, redirect_uris, created_at); mcp_tokens(id, org_id, client_id, user_id, scopes text[], token_hash, expires_at)
```

### Partitioning

`observations`, `entity_extractions`, `interpretations`, `false_fact_findings` and
`agent_steps` are range-partitioned **monthly** on their date column. A maintenance job creates
partitions 2 months ahead; old partitions are exported to R2 and then detached and dropped (O(1),
no vacuum storms). `jobs` is purged of terminal rows after 14 days by a batched delete (at 10x it
becomes partitioned by `created_at` day; §10).

### RLS policies (pattern)

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON projects
  USING      (org_id = current_setting('app.org_id', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org_id', true)::uuid);
-- current_setting(..., true) returns NULL when unset → predicate is NULL → zero rows (fail closed)
```

Global observation tables are readable by the app role and writable only by the worker role.
`usage_ledger` and `audit_log` get INSERT/SELECT grants only (append-only by privilege, not just by
convention).

---

## 8. Deep dives

### (a) Sampling statistics and Wilson intervals (ADR-0008)

Each answer is a Bernoulli trial for "brand mentioned". With n samples and x mentions, p̂ = x/n.
The normal-approximation (Wald) interval collapses to zero width at p̂ ∈ {0, 1} and misbehaves at
small n, which is exactly our regime (n ≤ 10). We use the **Wilson score interval**:

```
center    = (p̂ + z²/2n) / (1 + z²/n)
halfwidth = z / (1 + z²/n) × sqrt( p̂(1−p̂)/n + z²/4n² )        z = 1.96 for 95%
```

Examples: 0/3 → [0.00, 0.56]; 3/3 → [0.44, 1.00]; 5/10 → [0.24, 0.76]; 40/120 → [0.25, 0.42].

**Honest interpretation.** A single (question, engine, day) estimate is necessarily wide. Precision
comes from aggregation over questions, engines and days: a project-week at 30 questions × 4
engines × ~5 samples × 7 days ≈ 4,200 samples gives a half-width of about ±1.5 pp for an
unclustered rate. **But samples are not independent:** answers sampled the same day from the same
model share search results, so they are correlated. We treat the **(question, engine, day)** cell
as the cluster and inflate the variance by a design effect `DE = 1 + (m − 1)·ρ` (m = samples per
cluster, ρ = intra-cluster correlation estimated from history), reporting effective n = n / DE.
With ρ ≈ 0.5, DE ≈ 3, so honest project-week half-widths are about ±2.6 pp. The UI always
shows n, and never shows a bare percentage.

Other metrics: **average rank** is conditional on being mentioned (reported with its n and a
bootstrap interval); **share of voice** = brand mentions / (brand + tracked competitor mentions);
**sentiment distribution** = counts per class among mentions (interval per class).

### (b) Adaptive sampling stopping rule (ADR-0008)

For each tenant's view of a (question, engine, locale, model, day) cell:

```
n0 = 3 (minimum), step = 1, cap = plan cap (free: 3 fixed; BYOK default: 10, user-configurable 3..20)
target half-width h* = 0.30 (95% Wilson)
loop:
  take samples sample_index = 0..n-1 (the deterministic PREFIX; never cherry-pick indexes)
  if n ≥ cap → stop (reason: cap)
  if n ≥ n0 and wilson_halfwidth(x, n) ≤ h* → stop (reason: precise)
  else request sample n
```

Consequences: unanimous cells (0/3 or 3/3, half-width 0.28) stop at 3; a 50/50 cell reaches
h* = 0.297 at n = 7 (n = 6 gives 0.312); mixed cells run to 7 to 10. Per-cell h* is deliberately loose.
Its job is to put samples where outcomes are uncertain, not to make single cells precise (see (a)).

**Optional stopping bias.** Stopping when the interval looks tight biases coverage slightly. The
rule is fixed in advance, n is small and capped, and the reported period estimates pool cells. A
Monte Carlo test (phase 6) checks **≥ 93% empirical coverage** for nominal 95% across
p ∈ [0, 1] including the stopping rule; if it fails, we widen with z = 2.24 (≈ 97.5%).

**Shared cells (multi-tenant).** In a shared cell, each tenant evaluates the rule on *its own*
outcome (its brand) over the shared prefix. The cell samples until every interested tenant has
stopped, and the tenant whose rule still says "continue" pays for the extra sample (§8d). Each
tenant reads only the prefix it needs, so its estimate is identical to what it would have got
alone.

### (c) Change detection and Benjamini-Hochberg (ADR-0009)

Per project, per period (default: this week vs previous 4 weeks), for each (question, engine) cell
with enough data:

1. Two-proportion z-test on mention rate (pooled variance, **with the design-effect correction
   from (a)**; falls back to Fisher's exact test when expected counts < 5).
2. Collect the m p-values of the project's family; apply **Benjamini-Hochberg** at q = 0.10:
   sort p(1) ≤ … ≤ p(m), find the largest k with p(k) ≤ (k/m)·q, and reject H(1..k).
3. An alert fires only if a cell is BH-significant **and** |Δ| ≥ **10 pp** (minimum effect size),
   **and** both periods are complete for that engine (partial data never alerts, ADR-0020).
4. Project-level aggregate change is tested separately (one test per metric, Bonferroni across
   the handful of headline metrics).
5. **Model changes:** if `model` differs between periods for that engine, the alert is annotated
   "model changed from X to Y" so a model update isn't presented as something the brand did.

Why BH rather than Bonferroni: with ~120 cells per project, Bonferroni (α/120) would miss nearly
every real change. BH controls the *proportion* of false alerts, which is the product promise
("≤ 10% of alerts are false"). Dependence between cells (shared sources) is positive, which is the
case where BH remains valid (PRDS).

### (d) Shared observation layer and privacy boundary (ADR-0007)

```
OBSERVATION LAYER (global, public AI output only)        INTERPRETATION LAYER (tenant, RLS)
key = (normalized_hash, engine, locale, model,           per project: brand/competitor resolution,
       observed_date, sample_index)                       mentions, rank, sentiment, false facts,
answer, citations, fan-out queries, model ids             rollups, read models
```

- **Normalization:** NFKC, casefold, whitespace/punctuation collapse, locale-specific stop
  phrases; `normalized_hash = sha256(normalized_text || locale)`. Only **shareable** questions
  are hashed into the global layer.
- **What makes a question private:** the user marks it private, or the discovery classifier
  detects tenant-private content (the brand's own internal product names before launch, people's
  names, unreleased info, anything from uploaded files). Private questions go to
  `private_observations` under RLS and are **never** shared or used in the public index.
- **What is shared:** only the question text and the provider's public answer. **Never** who asked,
  which org, which brand they track, or their verified facts. A tenant cannot list which questions
  other tenants track; it can only read observations for hashes of its own questions.
- **Concurrent sampling dedupe:** a sample job first tries
  `INSERT INTO observation_claims ... ON CONFLICT DO NOTHING`. The winner calls the provider;
  losers reschedule with a short delay and then read the observation. Stale claims (expired
  lease) can be taken over, guarded by the fencing token.
- **Who pays (BYOK):** the tenant whose stopping rule requests sample k pays for sample k with
  its own key (or its free-tier quota). Reuse is free. **Invariant: no org's key is ever spent on
  another org's demand, and no tenant pays more than it would alone.**
- **Credential and model compatibility:** observations are keyed by `model`, so sharing happens
  only between tenants using the same engine/model/locale. The free tier's low-cost models share
  among free users and with BYOK users who choose the same models.
- **Opt-out:** an org can disable sharing (it then neither contributes to nor reads from the
  shared layer, and pays the full cost). Self-hosted instances share only within the instance.
- Extraction is split in two: brand-agnostic **entity extraction** runs once per observation
  (global, versioned); **interpretation** (resolution to the tenant's brand and competitors,
  sentiment towards them, fact checks against verified facts) is tenant-scoped.

### (e) Workflow engine: leases, fencing tokens, outbox, idempotency, fair scheduling (ADR-0003..0006)

**Claim** (worker, direct connection):

```sql
WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'queued' AND run_after <= now()
  ORDER BY priority_class, virtual_finish
  LIMIT :batch
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs j SET status = 'running', lease_owner = :worker, lease_expires_at = now() + :lease,
                  fencing_token = j.fencing_token + 1, attempts = j.attempts + 1
FROM next WHERE j.id = next.id
RETURNING j.*;
```

A **reaper** (also run opportunistically by claimers) moves `running` jobs with
`lease_expires_at < now()` back to `queued` (or `dead` if attempts are exhausted).

**Leases and heartbeats:** lease 60 s; handlers heartbeat every 20 s
(`UPDATE jobs SET lease_expires_at = now() + 60s WHERE id = :id AND fencing_token = :tok`). If 0 rows
are updated, the worker lost the lease and must abort.

**Fencing:** a worker paused by GC, a VM freeze or a network partition may wake up after its lease
was given to someone else (a zombie). Every job's result is committed in one transaction that
ends with:

```sql
UPDATE jobs SET status = 'succeeded' WHERE id = :id AND fencing_token = :tok AND status = 'running';
-- 0 rows → ROLLBACK the whole transaction (results + enqueues) → zombie's writes never land
```

Writes that happen mid-job (observations, claims) include the token in their guarded statement.
External side effects can't be fenced, so they are made **idempotent** instead: each provider call
has the key `(run_id, question_id, engine, sample_index)` (the observation primary key enforces
it), and ledger entries have unique idempotency keys. A zombie can at worst waste one provider
call, which is still captured in the ledger, so cost accounting stays true.

**Transactional outbox:** a step's result, the decrement of its fan-in counter, and the INSERT of
its successor jobs (each with a deterministic idempotency key such as `run:{id}:aggregate`) commit
in **one transaction**. A crash can't leave "result saved, next step lost" or "next step enqueued,
result lost". External effects (emails, MCP notifications) go to an `outbox` table in the same
transaction and are dispatched idempotently.

**Retries:** `run_after = now() + random(0, min(cap, base·2^attempt))` (full jitter: base 5 s,
cap 1 h). Errors are classified as retryable (timeouts, 5xx, 429), non-retryable (validation, 4xx
auth) and **blocked** (no credentials or quota). After `max_attempts`, the job becomes **dead** with
`last_error` (stack, inputs, attempt history) and an alert.

**Weighted fair queuing (start-time fair queuing):** at enqueue:
`start = max(org.last_finish, V)`, `virtual_finish = start + est_cost / weight(org)`,
`org.last_finish = virtual_finish`, where V is the virtual time (the tag of the most recently
claimed job). An agency enqueuing 50,000 jobs gets tags stretching far into virtual time; a small
org's next job is tagged near V and is claimed almost immediately. Claim order is
`(priority_class, virtual_finish)`: one index, no per-org scans. Weights: BYOK 1.0, free tier
**0.25** (lower priority but never starved), plus `priority_class` for interactive work (on-demand
runs, agent tool calls) over scheduled batch work.

**Polling:** idle workers back off 0.5 s → 1 s → … → 60 s (production) / 10 min (self-host),
and reset to 0.5 s after a successful claim. No LISTEN/NOTIFY: it doesn't work through Neon's
transaction pooler, and constant polling would keep Neon from auto-suspending (ADR-0003).

### (f) Budget reservations (authorize/capture) (ADR-0010)

Every provider call is bracketed:

```
authorize(scopes, est_cost, idem_key)    -- before the call
   → for each applicable scope, in a FIXED order (org_quota → byok_key → platform) to avoid deadlocks:
     UPDATE quota_buckets SET reserved = reserved + :est
       WHERE org_id=:org AND period=:p AND metric=:m AND used + reserved + :est <= limit_value
     (0 rows → release the earlier holds in this transaction, return BLOCKED)
     INSERT usage_ledger(entry_type='authorize', idempotency_key=idem_key||':auth', ...)
call provider
capture(actual_cost, idem_key)           -- after (or release on failure / timeout)
   → reserved -= est, used += actual; INSERT usage_ledger(entry_type='capture'|'release', ...)
```

- **Scopes:** `org_quota` (free-tier entitlements: projects, questions, samples, runs),
  `byok_key` (the user's optional monthly cap per key), `platform` (global
  `PLATFORM_MONTHLY_BUDGET_USD`, free-tier calls only). Self-hosted: quotas disabled, so only
  `byok_key` caps apply if set.
- **Concurrency-safe:** the conditional UPDATE is atomic, so many workers can't overshoot.
  Overshoot is bounded by `actual − estimate` of in-flight calls (estimates use p90 cost per
  engine/model, refreshed from the ledger).
- **Crash safety:** a reservation without a capture expires: a sweeper releases authorizations
  older than the lease + 10 min (appending a `release` entry). The ledger is the source of truth;
  `quota_buckets` are a derived counter and can be rebuilt from the ledger.
- **Extensible to paid plans:** entitlements live in `plans`/`plan_entitlements` rows. A paid plan
  later means new rows and a payments module that writes `adjust` entries; no schema rewrite.

### (g) AIMD rate control (ADR-0011)

Per (provider, credential scope), where the scope is the platform key or one BYOK key, because
rate limits are per key:

```
on success: limit = min(max, limit + 1/limit)      (≈ +1 per RTT window: additive increase)
on 429 / timeout / 529-overloaded: limit = max(1, limit × 0.5)   (multiplicative decrease), honor Retry-After
```

Coordinated through Postgres: `provider_limits(provider, scope, concurrency_limit, in_flight)`.
A worker acquires a slot with
`UPDATE ... SET in_flight = in_flight + 1 WHERE ... AND in_flight < floor(concurrency_limit) RETURNING`;
releases decrement it; the limit is updated in the same statement as the release. Slots leaked by
crashed workers are reclaimed by the lease reaper (slot rows carry the job id). At ~11 calls/s
this is ~22 small UPDATEs/s: fine. If it became hot, each worker would take a local quota of
`limit / workers`. Decreases apply at most once per window (no double-halving from a burst of 429s
caused by the same overload).

### (h) Entity resolution cascade (ADR-0012)

Resolve each extracted entity mention to the project's brand, a known competitor, or "other",
using the cheapest stage that is confident:

| Stage | Method | Accept | Ambiguous → next | Reject |
|---|---|---|---|---|
| 1 | Exact match on normalized aliases (NFKC, casefold, strip legal suffixes "Inc/LLC/Ltd", punctuation) or **cited domain == brand domain** | match | — | — |
| 2 | `pg_trgm` similarity vs aliases (GIN index) | ≥ 0.60 | 0.30 to 0.60 | < 0.30 |
| 3 | Embedding cosine (name + context snippet vs brand profile) | ≥ 0.85 | 0.70 to 0.85 | < 0.70 |
| 4 | LLM adjudication (structured output: same entity? yes/no/unsure, with reason) | yes | unsure → "unresolved" bucket, surfaced to the user | no |

Thresholds are **starting points**, tuned on the golden set so that auto-accept precision is
≥ 0.97 at each stage. Expect about 80% of mentions to be resolved at stage 1, about 15% at stages
2 and 3, and under 5% to reach the LLM. Results are cached per (entity string, project,
resolver_version). User confirmations ("yes, 'Joe's Plumbing Leeds' is us") become aliases.

### (i) Lineage and backfills (ADR-0013)

- Observations are **immutable** (INSERT only; no UPDATE grant).
- Every derived row stores `extractor_version`, `resolver_version`, `prompt_template_version`
  and model identifiers, so every number on a dashboard can be traced to raw answers.
- Shipping a better extractor (new version) enqueues **backfill jobs** per partition (low
  priority class, fair-queued as a system org), which write new-version rows next to the old ones.
  Read models are **rebuilt from source** and the switch is atomic: a `current_versions` row is
  flipped after the backfill completes and passes evals. Rollback is flipping it back.
- Archived partitions (R2 Parquet) are backfilled by DuckDB reading Parquet directly
  (ADR-0016).

### (j) RLS with a transaction pooler (ADR-0014)

Neon's pooler (PgBouncer, transaction mode) hands a server connection to a client for **one
transaction**. Session state (`SET`, prepared statements, advisory locks, LISTEN) can leak to
the next tenant or vanish. Therefore:

- The tenant context is set **per transaction**: `SELECT set_config('app.org_id', :org, true)`
  (the `true` = local to the transaction; `SET LOCAL` can't take bind parameters). It is set first
  thing in the request's unit of work by a FastAPI dependency that also checks membership and role.
- asyncpg prepared statement caches are disabled on the pooled URL
  (`statement_cache_size=0`); prepared statements don't survive transaction pooling.
- If the setting is missing, `current_setting('app.org_id', true)` is NULL and policies return
  nothing (**fail closed**).
- Workers use the direct URL and a role allowed to claim `jobs` across orgs, but they set
  `app.org_id` per job transaction before touching tenant tables. RLS still applies (FORCE).
- **Tests:** for every tenant table, CI creates two orgs and asserts that org A's context can't
  SELECT, UPDATE, DELETE or INSERT org B's rows, and that a transaction without context sees
  nothing. A catalog query fails CI if any table with `org_id` lacks enabled+forced RLS.

### (k) SSRF-safe crawling (ADR-0017)

The auditor and fix-writer fetch user-supplied URLs from our infrastructure. Defenses:

1. Scheme `http`/`https` only; ports 80/443 only; no credentials in URLs; IDNA-normalize hosts.
2. Resolve DNS ourselves; **reject if any** resolved address is loopback, private (RFC 1918),
   CGNAT (100.64/10), link-local (169.254/16, incl. cloud metadata 169.254.169.254), unique-local
   (fc00::/7), fe80::/10, multicast, unspecified, reserved, or IPv4-mapped/6to4 forms of these.
3. **Pin** the connection to the validated IP while sending the original Host/SNI, so a second DNS
   lookup can't rebind to an internal address (DNS rebinding).
4. Redirects followed **manually**, max 5, re-validating steps 1 to 3 on every hop.
5. Caps: 10 s total, 2 MB body (streamed, decompression-bomb guard), max 50 pages per audit,
   1 request/s per host.
6. Fetch `robots.txt` first and obey it for our UA:
   `RecommendrAuditBot/1.0 (+https://recommendr.app/bot)`.
7. Runs in workers only; egress goes through the same client everywhere (agents included, §14).

### (l) BYOK key vault and credential resolver (ADR-0022)

**Envelope encryption:**

```
on save:  validate key with a minimal provider call (models list where free; else 1-token completion)
          DEK = random 32 bytes
          ciphertext = AES-256-GCM(DEK, nonce=random 96-bit, plaintext=key, AAD = org_id‖key_id‖provider)
          wrapped_dek = AES-256-GCM(KEK[v], nonce2, DEK, AAD = key_id‖v)
          store ciphertext, nonces, wrapped_dek, kek_version=v, last4; discard plaintext and DEK
on use:   (worker only) unwrap DEK with KEK[kek_version] → decrypt → use in memory for the call → drop
rotation: new KEY_ENCRYPTION_KEY + version; keep previous KEKs in KEY_ENCRYPTION_KEYS_PREVIOUS;
          a backfill job re-wraps DEKs (cheap: secrets are not re-encrypted); retire the old KEK after.
```

- The **AAD** binds each ciphertext to its org/key/provider, so a ciphertext copied into another
  org's row (e.g. via SQL injection) fails authentication.
- The KEK lives in the environment, never in the database. A **DB dump alone reveals nothing**. A
  compromised app host with env access does: that is the accepted residual risk; KMS-backed KEKs
  are a later option (ADR-0022).
- **Write-only API:** responses contain provider, label, last4, status, created, last used,
  usage; never the key. Replace = validate the new key, insert it, revoke the old key atomically.
- **Never logged:** a structlog processor and the Sentry `before_send` hook redact known key shapes
  (`sk-…`, `sk-ant-…`, `pplx-…`, `AIza…`) and any field named like `*key*`, `*secret*`,
  `*token*` or `authorization`. Provider SDK exceptions are re-raised as sanitized errors; HTTP
  client debug logging is disabled for provider hosts. Unit tests feed fake keys through every
  logging/error path and assert they never appear.
- Only owner/admin can add, replace or revoke keys (audit-logged).

**Credential resolver** (used by every engine adapter):

```
resolve(org, engine, purpose) →
  1. active BYOK key for the provider        → Credential(byok, key_id, model per project settings)
  2. else org.tier = free AND engine in free engines AND quota available AND platform budget available
                                             → Credential(platform, low-cost model, fixed sample cap)
  3. else                                    → Blocked("Add your OpenAI key to sample ChatGPT,
                                                        or wait for your free quota to reset on Dec 1")
```

A blocked engine marks that engine **blocked** for the run (not zero, ADR-0020). Usage and cost
are recorded per key and per org in the ledger and shown on the usage page.

### (m) Free tier and the platform spend cap (ADR-0023)

- Entitlements (plan `free`): 1 project, ≤ 10 questions, weekly runs, 2 engines on low-cost
  models, **fixed 3 samples** (no adaptive extension), enforced by `quota_buckets` + ledger at
  authorize time (and at the API level when creating projects/questions).
- **Global cap:** `platform_budget` for the month = `PLATFORM_MONTHLY_BUDGET_USD`. **Pacing:** the
  budget is released linearly over the month (a token bucket refilled daily), so early-month users
  can't exhaust it and late-month users aren't starved. When the remaining budget hits 80% / 100%,
  the platform owner gets an alert (outbox → email); at 100%, free-tier runs are **blocked** with
  a clear message ("free capacity for this month is used up; add your own key to continue").
- Free-tier jobs are fair-queued with weight 0.25 and run on the platform key's AIMD scope, so
  they can never crowd out BYOK users.
- Abuse: one free org per verified email + per-IP signup rate limits; disposable email domains
  blocked; projects must have a resolvable website.

### (n) Self-hosting (ADR-0024)

Docker Compose with `postgres`, `backend-web`, `backend-worker`, `backend-scheduler` (a loop
container that runs the scheduler every N minutes), and `web`. Images are the same ones Render runs.
`DEPLOYMENT_MODE=self_hosted` turns quotas off, removes the platform key path from the resolver
(**BYOK only**), and disables the public index and sharing outside the instance. Details in
[`self-hosting.md`](self-hosting.md).

### (o) Public AI visibility index (future phase, ADR-0025)

Statically generated pages per category ("Who AI recommends for CRM for agencies, Nov 2026")
built **only** from the shared observation layer and **only** for questions that are:
(1) shareable (never private), (2) **public-eligible**: generated from the platform's curated
category question set *or* tracked by ≥ **5 distinct orgs** (k-anonymity, so the index never
reveals what a single tenant is tracking), and (3) free of personal data (PII classifier +
manual review for new categories). Never built from interpretations, verified facts, private
observations or anything tenant-scoped. Businesses can request correction/removal of their
listing; the index states its methodology and uncertainty (intervals) on every page.

---

## 9. Failure modes

| Failure | Impact | Detection | Mitigation |
|---|---|---|---|
| **Worker crash mid-job** | Job's lease lapses; partial in-memory work lost | Lease expiry (60 s); reaper | Job requeued with backoff. Committed observations are reused (idempotency key), so no provider call is repeated for samples already stored. Outbox guarantees no half-done transitions. Chaos tests kill workers mid-job and assert no lost or duplicated results |
| **Zombie worker** (paused, wakes after lease reassigned) | Could double-write results | Fencing token mismatch on commit (0 rows) | Whole transaction rolled back; zombie aborts; at most one wasted (but ledgered) provider call |
| **Provider outage** | One engine can't be sampled | Error-rate spike per provider; circuit breaker | That engine is marked **partial/incomplete** for affected runs; metrics exclude it with a visible gap, **never zero** (ADR-0020); retries with backoff up to the run deadline; other engines continue |
| **Provider 429 storm** | Throughput collapses, retries amplify load | 429 rate per (provider, scope) | AIMD halves concurrency, honors Retry-After; full-jitter backoff; free-tier traffic (weight 0.25) yields first; per-key scopes isolate one tenant's limits from others |
| **Neon cold start** | First query after suspend waits ~0.5 to 3 s | Connection latency metric | Connect timeouts sized for it (10 s), retries on connect; `/healthz` doesn't touch the DB; workers back off polling so suspend is possible in quiet environments |
| **Neon down** | API reads/writes fail; workers can't claim | `/readyz`, DB error rate, Neon status | API returns 503 with retry hints; workers pause claiming (jittered); no work is lost (it's all in the DB); provider calls already in flight complete but their results can't be stored, so the job retries later and the observation is re-fetched (ledger captures actual cost after recovery via idempotent capture, or release on timeout) |
| **Poison job** | Retries waste capacity | `attempts = max_attempts` | Moves to `dead` with full context (inputs, stack, attempt history); alert; never blocks the queue (SKIP LOCKED + backoff); admin can re-drive after a fix |
| **Duplicate webhook** (email provider events now; payments later) | Double processing | `webhook_events(provider, event_id)` unique | Signature verified, then `INSERT ... ON CONFLICT DO NOTHING`; processing happens only on first insert, in the same transaction |
| **Extractor regression** | Wrong mentions → wrong metrics and alerts | Evals gate in CI (F1/precision vs baseline); production canary diff on a sample | Can't merge if evals regress; new versions write side by side, `current_versions` flip only after checks; rollback = flip back; backfill recomputes |
| **Silent model update** | Metric shifts that aren't the brand's doing | `model` id change in responses; `model_registry` | Annotate the time series; alerts state "model changed"; change detection can be stratified by model |
| **BYOK key revoked/invalid mid-run** | Calls fail with 401 | 401 from provider | Key marked `invalid`, org notified, engine **blocked** for the run (not zero); other keys unaffected |
| **Platform budget exhausted** | Free-tier runs stop | Budget at 80%/100% | Owner alerted at 80% and 100%; free runs blocked with a clear message; BYOK unaffected |
| **KEK lost** | All stored keys undecryptable | Decrypt failures | Users must re-enter keys (we can't recover them; that's the point). KEK backup procedure documented; rotation keeps previous versions |
| **Agent runaway / injection** | Cost blow-up, unwanted actions | Step/token/cost caps; approval gate | Hard caps per run, spend/publish tools need human approval, untrusted content can't trigger them (§14) |

---

## 10. Scaling

### 10x (5,000 orgs, 20,000 projects, ~9.3M calls/day ≈ 107 calls/s, ~1,300 in flight)

- **Workers:** ~20 to 25 instances (autoscale on queue lag). Per-key AIMD scopes spread the load
  across many BYOK keys, so rate limits aren't a single global bottleneck.
- **Postgres queue:** ~2.5M jobs/day ≈ 30/s is still comfortable for SKIP LOCKED, but **job churn
  creates vacuum pressure**. Partition `jobs` by day and drop old partitions; tune autovacuum on
  hot tables; move fan-in counters to per-run rows (already).
- **Storage:** ~1.2 TB/month of growth, so cut hot retention to ~21 days, rely on R2 for history,
  and move rollups/read models to their own partition set.
- **Read replicas** (Neon read replicas) for dashboards, reports and ask-your-data, so analytical
  reads don't compete with the write path.
- **Hot rows:** budget/quota rows for very large agencies are split into N sub-buckets
  (sum on read); AIMD gets per-worker local quotas.

### 100x (50,000 orgs, ~93M calls/day ≈ 1,100 calls/s, ~13k in flight)

- **Move the queue off Postgres** when any of these hold: p99 claim latency > 100 ms, the job
  table exceeds ~30% of DB write load, or autovacuum can't keep up. Candidates: a dedicated
  Postgres for the queue first (same code), then Temporal (if the workflow semantics justify it)
  or SQS/Redis Streams plus our own state machine. The fencing/idempotency contracts carry over.
- **Split the observation service:** the global observation layer is already a natural seam (no
  tenant data, append-only, its own module interface). It becomes its own service + database (or
  ClickHouse for analytics on observations), with the interpretation layer calling it.
- **Analytics** (rollups, trends, ask-your-data) move to a columnar store (ClickHouse/DuckDB over
  Parquet) fed by CDC.
- **Multiple platform keys** / enterprise rate limits for the free tier; regional workers for
  locale-specific sampling.
- **Sharing gets more valuable with scale:** overlap grows with more tenants per category.

---

## 11. Security

- **Authentication:** email+password with **argon2id** (OWASP parameters: m = 19 MiB, t = 2,
  p = 1, re-tuned to ~100 ms on prod hardware) and rehash-on-login when parameters change; Google
  OAuth (authorization code + PKCE, `state`, `nonce`). Login and signup rate-limited per IP and
  per account; generic error messages; breached-password check (k-anonymity range API, optional).
- **Sessions:** opaque 256-bit random token in a cookie `Secure; HttpOnly; SameSite=Lax;
  Domain=<parent domain>`; only the SHA-256 hash is stored; rotation on login and privilege change;
  idle and absolute expiry; server-side revocation.
- **CSRF:** SameSite=Lax plus an `Origin`/`Referer` check on every state-changing request, plus a
  custom header requirement for the JSON API.
- **Authorization:** RBAC (owner, admin, member, client-viewer) checked in FastAPI dependencies
  **and** RLS in the database (defense in depth). Client-viewers are read-only and see only
  explicitly shared projects.
- **Tenant isolation:** §8j; CI checks and tests; separate tables for private observations.
- **Secrets:** env vars only; `.env` ignored; BYOK vault (§8l); no secrets in logs or Sentry
  (scrubbers + tests).
- **SSRF:** §8k for every outbound fetch, agents included.
- **LLM-specific:** answers, crawled pages and uploads are **untrusted data** (§14 prompt injection
  defenses). Extraction uses structured output validated by pydantic; no model output is ever
  executed or rendered as raw HTML; generated artifacts (JSON-LD, HTML drafts) are validated and
  escaped. Ask-your-data uses tool calls over parameterized, RLS-scoped queries, **never
  free-form text-to-SQL**.
- **Webhooks:** signature verification, timestamp tolerance, idempotent processing.
- **Audit log** (append-only): logins, role changes, key add/replace/revoke, approvals of
  spend/publish actions, MCP client/token grants, exports, deletions.
- **Supply chain:** `uv.lock` and `pnpm-lock.yaml` committed; Dependabot; `pip-audit`,
  `pnpm audit`, secret scanning and CodeQL in CI.
- **Disclosure:** [SECURITY.md](../SECURITY.md) (GitHub private vulnerability reporting).
- **AGPL note:** operators who modify Recommendr and offer it over a network must publish their
  changes (ADR-0021). That is a licensing obligation, not a security control, but it keeps
  forks inspectable.

---

## 12. Observability and SLOs

**Logs:** structlog JSON with `request_id`, `org_id`, `user_id`, `run_id`, `job_id`,
`agent_run_id`, `fencing_token`; redaction processor (§8l). **Errors:** Sentry with the same
scrubber. **Traces:** OpenTelemetry spans for requests, jobs and provider calls (phase 13).

**Metrics**

| Area | Metric |
|---|---|
| Queue | queue depth and age by kind/priority, claim latency, lease expirations, dead jobs, fencing rejections |
| Runs | completion time vs scheduled, % complete/partial/blocked per engine |
| Providers | calls, latency, errors and 429s by provider/model/scope; AIMD limit over time |
| Cost | $ per org/key/engine/day; platform budget burn vs pacing line; cost per tracked question-month |
| Sharing | reuse ratio (observations consumed / observations created), saving vs unshared |
| Quality | extraction F1 (latest eval), unresolved-entity rate, LLM adjudication rate |
| Stats | alerts fired, BH rejections, alert feedback ("not useful" rate) |
| Agents | steps, tokens, cost per run, cap hits, uncited-claim rejections, approval requests/denials |
| API | RED per route, p95/p99, 5xx |
| Security | auth failures, RLS-context-missing errors (should be 0), key validation failures |

**SLOs and alerts**

| SLO | Target | Alert |
|---|---|---|
| Dashboard API latency | p95 < 300 ms (30-day) | burn rate > 2× over 1 h |
| Run completion | 99% terminal within 6 h | runs > 4 h late, or partial rate > 10% |
| Queue health | oldest queued interactive job < 60 s | > 5 min |
| Dead jobs | 0 unexpected | any new dead job |
| Platform budget | spend ≤ pacing line | at 80% and 100% of monthly cap |
| Tenant isolation | 0 violations | any RLS test failure in CI blocks deploy; any missing-context error in prod pages |
| Alert quality | "not useful" feedback < 10% | weekly review |

---

## 13. Alternatives considered

| Decision | Chosen | Main alternatives | ADR |
|---|---|---|---|
| Architecture | Modular monolith | Microservices | [0001](adr/0001-modular-monolith.md) |
| Stack | FastAPI + Next.js | Django, Node backend, SPA | [0002](adr/0002-fastapi-and-nextjs.md) |
| Queue/workflow store | Postgres (Neon) | Redis/Celery, SQS, Temporal | [0003](adr/0003-postgres-as-job-queue-and-workflow-store.md) |
| Zombie protection | Leases + fencing tokens | Leases only, advisory locks | [0004](adr/0004-leases-with-fencing-tokens.md) |
| Step transitions | Transactional outbox | Enqueue after commit, two-phase | [0005](adr/0005-transactional-outbox.md) |
| Tenant fairness | Weighted fair queuing | FIFO, per-org queues, strict priority | [0006](adr/0006-weighted-fair-scheduling.md) |
| Cost | Shared observations + tenant interpretation | Per-tenant sampling | [0007](adr/0007-shared-observation-layer.md) |
| Sampling | Wilson + adaptive stopping | Fixed n, Wald, Bayesian | [0008](adr/0008-wilson-intervals-and-adaptive-sampling.md) |
| Change detection | Two-proportion + BH | Thresholds, Bonferroni, none | [0009](adr/0009-change-detection-with-benjamini-hochberg.md) |
| Budgets | Authorize/capture reservations | Post-hoc accounting, counters | [0010](adr/0010-budget-reservations.md) |
| Rate control | AIMD per provider/key | Fixed limits, token buckets | [0011](adr/0011-aimd-adaptive-concurrency.md) |
| Entity resolution | Cost-ordered cascade | LLM for everything, exact only | [0012](adr/0012-entity-resolution-cascade.md) |
| Lineage | Immutable observations + versions + backfills | Mutable in-place updates | [0013](adr/0013-immutable-observations-lineage-backfills.md) |
| Tenancy | RLS + SET LOCAL | App-only filters, schema/db per tenant | [0014](adr/0014-row-level-security-with-set-local.md) |
| Read path | Partitions, rollups, CQRS | Query raw tables, OLAP store now | [0015](adr/0015-partitioning-rollups-cqrs.md) |
| Archive | R2 Parquet + DuckDB | Keep in Postgres, S3 Glacier, BigQuery | [0016](adr/0016-r2-parquet-archival-with-duckdb.md) |
| Crawling | SSRF-hardened fetcher | Plain HTTP client, third-party crawler | [0017](adr/0017-ssrf-hardened-website-auditor.md) |
| Measurement source | Provider APIs with web search | Scraping consumer apps | [0018](adr/0018-provider-apis-as-measurement-source.md) |
| Hosting | Render + Neon (+ self-host) | Fly, AWS, Vercel, Supabase | [0019](adr/0019-render-and-neon-hosting.md) |
| Failures | Partial results, never zeros | Treat missing as 0, fail whole run | [0020](adr/0020-partial-results-instead-of-zeros.md) |
| License | AGPL-3.0 | MIT, Apache-2.0, BSL/FSL | [0021](adr/0021-open-source-under-agpl.md) |
| Keys | BYOK with envelope encryption | Platform keys only, pgcrypto, KMS | [0022](adr/0022-byok-envelope-encryption.md) |
| Free tier | Small free tier + global spend cap | No free tier, uncapped | [0023](adr/0023-free-tier-with-platform-spend-cap.md) |
| Self-host | Docker Compose | Helm/k8s, single binary | [0024](adr/0024-self-hosting-with-docker-compose.md) |
| Public index | Only public shared observations, k-anonymous | No index, include tenant data | [0025](adr/0025-public-visibility-index.md) |
| Agent tools | One shared registry for agent + MCP | Separate tool sets | [0026](adr/0026-shared-tool-registry.md) |
| Agent safety | Budgets, approvals, grounding, traces | Free-running agent | [0027](adr/0027-agent-safety.md) |
| Injection | Data blocks, capability gating, egress control | Prompt-only defenses | [0028](adr/0028-prompt-injection-defenses.md) |
| MCP | Streamable HTTP + OAuth; stdio for self-host | API keys, SSE transport | [0029](adr/0029-mcp-server-transport-and-authorization.md) |
| Closed loop | Approved publishing via PRs | Auto-publish, no publishing | [0030](adr/0030-closed-loop-fix-publishing.md) |

---

## 14. Agents and MCP

Product behavior: [`product-spec.md` → Agents and MCP](product-spec.md#agents-and-mcp).

### 14.1 Shared tool layer (ADR-0026)

One registry of typed tools, used by **both** the internal agent and the MCP server, so there is
one implementation, one permission check and one audit trail:

```python
@tool(
    name="get_visibility",
    description="Mention rate (with Wilson 95% CI and n), average rank and share of voice ...",
    scope="projects:read",
    side_effect=SideEffect.READ,          # READ | GENERATE | SPEND | PUBLISH
)
async def get_visibility(ctx: ToolContext, args: GetVisibilityIn) -> GetVisibilityOut: ...
```

| Tool | Side effect | Notes |
|---|---|---|
| `list_projects` | read | |
| `get_visibility` | read | returns `metric_id`s for citation |
| `get_trends` | read | includes model-change and partial-data annotations |
| `compare_competitors` | read | gaps, cited sources per competitor |
| `list_answers` / `get_answer` | read | returns `answer_id`s; answer text is **untrusted data** |
| `list_sources` | read | cited domains/URLs, frequency per engine |
| `list_fanouts` | read | search sub-queries engines ran (where exposed) |
| `list_false_facts` | read | |
| `list_actions` | read | ranked fix plan |
| `generate_fix` | generate | drafts an artifact (costs LLM tokens; charged to the agent run's budget) |
| `start_check` | **spend** | starts a sampling run; requires approval; budget reserved |
| `publish_fix` | **publish** | later phase; requires approval; never triggered by untrusted content alone |

- Input/output schemas are pydantic models, exported as JSON Schema for both the LLM tool
  definitions and MCP `tools/list`.
- `ToolContext` carries `org_id` (RLS context), user, granted scopes, the `agent_run_id` for
  tracing and budget, and a **taint** flag (§14.4).
- Every invocation is authorized (scope + RBAC), rate-limited, audit-logged and traced.

### 14.2 Internal agent (ADR-0027)

A tool-using loop: model call → tool calls → results → … until a final answer or a limit:

- **Limits per agent run:** max steps (default 12), token budget, and a **cost cap**. The cost is
  reserved and captured through the same reservation system as provider calls (§8f), against the
  org's BYOK key or free-tier quota.
- **Grounding:** the final answer is structured: claims with `citations: [answer_id | metric_id |
  source_id]`. A validator rejects any numeric claim without a citation, or whose cited value
  doesn't match the tool result (tolerance for rounding), and retries with feedback (max 2). If
  it still fails, the answer is returned with the uncited claims removed and a visible note.
- **Approvals:** `spend` and `publish` tools never execute directly. The loop pauses, persists an
  `approvals` row, and the UI shows the exact action and its estimated cost; execution resumes
  only after an explicit user decision.
- **Trace:** every step (model call with prompt/response, tool call with inputs/outputs, cost,
  validation results) is stored in `agent_steps`. A run is **replayable** with recorded tool
  outputs, which makes debugging and evals possible. Traces are tenant data (RLS) and are
  scrubbed of secrets.

### 14.3 Background agents (workflow steps)

| Agent | Trigger | Output |
|---|---|---|
| **Diagnosis** | after a BH-significant change (alert step) | "what changed and likely why", citing answers, sources, model changes |
| **Actions** | after aggregate / weekly | ranked fix list (impact × effort) feeding the fix plan |
| **Fix writer** | user asks, or for top actions | reads the site through the SSRF-safe crawler, drafts artifacts (FAQ, JSON-LD, llms.txt, page drafts, outreach) |
| **Competitor investigator** | new competitor gap | what sources/attributes drive the competitor's recommendations |

They run as ordinary jobs (leases, fencing, outbox, fair scheduling) with the **same** limits,
grounding validation and tracing, and they never call spend/publish tools: they can only
*propose* actions that a user approves.

### 14.4 Prompt injection defenses (ADR-0028)

Untrusted content: crawled web pages, AI answers, cited source snippets, uploaded files.

1. **Data blocks:** untrusted content is placed only in clearly delimited, typed data blocks
   inside tool results (e.g. `<untrusted_content source="answer:…">…</untrusted_content>`, with
   delimiter collision escaping). It is never placed in system instructions. The system prompt
   states that content in data blocks is data, never instructions.
2. **Detection:** instruction-like text ("ignore previous instructions", "call publish_fix",
   tool-name mentions, role markers) is flagged and neutralized (stripped or quoted), and the
   flag is recorded in the trace.
3. **Capability gating (taint tracking):** once a run has read untrusted content, the context is
   **tainted**. Tainted runs can't execute `spend` or `publish` tools at all without a fresh,
   explicit user approval of the specific action. The approval UI shows *why* the agent wants it,
   and the user-originated request must exist. Background agents can't call them at all.
4. **No arbitrary egress:** agent tools can't fetch arbitrary URLs. Fetching goes only through
   the SSRF-safe crawler (§8k), and only for the project's own domains and sources already cited in
   observations.
5. **Output handling:** agent output is rendered as text/markdown with HTML disabled; links are
   shown with their full domain; generated artifacts are schema-validated.
6. **Red-team suite** (in `/evals`): fixtures with injected instructions in pages, answers and
   files (exfiltration attempts, fake tool calls, publish/spend requests, prompt-leak requests).
   CI asserts no gated tool executes, no data leaves allowed domains, and the agent reports the
   injection.

### 14.5 MCP server (ADR-0029)

- **Hosted:** Streamable HTTP transport at `/mcp` on the API, exposing the shared tools plus
  read-only **resources** (`recommendr://projects/{id}/summary`,
  `recommendr://projects/{id}/reports/{week}`).
- **Authorization:** OAuth 2.1 per the MCP authorization spec: protected resource metadata,
  authorization code + PKCE, dynamic client registration; the user picks the org and scopes on
  consent. Tokens are **per org**, scoped (`projects:read`, `fixes:generate`, `checks:start`),
  short-lived with refresh, stored hashed, revocable in the UI.
- **Spend tools require confirmation:** `start_check` returns a confirmation request (estimated
  cost) and executes only after confirmation through MCP elicitation, or through an approval in the
  Recommendr UI if the client doesn't support elicitation.
- **Rate limited** per token and org; every call **audited**; same budgets as the internal agent.
- **Self-host:** `recommendr-mcp --stdio` runs locally against the instance's DB/API with a local
  token, for desktop MCP clients.

### 14.6 Closed loop (later phase, ADR-0030)

Recommendr acts as an MCP **client** / integration layer to publish **approved** fixes: GitHub
pull request to the user's site repo first (GitHub App, least-privilege, one repo), with
WordPress and Webflow later. Nothing is published without explicit approval of the exact diff.
Impact is then measured with the **same** statistical machinery: pre/post comparison of the
affected questions (two-proportion tests with BH, model-change annotations), reported with its
uncertainty and the caveat that it shows association, not proven causation.

### 14.7 Agent evals

Scripted scenarios in `/evals/agents` use the fake provider adapters and fixtures where the
correct diagnosis is known (e.g. "competitor gained because a new listicle on example.com is
cited by 3 engines"). Measured in CI: **diagnosis accuracy**, **citation validity** (every cited
id exists and supports the claim), **cost per run**, and **zero gated-tool executions** on the
red-team cases.
