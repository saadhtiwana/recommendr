# Contributing to Recommendr

Thanks for your interest! Recommendr is an open-source (AGPL-3.0) AI search visibility tool.
Bug reports, docs fixes, evals data, provider adapters and features are all welcome.

## Before you start

- **Bugs:** open an issue using the bug template. **Security issues:** follow [SECURITY.md](SECURITY.md), never a public issue.
- **Features or significant changes:** open an issue or discussion first. Significant decisions
  need an ADR in [`docs/adr/`](docs/adr/), so it helps to agree on direction before you write code.
- Read [`docs/system-design.md`](docs/system-design.md). It explains why things are built the way they are.

## Development setup

Requirements: Python 3.12 with [uv](https://docs.astral.sh/uv/), Node.js 20+ with pnpm, and
Postgres 16+ (local or a free Neon branch).

```sh
# backend
cd backend
cp .env.example .env            # fill in values
uv sync
uv run ruff check && uv run ruff format --check && uv run mypy app && uv run pytest
uv run --env-file .env uvicorn app.main:app --reload

# web
cd web
cp .env.example .env.local
pnpm install
pnpm dev
```

## Engineering rules

These are enforced in review and CI:

- **Python:** fully typed, `mypy --strict` clean, `ruff` clean, async SQLAlchemy, FastAPI `Depends`,
  pydantic models for every request and response.
- **TypeScript:** strict mode, no `any`.
- **Tests:** every endpoint, job handler and statistical function has tests. Statistics and
  scoring use property-based tests (hypothesis). Provider calls in tests use the deterministic
  fake adapters, never real APIs.
- **Tenancy:** every tenant-scoped table has `org_id` and a Row-Level Security policy, and has a
  test proving cross-tenant reads fail.
- **Secrets:** never commit secrets, never log API keys, never put real keys in fixtures.
  Config comes from environment variables only, documented in `.env.example` files.
- **Comments** explain *why*, not *what*.
- **Frontend design:** calm, dense but uncluttered, excellent typography, accessible charts,
  consistent spacing. No purple/indigo/violet gradients, glowing blobs, emoji as icons, generic
  three-card feature grids, filler copy, or unstyled default component-library looks.
- **Docs:** update `docs/system-design.md` when behavior changes; add an ADR for significant
  decisions; supersede ADRs, never silently edit a decision.

## Commits and pull requests

- Small, focused commits with [Conventional Commits](https://www.conventionalcommits.org/)
  messages: `feat(scoring): add Wilson interval`, `fix(workflow): reject stale fencing token`.
- **Sign off your commits** (`git commit -s`) to certify the
  [Developer Certificate of Origin](https://developercertificate.org/): you wrote the change or
  have the right to submit it under the project's license.
- Contributions are licensed under **AGPL-3.0-or-later** (inbound = outbound).
- Fill in the PR template. CI must be green: builds, tests, linters and the extraction evals
  regression gate.

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
