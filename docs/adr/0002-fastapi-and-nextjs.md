# ADR-0002: FastAPI backend + Next.js frontend

- Status: Accepted
- Date: 2026-11-12

## Context

The backend is dominated by I/O-bound work (provider calls of ~12 s with web search, DB writes),
numeric code (Wilson intervals, two-proportion tests, Benjamini-Hochberg, bootstrap), and
LLM-adjacent code (structured-output extraction, agents, MCP). The frontend has two very
different halves: **marketing pages** that must themselves be exemplary for crawlers and AI
assistants (we sell AI visibility, so our own site is the demo), and an **authenticated
dashboard** with dense charts and tables.

## Decision

**Backend: FastAPI on Python 3.12, managed with uv.**

- asyncio for high-concurrency provider I/O inside a single worker process (64 concurrent calls
  per worker, system-design §4).
- pydantic v2 for every request/response and every tool schema (ADR-0026). The OpenAPI schema is
  the contract the frontend's typed client is generated from.
- numpy/scipy for statistics, hypothesis for property-based tests of them.
- SQLAlchemy 2 (async) + asyncpg, Alembic migrations; structlog JSON logs; argon2-cffi; PyJWT.
- mypy strict and ruff are CI gates.

**Frontend: Next.js App Router, TypeScript strict, Tailwind, pnpm.**

- Marketing pages are **statically rendered** (SSG), with semantic HTML, JSON-LD, `llms.txt`,
  and fast LCP. The future public visibility index (ADR-0025) is also static.
- Dashboard: client and server components consuming a **typed API client generated from
  FastAPI's OpenAPI** schema (e.g. openapi-typescript), so API drift is a compile error.
- No `any` (ESLint rule).

## Alternatives considered

- **Django + DRF:** mature admin and auth, but sync-first ORM and request handling, a weaker
  async story for long provider calls, and weaker typing than pydantic + mypy strict.
- **Node/TypeScript backend (NestJS/Fastify):** one language end to end, but the statistics stack
  (scipy, numpy) and the LLM/eval ecosystem are stronger in Python, and the statistics are a core
  differentiator.
- **Go backend:** excellent concurrency, but less productive for numeric work and structured LLM
  output, and its typing is no stronger for our purposes than pydantic.
- **SPA (Vite + React) instead of Next.js:** simpler deployment, but client-rendered marketing
  pages are worse for crawlers and AI assistants, which would undercut the product's own message.
- **Next.js API routes as the backend:** would split business logic across two runtimes.

## Consequences

- \+ Best-in-class libraries for statistics, LLM integration and evals.
- \+ OpenAPI-generated client gives end-to-end type safety without a shared language.
- \+ Static marketing pages are fast and crawlable, which shows the product working.
- − Two runtimes and two toolchains (uv and pnpm), two CI jobs.
- − Python CPU-bound work blocks the event loop: heavy statistics or Parquet work runs in worker
  jobs (with `asyncio.to_thread` / process pools where needed), never in request handlers.

## Related

- ADR-0001 (monolith), ADR-0019 (hosting), ADR-0026 (tool schemas from pydantic)
- system-design §6 (API), §8a-c (statistics)
