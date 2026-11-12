# ADR-0024: Self-hosting via Docker Compose

- Status: Accepted
- Date: 2026-11-12

## Context

An open-source alternative is only credible if people can actually run it. Our target
self-hosters are agencies, consultants and developers with a single VPS or a laptop, not
Kubernetes operators. The hosted architecture is already a modular monolith with three process
types on Postgres (ADR-0001, ADR-0003), with no Redis, no broker and no other stateful service,
so a small self-hosting footprint is achievable.

## Decision

- Ship a **`docker-compose.yml`** with five services:
  `postgres` (16+, with `pg_trgm` and `pgvector`), `backend-web` (uvicorn), `backend-worker`,
  `backend-scheduler` (a loop container that runs the scheduler every N minutes, replacing
  Render's cron), and `web` (Next.js). Named volume for Postgres data. A one-shot `migrate`
  service runs `alembic upgrade head` before the backend starts.
- **Same images** as the hosted deployment on Render (built in CI and published to GHCR), so
  self-hosters run exactly what we test.
- `DEPLOYMENT_MODE=self_hosted` changes behavior:
  - **BYOK only:** the credential resolver has no platform-key step (ADR-0022);
  - **quotas disabled** (plan entitlements not enforced); optional per-key monthly caps still work;
  - **no platform spend cap**, no free tier (ADR-0023);
  - shared observation reuse happens **only within the instance** (no cross-instance sharing);
  - the **public index is disabled** (ADR-0025);
  - Sentry and external telemetry **off by default** (opt-in).
- Required config is minimal: `KEY_ENCRYPTION_KEY`, `SESSION_SECRET`, `PUBLIC_URL`, and the
  Postgres password; everything else has defaults. `docs/self-hosting.md` covers setup, backups
  (`pg_dump` + **KEK backup**), upgrades (pull, migrate, restart) and a reverse proxy example.
- Target: **"self-host in 5 minutes"**: `git clone`, `cp .env.example .env`, generate keys,
  `docker compose up -d`.
- The full file and guide are written in the deployment phase; phase 1 records the plan and a
  skeleton guide.

## Alternatives considered

- **Helm chart / Kubernetes manifests:** right for larger organizations, overkill for the target
  self-hoster. It may come later as a community contribution; Compose stays the reference.
- **Single binary / single container (all processes in one with a supervisor):** simplest to
  start, but it hides process boundaries, complicates logs and scaling workers, and diverges from
  the hosted topology. Rejected.
- **Render-only ("deploy to Render" button):** easy, but ties self-hosting to one vendor and
  isn't truly self-hosted. We may still offer the button as an option.
- **SQLite for self-hosting:** fewer moving parts, but RLS, `SKIP LOCKED`, partitioning,
  `pg_trgm` and pgvector are core to the design. Rejected.

## Consequences

- \+ One command to run the whole product on any machine with Docker.
- \+ No hosted dependencies: keys never leave the self-hoster's infrastructure.
- \+ Same images, so hosted CI coverage protects self-hosters too.
- − `DEPLOYMENT_MODE` branches must be tested (CI runs the Compose stack in self-hosted mode).
- − Self-hosters own backups, upgrades and **KEK custody**: losing the KEK makes stored keys
  unrecoverable. The docs must stress this.
- − Within-instance sharing gives small instances little cost saving.
- − Supporting user-run infrastructure brings support load; GitHub Discussions and clear
  troubleshooting docs are the mitigation.

## Related

- [`docs/self-hosting.md`](../self-hosting.md)
- [ADR-0019](0019-render-and-neon-hosting.md) hosted deployment; [ADR-0022](0022-byok-envelope-encryption.md); [ADR-0023](0023-free-tier-with-platform-spend-cap.md); [ADR-0025](0025-public-visibility-index.md)
- system-design §8n
