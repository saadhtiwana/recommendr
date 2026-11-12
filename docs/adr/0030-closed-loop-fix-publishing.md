# ADR-0030: Closed-loop fix publishing with human approval

- Status: Accepted (later phase)
- Date: 2026-11-12

## Context

Recommendr generates fixes (FAQ content, JSON-LD, llms.txt, page drafts, robots.txt rules). Today
the user copies them by hand, and many never do, so measured visibility never improves. Closing the
loop means (1) **publishing approved fixes** into the user's site and (2) **measuring their
impact** with the same statistics we use everywhere. Publishing changes a customer's production
website, the highest-risk side effect in the system, and fix content may be derived from untrusted
inputs (ADR-0028).

## Decision

- Recommendr acts as an **MCP client / integration layer** for publishing targets, behind the
  `publish_fix` tool (side-effect class `publish`, ADR-0026).
- **GitHub pull requests first:** a GitHub App with least privilege (contents + pull requests on
  **one selected repository**), which opens a PR to the user's site repo containing the fix (e.g.
  `public/llms.txt`, a JSON-LD block, a new FAQ page). The user's normal review and CI apply; we
  never push to the default branch.
- **WordPress and Webflow later**, via their APIs, creating **drafts** where the platform supports
  it.
- **Nothing is published without explicit approval of the exact diff** (rendered in the UI),
  audit-logged with the approver. Approvals are per action and never blanket. Tainted agent runs
  and background agents can't trigger publishing (ADR-0027/0028).
- **Impact measurement:** for the questions a fix targets, compare visibility before and after
  with the **same** two-proportion tests and Benjamini-Hochberg control (ADR-0009), annotate model
  changes, require complete data, and report effect size with its interval. The report states the
  caveat: this shows **association, not proven causation** (models, competitors and the web
  change at the same time). A holdout of untargeted questions is reported as a comparison.
- Rollback: the PR can be reverted by the user; for CMS targets we keep the previous version
  and offer a one-click revert (also approval-gated).

## Alternatives considered

- **Auto-publish fixes:** maximum convenience, unacceptable risk (bad content, injected content,
  wrong facts on a live site). Rejected.
- **No publishing (copy-paste only):** safest, but most fixes never get applied and the loop
  never closes.
- **Direct commits to the default branch:** skips the user's review and CI. Rejected; PRs only.
- **Broad GitHub OAuth scopes (`repo`):** far more access than needed. Rejected in favor of a
  GitHub App scoped to one repository.

## Consequences

- \+ Fixes actually ship, and the product can show measured (if associative) impact.
- \+ PR-based publishing reuses the user's existing review process.
- − Integrations add maintenance (GitHub, WordPress, Webflow APIs) and new credentials to protect
  (stored in the key vault, ADR-0022).
- − Impact claims need careful wording and statistics to stay honest.
- − Many small businesses don't use Git; CMS integrations are needed to reach them.

## Related

- [ADR-0009](0009-change-detection-with-benjamini-hochberg.md), [ADR-0022](0022-byok-envelope-encryption.md), [ADR-0026](0026-shared-tool-registry.md), [ADR-0027](0027-agent-safety.md), [ADR-0028](0028-prompt-injection-defenses.md)
- system-design §14.6
