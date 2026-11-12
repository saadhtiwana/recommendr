# CLAUDE.md

## PRODUCT

Recommendr is a **free, open-source (AGPL-3.0) alternative to Profound and Peec AI**: an AI search visibility tool for small businesses, local businesses and agencies. It is multi-tenant. A project has a brand (name, aliases, website, category, location, verified facts) and competitors. Recommendr discovers the questions customers ask AI assistants, samples answers from ChatGPT, Gemini, Perplexity and Claude via their APIs with web search/grounding, extracts mentions, rank, sentiment, competitors and cited sources, computes statistically honest visibility metrics, detects false facts AI states about the brand, audits the website for AI-readiness, and generates a prioritized fix plan with ready-to-use fixes. Positioning: **free and open source, bring your own keys, honest about uncertainty, focused on fixes.**

Business model:
- **Bring your own keys (BYOK):** orgs add their own OpenAI, Google Gemini, Perplexity and Anthropic API keys. Keys live in an envelope-encrypted vault and are write-only from the API's perspective.
- **Free tier without keys:** 1 project, up to 10 questions, weekly runs, 2 engines on low-cost models, fixed sample cap, enforced through the usage ledger, under a global monthly platform spend cap (`PLATFORM_MONTHLY_BUDGET_USD`) that stops free runs and alerts the operator when reached. Free-tier runs get lower scheduling priority than BYOK runs.
- **Self-hosting:** one-command Docker Compose; self-hosted instances are BYOK only with quotas disabled.
- **No payments.** The ledger records usage against quotas and costs per key; the design stays extensible so paid plans could be added later without schema rewrites.

## AI FEATURES

Question discovery clustered by intent; answer extraction via structured output; visibility scoring with confidence intervals; competitor gap analysis ("why them, not me"); false-facts detection against verified brand facts; website AI-readiness audit (AI crawler rules in robots.txt for GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended; JSON-LD; llms.txt; FAQ coverage; crawlability); fix plan ranked by impact and effort with generated artifacts (FAQ content, JSON-LD, llms.txt, page drafts, outreach drafts); source opportunities; weekly AI report; statistically significant alerts; ask-your-data chat.

**Agents and MCP:** one shared registry of typed tools (pydantic schemas, required scope, side-effect class read | generate | spend | publish) used by both the internal agent and the MCP server. The internal agent and background agents (diagnosis, actions, fix writer, competitor investigator) run with step/token/cost caps charged through budget reservations, cite tool results for every factual claim, need explicit user approval for spend/publish tools, and store full replayable traces. Untrusted content (websites, AI answers, uploads) is treated as data, never instructions. MCP server: Streamable HTTP with OAuth and per-org scoped tokens; stdio for self-hosters. Later: a closed loop that publishes approved fixes (GitHub PR first) and measures impact with the same statistics.

## ARCHITECTURE PRINCIPLE

Deliberately a modular monolith on Postgres. Complexity is spent only where the real problems are: measurement statistics, cost, correctness under failure, tenant isolation, and key security. One FastAPI codebase runs as three Render process types: web (API), worker (workflow/job execution), scheduler (cron that enqueues due runs). Modules talk through service interfaces, never each other's tables.

### 1. MEASUREMENT (statistics)
- LLM output is non-deterministic, so every metric is an estimate from samples. Report mention rate with a Wilson score interval, average rank, share of voice, sentiment distribution.
- Adaptive sampling: per (question, engine) sample until the interval half-width falls below a target or a per-plan sample cap is reached. Document the stopping rule.
- Change detection: compare periods with a two-proportion test; across all (question, engine) pairs, control false discoveries with Benjamini-Hochberg. Alerts fire only on significant changes above a minimum effect size.
- Record provider model identifiers on every observation; detect model changes and annotate them on time series.

### 2. COST (shared observation layer)
- Two layers. Observation layer (global, non-tenant): raw AI answers keyed by (normalized_question_hash, engine, locale/location, model, date, sample_index). Interpretation layer (tenant-scoped): extraction and scoring of those observations for each project's brand and competitors. Identical questions across tenants are sampled once per day and shared. Observations contain only public AI output and never tenant-private data; questions containing private data are marked tenant-private and are never shared.
- Under BYOK, no org's key is ever spent on another org's demand: the tenant that needs sample k pays for it; reuse is free.
- Budget reservations: reserve estimated cost before each provider call, settle actual cost after (authorize/capture), enforced per org quota, per BYOK key cap and against the global platform budget, safe under concurrent workers.
- Per-provider adaptive concurrency using AIMD (additive increase, multiplicative decrease on 429/timeouts), scoped per provider and credential (platform key or BYOK key), coordinated across workers through Postgres.

### 3. RELIABILITY (durable workflows on Postgres)
- A run is a DAG of steps (discover/fan-out -> sample -> extract -> aggregate -> project read models -> alert -> background agents), persisted in Postgres.
- jobs table: status, priority, org_id, run_after, attempts, max_attempts, lease_owner, lease_expires_at, fencing_token, idempotency_key (unique), last_error. Claim with SELECT ... FOR UPDATE SKIP LOCKED. Long jobs heartbeat to extend leases. Every write produced by a job must present its fencing token; writes with a stale token are rejected (zombie-worker protection).
- Retries with exponential backoff and full jitter; poison jobs move to "dead" with full context.
- Transactional outbox: a step's result and the enqueueing of the next step(s) commit in the same transaction.
- Fair scheduling across tenants: weighted fair queuing by org so large agencies cannot starve small customers; free-tier orgs get a lower weight than BYOK orgs.
- Idempotency key for every provider call: (run_id, question_id, engine, sample_index).
- Partial-failure semantics: if a provider is down or an engine is blocked (no key, quota exhausted), mark that engine's results incomplete/blocked; never record missing data as zero visibility.
- Workers poll with adaptive backoff. LISTEN/NOTIFY is not used because it doesn't work through Neon's transaction pooler, and constant polling would stop Neon from auto-suspending.

### 4. CORRECTNESS (lineage and recomputation)
- Raw observations are immutable. Every derived record stores extractor_version, prompt_template_version and model identifiers.
- Improving an extractor triggers backfill jobs that recompute derived data; read models are rebuilt from source of truth.
- Entity resolution cascade: exact alias match, then pg_trgm trigram similarity, then embedding similarity, then LLM adjudication only for ambiguous cases. Each stage cheaper than the next; thresholds documented and evaluated.
- Evaluation harness in /evals: hand-labeled golden answers; CI computes extraction precision/recall/F1 and blocks regressions; LLM-judge agreement measured against human labels. Agent evals (diagnosis accuracy, citation validity, cost per run) and prompt-injection red-team cases also run in CI.

### 5. DATA, TENANCY AND SECURITY
- Every tenant table has org_id with Postgres Row-Level Security, setting the org per transaction via SET LOCAL (compatible with Neon's transaction pooler), plus application-level checks.
- Observation and result tables use monthly declarative partitioning; daily rollup tables maintained incrementally; dashboards read precomputed read models (CQRS).
- Raw observations older than a retention window are archived to Cloudflare R2 as Parquet and remain queryable with DuckDB for backfills.
- Website auditor is SSRF-hardened: resolve DNS and block private/loopback/link-local/metadata ranges, re-validate on every redirect (DNS rebinding), cap redirects, response size and time; respect robots.txt; identify with an honest user agent. Agents fetch only through this crawler, only for the project's own domains and cited sources.
- **Key vault (BYOK):** envelope encryption, AES-256-GCM with a per-secret data key; data keys wrapped by a master key from `KEY_ENCRYPTION_KEY` with a `key_version` column for rotation. Keys are never returned after saving (show only provider, last 4 characters, created date, last used), never logged, and scrubbed from error messages and Sentry events. They are validated on save with a minimal provider call and support revoke and replace. Engine adapters get credentials only through the credential resolver: org BYOK key, else the platform free-tier key if the org is within free limits, else the run is blocked with a clear message.
- Auth: email+password (argon2id) and Google OAuth; sessions in secure httpOnly cookies on the parent domain; RBAC roles owner, admin, member, client-viewer. MCP uses OAuth with per-org scoped tokens.
- Usage ledger: append-only; records usage against quotas and cost per key and per org; inbound webhooks verified and processed idempotently.
- Public visibility index (later phase): built only from the shared observation layer and only for questions marked public, never from tenant-private data.
- Audit log for security-relevant actions (including key changes, approvals and MCP grants).

### 6. FRONTEND
Next.js App Router. Marketing pages statically rendered and exemplary for crawlers and AI (semantic HTML, JSON-LD, llms.txt, fast), because we sell AI visibility. Dashboard uses a typed API client generated from FastAPI's OpenAPI schema.

### 7. HOSTING AND OPS
Render: backend web service, background worker, cron job, Next.js web service (the official hosted instance). Neon: Postgres, pooled connection for web, direct connection for workers and migrations, a Neon branch per pull request for preview environments. Self-hosting: Docker Compose with the same images (docs/self-hosting.md). Structured JSON logs with request/run/job IDs, per-org and per-key cost and usage metrics, Sentry (with secret scrubbing), SLOs documented.

### 8. TESTING
Deterministic fake provider adapters with seeded randomness; property-based tests (hypothesis) for statistics and scoring; chaos tests that kill workers mid-job and assert no lost or duplicated results; RLS tests proving cross-tenant reads fail; tests proving API keys never appear in responses, logs or error reports; prompt-injection red-team tests.

## ENGINEERING RULES
- Python fully typed, mypy strict, ruff clean, async SQLAlchemy, FastAPI Depends, pydantic for every request/response, tests for every endpoint, job handler, tool and statistical function.
- TypeScript strict, no "any".
- Config only via environment variables, documented in .env.example files. Never commit secrets.
- Build in layers: a simple correct version first, then advanced mechanisms one at a time, each with tests and an ADR.
- Small focused commits, conventional messages.
- A phase is done only when builds, tests and linters pass and you've told me exactly how to run and verify it.

## DOCUMENTATION RULES (mandatory every phase)
- /docs/system-design.md is the living design document; update it each phase. /docs/product-spec.md describes product behavior; /docs/self-hosting.md the self-hosting guide.
- Every significant decision gets an ADR (Context, Decision, Alternatives considered, Consequences). Supersede, never silently change.
- Comment non-obvious code with the WHY. I must be able to defend every line in a system design interview.

## DESIGN RULES (all frontend work)
- Quality bar: the calm precision of the best modern SaaS products. Dense but uncluttered, excellent typography, beautiful accessible charts, consistent spacing.
- Banned: purple/indigo/violet gradients, glowing blobs, emoji as icons, generic three-card feature grids, filler copy ("seamless", "elevate", "unleash", "revolutionize", "effortlessly"), unstyled default component-library looks.
- Design system defined in phase 1b from my references; follow it exactly.

## OPEN SOURCE RULES
- License: AGPL-3.0-or-later, copyright Malik Saad Hayat (LICENSE verbatim, NOTICE for the copyright line).
- Contributions via DCO sign-off (CONTRIBUTING.md); security reports via GitHub private vulnerability reporting (SECURITY.md).
- Never put secrets, real API keys, tenant data or personal data in the repo, fixtures, evals or issues.

## GIT RULES
Author: saadhtiwana <saadhayat799@gmail.com> (local git config). **Never add Co-Authored-By or any AI attribution** (no "Generated with", no co-author trailers) to commits or PRs. `.claude/settings.json` disables Claude's attribution; the rule applies regardless of tooling.

## PHASES
1. scaffold + design docs
1b. brand + design system
2. auth, orgs, RBAC, RLS multi-tenancy, projects
3. workflow engine: jobs, leases, fencing, outbox, fair scheduling, chaos tests
4. engine adapters, credential resolver, observation layer, budgets, AIMD rate control
5. extraction, entity resolution, evals harness
6. statistics: scoring, adaptive sampling, change detection, alerts
7. false facts, website audit, fix plan and generated fixes
8. frontend: marketing site + dashboard
9. reports, BYOK key vault, quotas and usage
10. agents: shared tool registry, internal agent and ask-your-data, background agents, prompt-injection defenses, agent evals
11. MCP server: Streamable HTTP + OAuth, per-org scoped tokens, stdio mode
12. partitioning, rollups, read models, R2 archival, backfills
13. deployment: Render Blueprint, Neon PR branches, GitHub Actions, Docker Compose self-hosting
14. closed loop: publishing approved fixes (GitHub PR first) and impact measurement
15. public visibility index and launch (README, docs site, Show HN)

Only work on the phase I ask for.

## COMMANDS
```sh
cd backend && uv sync && uv run ruff check && uv run ruff format --check && uv run mypy app && uv run pytest
cd backend && uv run --env-file .env uvicorn app.main:app --reload    # http://localhost:8000/healthz
cd web && pnpm install && pnpm lint && pnpm build
cd web && pnpm dev                                                    # http://localhost:3000
```
