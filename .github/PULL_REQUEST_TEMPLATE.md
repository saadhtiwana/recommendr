## What and why

<!-- What does this change, and what problem does it solve? Link the issue: Closes #123 -->

## How it was tested

<!-- Commands you ran, tests added, screenshots for UI changes. -->

## Checklist

- [ ] `uv run ruff check && uv run mypy app && uv run pytest` pass (backend changes)
- [ ] `pnpm lint && pnpm build` pass (web changes)
- [ ] Tests added for new endpoints, job handlers and statistical functions
- [ ] `docs/system-design.md` updated, and an ADR added for any significant decision
- [ ] No secrets, API keys or personal data in code, tests, fixtures or logs
- [ ] Tenant-scoped tables have `org_id` and RLS policies (if adding tables)
- [ ] Commits are signed off (`git commit -s`, see CONTRIBUTING.md)
