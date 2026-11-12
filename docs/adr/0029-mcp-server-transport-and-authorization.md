# ADR-0029: MCP server transport and authorization

- Status: Accepted
- Date: 2026-11-12

## Context

Users increasingly work inside AI assistants and IDEs. An MCP (Model Context Protocol) server
lets them ask "how is my AI visibility trending?" from Claude or another MCP client, using the
same tools as our internal agent (ADR-0026). It is also a new external attack surface: it
exposes tenant data and can start spend actions, so it needs strong authorization, scoping,
rate limiting and auditing. Self-hosters need a version that works without hosted OAuth.

## Decision

- **Hosted transport: Streamable HTTP** at `/mcp` on the existing API service (no new process
  type). Exposes the shared tools (ADR-0026) and read-only **resources**:
  `recommendr://projects/{id}/summary`, `recommendr://projects/{id}/reports/{week}`.
- **Authorization: OAuth 2.1 per the MCP authorization spec**: protected resource metadata
  (`/.well-known/oauth-protected-resource`), authorization server metadata, authorization code +
  **PKCE**, dynamic client registration. On consent the user picks **one org** and the
  **scopes** (`projects:read`, `fixes:generate`, `checks:start`).
- **Tokens:** per org, scoped, short-lived access tokens with refresh tokens, stored **hashed**,
  bound to the client and user, listed and **revocable** in the UI (security settings). RBAC still
  applies: a client-viewer can't grant scopes beyond read.
- **Spend tools require confirmation:** `start_check` first returns an estimated cost and runs
  only after confirmation, through MCP **elicitation** when the client supports it, otherwise
  through an approval in the Recommendr UI (the tool returns a pending status and approval link).
  `publish` tools aren't exposed over MCP until the closed-loop phase, and then only with approval.
- **Rate limits** per token and per org; budgets are the same as the internal agent's
  (reservations, ADR-0010).
- **Audit:** every MCP call (client, user, org, tool, arguments digest, result status, cost) is
  audit-logged; token grants and revocations too.
- Tool outputs that contain untrusted content keep the data-block wrapping (ADR-0028), so external
  agents get the same signal about what is data.
- **Self-host: stdio mode** (`recommendr-mcp --stdio`), run locally against the instance with a
  locally created org-scoped token, for desktop MCP clients. No OAuth server needed.

## Alternatives considered

- **Static API keys for MCP clients:** simple and widely supported, but long-lived bearer secrets
  get pasted into config files and leak; no standard consent flow or scoping UX. Possibly offered
  later for headless/CI use, with scopes and expiry. Rejected as the primary method.
- **SSE transport (older HTTP+SSE MCP transport):** superseded by Streamable HTTP in the spec;
  needs long-lived connections. Rejected.
- **Separate MCP microservice:** an extra deployment with duplicated auth; the modular monolith
  hosts it as another router (ADR-0001).
- **Read-only MCP (no spend tools at all):** safest, but users want "run a check now" from their
  assistant; confirmation plus budgets make it acceptable.

## Consequences

- \+ Standards-based auth that MCP clients support, with per-org least-privilege tokens.
- \+ Same tools, permissions, budgets and audit as the internal agent.
- \+ Self-hosters get MCP without running an OAuth server.
- − Implementing an OAuth authorization server (or integrating one) is real work and
  security-sensitive; it needs dedicated tests.
- − The MCP spec is still evolving; transport and auth details may need superseding ADRs.
- − Client support for elicitation varies, so the UI approval fallback is required.

## Related

- [ADR-0010](0010-budget-reservations.md), [ADR-0026](0026-shared-tool-registry.md), [ADR-0027](0027-agent-safety.md), [ADR-0028](0028-prompt-injection-defenses.md)
- system-design §14.5
