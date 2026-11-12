# ADR-0027: Agent safety: budgets, approvals, grounding and tracing

- Status: Accepted
- Date: 2026-11-12

## Context

Agents (ask-your-data chat and background agents) call LLMs in loops and invoke tools. Four
failure classes matter for a product whose promise is **honest numbers**:

1. **Runaway cost:** loops that never converge spend the user's BYOK money or the platform's
   free-tier budget.
2. **Unwanted side effects:** an agent starting expensive runs or publishing changes without the
   user asking.
3. **Hallucinated numbers:** "your visibility dropped 34% on Perplexity" when no tool said so.
4. **Undebuggable behavior:** without traces we can't explain an answer, fix a bug, or evaluate
   changes.

## Decision

- **Limits per agent run:** max steps (default 12), token budget, and a **cost cap**. Cost is
  **reserved before each model call and captured after**, through the existing reservation system
  (ADR-0010) against the org's BYOK key or free-tier quota and the platform budget, so agents
  can't exceed what the org allows even under concurrency. Hitting a limit ends the run with a
  partial answer and an explicit note.
- **Grounding:** final answers are structured as claims with `citations`
  (`answer_id`, `metric_id`, `source_id`) from tool results in the same run. A validator
  **rejects numeric claims without citations**, or whose cited value doesn't match the tool output
  (rounding tolerance), and retries with feedback (max 2). If validation still fails, uncited
  claims are removed and a note is shown. Citations render as links to the underlying answer or
  metric.
- **Approvals:** tools with `spend` or `publish` side effects (ADR-0026) **never execute
  directly**. The loop pauses, writes an `approvals` row, and the UI shows the exact action,
  arguments and estimated cost; execution resumes only on an explicit user decision (audit-logged).
  Background agents can't request spend/publish at all; they only propose actions.
- **Tracing:** every step (model call with prompt and response, tool call with inputs and
  outputs, cost, validation result, approval) is stored in `agent_steps` (tenant data, RLS,
  partitioned monthly, scrubbed of secrets). Runs are **replayable** with recorded tool outputs,
  for debugging and for agent evals.
- **Background agents** (diagnosis, actions, fix writer, competitor investigator) run as
  workflow jobs (leases, fencing, outbox, fair scheduling) with the **same** limits, grounding and
  tracing.
- **Agent evals** in CI (`/evals/agents`): scripted scenarios with fake providers and known
  correct diagnoses measure diagnosis accuracy, citation validity and cost per run; regressions
  block merges.

## Alternatives considered

- **Free-running agent with only a max-steps limit:** doesn't bound cost (one step can be
  expensive) and allows side effects. Rejected.
- **Trust the model's own citations without validation:** models invent plausible IDs and numbers.
  Rejected.
- **Approval for every tool call:** safe but unusable for read-only exploration. Side-effect
  classes target approval where it matters.
- **Log only final answers:** cheaper storage, but impossible to debug or evaluate. Rejected;
  traces are partitioned and retained like other tenant data.
- **Agent frameworks (LangChain, etc.) as the core loop:** they hide the control flow we need to
  own (reservations, approvals, validation, tracing). A small explicit loop is easier to defend.

## Consequences

- \+ Bounded cost per agent run, enforced by the same machinery as sampling.
- \+ Numbers in agent answers are traceable to data, consistent with the product's honesty
  positioning.
- \+ Replayable traces make bugs and regressions diagnosable.
- − Validation and retries add latency and some cost.
- − Approval steps add friction for spend actions (intended).
- − Trace storage grows with usage (partitioning and retention apply).

## Related

- [ADR-0010](0010-budget-reservations.md), [ADR-0026](0026-shared-tool-registry.md), [ADR-0028](0028-prompt-injection-defenses.md)
- system-design §14.2, §14.3, §14.7
