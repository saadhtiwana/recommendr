# ADR-0026: Shared tool registry for the internal agent and the MCP server

- Status: Accepted
- Date: 2026-11-12

## Context

Two consumers need programmatic, LLM-friendly access to a project's data and actions:

1. the **internal agent** (ask-your-data chat and background agents: diagnosis, actions, fix
   writer, competitor investigator);
2. the **MCP server**, which exposes Recommendr to external assistants (Claude, IDEs, other
   agents).

If each had its own tool implementations, they would drift: different permission checks,
different output shapes, and a security fix applied to one but not the other. Tools also carry
very different risk: reading metrics is harmless; starting a sampling run spends money;
publishing a fix changes a customer's website.

## Decision

One **registry of typed tools** in the backend, used by both consumers:

- Each tool declares **name**, **description** (written for LLMs), **pydantic input and output
  models** (exported as JSON Schema for LLM tool definitions and MCP `tools/list`), **required
  scope** (e.g. `projects:read`, `fixes:generate`, `checks:start`, `fixes:publish`) and a
  **side-effect class**:
  - `read`: no side effects;
  - `generate`: costs LLM tokens, creates drafts, changes nothing external;
  - `spend`: starts provider spend (reserved through ADR-0010), **requires approval**;
  - `publish`: changes something outside Recommendr, **requires approval** (later phase).
- Initial tools:

| Tool | Class |
|---|---|
| `list_projects`, `get_visibility`, `get_trends`, `compare_competitors`, `list_answers`, `get_answer`, `list_sources`, `list_fanouts`, `list_false_facts`, `list_actions` | read |
| `generate_fix` | generate |
| `start_check` | spend |
| `publish_fix` (later) | publish |

- Tools are thin adapters over **module service interfaces** (ADR-0001); they never query
  tables directly. They receive a `ToolContext` with `org_id` (RLS context, ADR-0014), user,
  granted scopes, `agent_run_id` (tracing and budget) and the **taint** flag (ADR-0028).
- A single invocation pipeline: authorize (scope + RBAC) → rate limit → approval gate for
  `spend`/`publish` → execute → audit log + trace step → output validation.
- Outputs return **stable IDs** (`answer_id`, `metric_id`, `source_id`) so agent claims can cite
  them (ADR-0027).

## Alternatives considered

- **Separate tool sets for agent and MCP:** more freedom per consumer, but duplicated
  authorization and drift. Rejected.
- **Expose the REST API directly as tools (OpenAPI → tools):** quick, but REST endpoints are
  shaped for UIs (pagination, large payloads), not LLMs, and have no side-effect classification
  or approval semantics.
- **Free-form text-to-SQL for ask-your-data:** maximally flexible, but a security and correctness
  hazard (RLS is a backstop, not a license), hard to cite, hard to evaluate. Rejected.
- **Untyped (dict-in, dict-out) tools:** simpler to write, but no schema for LLMs or MCP clients,
  and no validation. Rejected.

## Consequences

- \+ One implementation, one permission model and one audit trail for both internal and external
  agents.
- \+ The side-effect class makes approval and injection rules (ADR-0027/0028) mechanical, not
  per-tool judgment.
- \+ Typed schemas give good LLM tool definitions and MCP compatibility for free.
- − Tool design must serve two audiences; descriptions and payload sizes need tuning (evals help).
- − Adding a tool means classifying its side effects correctly; review checklist item.

## Related

- [ADR-0027](0027-agent-safety.md), [ADR-0028](0028-prompt-injection-defenses.md), [ADR-0029](0029-mcp-server-transport-and-authorization.md), [ADR-0030](0030-closed-loop-fix-publishing.md)
- system-design §14.1
