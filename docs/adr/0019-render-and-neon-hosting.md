# ADR-0019: Render + Neon hosting for the official hosted instance

- Status: Accepted
- Date: 2026-11-12
- Revision history: 2026-11-12: revised before first publication for the open-source/BYOK/self-hosting model (ADR-0021..0024).

## Context

Recommendr is open source (ADR-0021). There will be one **official hosted instance**: free to
use with BYOK (ADR-0022) or a small capped free tier (ADR-0023), and anyone can self-host
(ADR-0024). The hosted instance has to be cheap to run, simple for a very small team to operate,
and built from **the same images** self-hosters run, so the two can't drift apart.

Process needs: an API web service, background workers, a scheduler (cron), and a Next.js web app.
Data: Postgres is the only datastore (ADR-0003), with a pooler for the API, direct connections
for workers and migrations, and isolated databases for preview environments.

## Decision

**Render** for compute, **Neon** for Postgres.

| Render service | Type | Command |
|---|---|---|
| `recommendr-api` | Web service | `uvicorn app.main:app` |
| `recommendr-worker` | Background worker (scaled 1..N) | `python -m app.worker` |
| `recommendr-scheduler` | Cron job (every 5 min) | `python -m app.scheduler` |
| `recommendr-web` | Web service (Next.js) | `pnpm start` |

- Backend services run the **same Docker image** used by self-hosting's Docker Compose
  (ADR-0024), with a different command per process type; `DEPLOYMENT_MODE=hosted`.
- **Neon:** the API uses the **pooled** connection string (transaction pooling, RLS context via
  `set_config(..., true)`, ADR-0014); workers, scheduler and Alembic migrations use the **direct**
  connection string. A **Neon branch per pull request** gives each preview environment its own
  copy-on-write database, created and deleted by GitHub Actions (phase 13).
- **Secrets** as Render secret environment variables (never in `render.yaml`):
  `KEY_ENCRYPTION_KEY` (+ `KEY_ENCRYPTION_KEYS_PREVIOUS` during rotation, ADR-0022), the
  **platform free-tier provider keys** and `PLATFORM_MONTHLY_BUDGET_USD` (ADR-0023), the session
  secret, OAuth client secrets, the R2 credentials, and the Sentry DSN.
- The infrastructure is declared in `render.yaml` (Blueprint), completed in phase 13.

## Alternatives considered

- **AWS (ECS/Fargate + RDS):** maximum control, but much more ops work, cost and IAM surface for
  a small team.
- **Fly.io:** good for global deployment, which we don't need (batch workloads; single region is fine).
- **Vercel for Next.js + something else for the backend:** splits deployment between two vendors;
  Render runs Next.js and the Python processes in one place.
- **Supabase:** Postgres plus extras we don't use; Neon's branching per PR and auto-suspend fit
  preview environments better.
- **Kubernetes:** unnecessary at this scale. Self-hosters get Docker Compose instead (ADR-0024).

## Consequences

- \+ Hosted and self-hosted run the same images, so self-hosting is exercised in production.
- \+ Per-PR Neon branches give realistic previews and migration tests on copies of the schema.
- \+ Neon auto-suspend keeps preview and quiet environments almost free, which is why workers
  poll adaptively instead of constantly (ADR-0003).
- − Neon cold starts (~0.5 to 3 s) after suspend. Handled with connect timeouts and retries.
- − PgBouncer transaction pooling rules out session features (prepared statement cache,
  LISTEN/NOTIFY, session SET) on the API's connections (ADR-0003, ADR-0014).
- − Vendor coupling. Mitigated by plain Docker images and stock Postgres; migrating to any
  container host + Postgres is mechanical.
- − The platform key and KEK live in Render's env. A compromise of the Render account exposes
  them. Mitigated by least-privilege team access, 2FA and KEK rotation (ADR-0022).

## Related

- [ADR-0003](0003-postgres-as-job-queue-and-workflow-store.md), [ADR-0014](0014-row-level-security-with-set-local.md),
  [ADR-0021](0021-open-source-under-agpl.md), [ADR-0022](0022-byok-envelope-encryption.md),
  [ADR-0023](0023-free-tier-with-platform-spend-cap.md), [ADR-0024](0024-self-hosting-with-docker-compose.md)
