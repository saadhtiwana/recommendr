# backend

One FastAPI codebase, three Render process types:

| Process   | Entrypoint                              | Role |
|-----------|-----------------------------------------|------|
| web       | `uvicorn app.main:app`                  | HTTP API |
| worker    | `python -m app.worker`                  | Durable workflow/job execution (phase 3) |
| scheduler | `python -m app.scheduler`               | Cron: enqueues due runs (phase 3) |

Modules live in `app/<module>/`, each with a README. Modules talk through service interfaces, never each other's tables.

```sh
uv sync
uv run ruff check && uv run ruff format --check && uv run mypy app && uv run pytest
uv run --env-file .env uvicorn app.main:app --reload    # GET http://localhost:8000/healthz
```

Configuration: environment variables only, documented in [.env.example](.env.example).
