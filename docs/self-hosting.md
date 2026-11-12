# Self-hosting Recommendr

> Status: **skeleton (phase 1).** The planned setup is described below. The `docker-compose.yml`,
> images and this guide are completed and tested in the **deployment phase (13)**. Rationale:
> [ADR-0024](adr/0024-self-hosting-with-docker-compose.md).

## What you get

A single-command install of the full stack on any machine with Docker:

| Service | Image / command | Role |
|---|---|---|
| `postgres` | `postgres:17` (with `pg_trgm`, `pgvector`) | Database (data in a named volume) |
| `backend-web` | `recommendr-backend` → `uvicorn app.main:app` | API + MCP (Streamable HTTP) |
| `backend-worker` | `recommendr-backend` → `python -m app.worker` | Runs measurement workflows |
| `backend-scheduler` | `recommendr-backend` → scheduler loop | Enqueues due runs every few minutes |
| `web` | `recommendr-web` → `next start` | Dashboard and marketing pages |

These are the same images the hosted instance runs on Render.

## Self-hosted mode

`DEPLOYMENT_MODE=self_hosted` means:

- **BYOK only:** add your own OpenAI / Gemini / Perplexity / Anthropic keys in the UI. There is
  no platform free-tier key.
- **Quotas disabled** (`QUOTAS_ENABLED=false`); optional per-key monthly caps still work.
- Observation sharing happens **only within your instance**. Nothing is sent to the hosted
  Recommendr.
- The public visibility index is disabled.
- MCP is available over HTTP from the instance, or locally via `stdio`.

## Quick start (planned: "self-host in 5 minutes")

```sh
git clone https://github.com/saadhtiwana/recommendr.git
cd recommendr
cp backend/.env.example .env
# Set at least: KEY_ENCRYPTION_KEY, SESSION_SECRET, DEPLOYMENT_MODE=self_hosted
docker compose up -d
open http://localhost:3000
```

## Planned `docker-compose.yml` (sketch)

```yaml
services:
  postgres:
    image: postgres:17
    environment: { POSTGRES_USER: recommendr, POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}, POSTGRES_DB: recommendr }
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD", "pg_isready", "-U", "recommendr"], interval: 5s }
  migrate:
    image: ghcr.io/saadhtiwana/recommendr-backend:${VERSION:-latest}
    command: alembic upgrade head
    env_file: .env
    depends_on: { postgres: { condition: service_healthy } }
  backend-web:
    image: ghcr.io/saadhtiwana/recommendr-backend:${VERSION:-latest}
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    env_file: .env
    depends_on: { migrate: { condition: service_completed_successfully } }
  backend-worker:
    image: ghcr.io/saadhtiwana/recommendr-backend:${VERSION:-latest}
    command: python -m app.worker
    env_file: .env
    depends_on: { migrate: { condition: service_completed_successfully } }
  backend-scheduler:
    image: ghcr.io/saadhtiwana/recommendr-backend:${VERSION:-latest}
    command: python -m app.scheduler --loop --interval 300
    env_file: .env
    depends_on: { migrate: { condition: service_completed_successfully } }
  web:
    image: ghcr.io/saadhtiwana/recommendr-web:${VERSION:-latest}
    environment: { API_INTERNAL_URL: http://backend-web:8000, NEXT_PUBLIC_API_BASE_URL: http://localhost:8000 }
    ports: ["3000:3000"]
volumes:
  pgdata:
```

## Configuration

_TODO (phase 13):_ full table of environment variables (see `backend/.env.example` and
`web/.env.example`), with notes on what is required in self-hosted mode.

## Security notes

- **Back up `KEY_ENCRYPTION_KEY` separately from the database.** Without it, stored provider
  keys can't be decrypted (by design); with it *and* a DB dump, they can.
- Put a TLS-terminating reverse proxy (Caddy, Traefik, nginx) in front for anything beyond localhost.
- The website auditor's SSRF protection blocks private network ranges, so it can't audit sites
  that are only on your LAN. That's intentional.

## Upgrades and backups

_TODO (phase 13):_ pinning versions, running migrations on upgrade, `pg_dump` backups, and
restoring.

## MCP (stdio)

_TODO (phase 11):_ `docker compose run --rm backend-web python -m app.mcp --stdio` and client
configuration examples.

## Troubleshooting

_TODO (phase 13)._
