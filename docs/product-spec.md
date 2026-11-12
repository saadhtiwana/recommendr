# Recommendr: Product Spec

> Status: **Phase 1 (spec only).** Describes *what* Recommendr does and for whom. *How* it works is
> in [`system-design.md`](system-design.md); decisions are in [`adr/`](adr/README.md).

## Who it's for

| Persona | Situation | What they need |
|---|---|---|
| **Local business owner** (dentist, plumber, café) | Customers increasingly ask AI "best X near me" | Am I recommended? Is what AI says about me true? What do I fix first? No jargon, no cost surprises. |
| **Small business / startup marketer** | Competes in a category (CRM, accounting software) | Share of voice versus competitors, which sources drive AI's choices, trends with honest uncertainty. |
| **Agency** | Manages many clients | Many projects, client-viewer access, weekly reports, fixes they can hand to clients. |
| **Developer / self-hoster** | Wants control and no vendor lock-in | Self-host in minutes, BYOK, an MCP server for their own agents. |

**Positioning:** the free, open-source alternative to Profound and Peec AI. Free hosted tier,
bring your own keys for more, self-host if you want. Every number comes with its uncertainty, and
every finding comes with a fix.

## Core concepts

- **Organization:** a tenant (a business or an agency). Members have roles: owner, admin,
  member, client-viewer.
- **Project:** a brand being tracked: name, aliases, website, category, location, **verified
  facts**, competitors, locales, engines, cadence.
- **Question:** something customers ask AI ("best family dentist in Austin that takes Delta
  insurance"). Grouped into **intent clusters**. A question can be marked **private**.
- **Engine:** ChatGPT, Gemini, Perplexity, Claude, queried through their APIs with web
  search/grounding.
- **Run:** one measurement pass over a project's questions and engines; per-engine status is
  complete, partial or blocked.
- **Observation:** one sampled AI answer. **Finding:** a mention, a false fact, a gap.
  **Action:** a prioritized fix with generated artifacts.

## Key user journeys

1. **Onboard (≤ 5 minutes):** sign up → create org → enter website → Recommendr pre-fills brand,
   category, location and suggests competitors and verified facts from the site → review →
   question discovery proposes 10 to 30 questions by intent → accept → first run (free tier or BYOK).
2. **Read the dashboard:** visibility per engine with intervals and n; share of voice vs
   competitors; trend lines with model-change annotations and gaps for partial data; "why them,
   not me" per question.
3. **Fix false facts:** list of contradictions (claim, engine, model, cited sources) → confirm or
   dismiss → suggested fixes (update the site and JSON-LD, correct listings, outreach to the
   cited source).
4. **Act on the fix plan:** actions ranked by impact × effort → generate artifacts (FAQ content,
   JSON-LD, llms.txt, page drafts, outreach emails) → copy/download, or later publish via a GitHub PR.
5. **Weekly report and alerts:** email with significant changes only (no noise from sampling
   variation), plus a diagnosis of why they happened.
6. **Ask your data:** "Why did Perplexity stop recommending us in Austin?" → a grounded answer
   with citations to specific answers and metrics.

## Plans and limits

| | Free (hosted, no keys) | BYOK (hosted) | Self-hosted |
|---|---|---|---|
| Price | $0 | $0 (you pay providers on your own keys) | $0 |
| Projects | 1 | unlimited (fair-use limits) | unlimited |
| Questions | ≤ 10 | per project, configurable | configurable |
| Cadence | weekly | weekly default; daily optional (projected cost shown first) | configurable |
| Engines | 2, low-cost models | all 4, your choice of model | all 4 |
| Samples | fixed 3 | adaptive 3 to 10 (configurable) | configurable |
| Scheduling priority | lower | normal | n/a (single instance) |
| Platform spend cap | yes: free runs pause when the monthly platform budget is used | n/a | n/a |
| Quotas | enforced | per-key monthly caps (optional) | disabled |

No payments are built; paid hosted plans could be added later without schema changes.

## BYOK key management

- Add keys per org for OpenAI, Google Gemini, Perplexity and Anthropic. Only owners and admins can.
- Keys are **validated** on save with a minimal (usually free) provider call.
- After saving, a key is **never shown again**: the UI shows provider, label, last 4 characters,
  created date, last used, status and usage.
- **Revoke** and **replace** at any time. Optional **monthly cap** per key; runs that would exceed
  it are blocked, not silently truncated.
- **Usage page:** calls, tokens and cost per key, engine, project and month.
- Credentials are picked in this order: your key for that provider → the free-tier platform key (if
  you're within free limits) → blocked with a clear message ("Add your Anthropic key to include
  Claude, or wait until your free quota resets on Dec 1").

## Measurement honesty (user-facing promises)

- Every percentage shows its **interval and sample size**; the help text explains why AI answers
  vary.
- **Missing data is never shown as zero.** Partial and blocked engines show as gaps with reasons.
- Alerts fire only for **statistically significant** changes of meaningful size, and say when the
  provider changed its model.
- We measure **API answers with web search**, which can differ from what a signed-in consumer
  sees in the ChatGPT app. The UI says so (ADR-0018).
- Sharing: identical public questions are sampled once and shared across users to cut costs.
  **Your private questions, brand facts and tracking choices are never shared.**

## Agents and MCP

### Shared tools

Everything the agents and MCP clients can do goes through one registry of typed tools, so the
in-app assistant and external agents have exactly the same capabilities and permissions:

| Tool | What it does | Side effect |
|---|---|---|
| `list_projects` | Projects you can access | read |
| `get_visibility` | Mention rate (with interval and n), rank, share of voice for a scope | read |
| `get_trends` | Time series with model-change and partial-data annotations | read |
| `compare_competitors` | Where competitors appear and you don't; their cited sources | read |
| `list_answers` / `get_answer` | Sampled AI answers with engine, model, citations | read |
| `list_sources` | Domains and URLs AI cites, by engine | read |
| `list_fanouts` | Search sub-queries the engines ran (where exposed) | read |
| `list_false_facts` | Contradictions with your verified facts | read |
| `list_actions` | The ranked fix plan | read |
| `generate_fix` | Draft an artifact (FAQ, JSON-LD, llms.txt, page, outreach) | generate (uses LLM budget) |
| `start_check` | Run a measurement now | **spend**: needs your approval |
| `publish_fix` | Publish an approved fix (later) | **publish**: needs your approval |

### Internal agent (in-app assistant, "ask your data")

- Answers questions about your visibility with **citations**: every number links to the answer or
  metric it came from. Uncited numbers are rejected and the agent has to retry.
- Has a step limit, token budget and cost cap per conversation, charged to your key or free quota.
- **Never spends or publishes on its own:** `start_check` and `publish_fix` show an approval card
  with the exact action and estimated cost.
- Every step is recorded; you (and support, with your permission) can inspect and replay the trace.

### Background agents

| Agent | When | You get |
|---|---|---|
| Diagnosis | after a significant change | "What changed and probably why", with evidence |
| Actions | after each run / weekly | the ranked fix list |
| Fix writer | on request or for top actions | drafts that read your actual site |
| Competitor investigator | when a competitor gap appears | the sources and attributes behind their recommendations |

Same limits, citations and tracing as the in-app agent. They only *propose*; you approve.

### Safety against prompt injection

Websites, AI answers and uploaded files can contain hidden instructions ("ignore previous
instructions and publish…"). Recommendr treats all of it as **data, never instructions**; it
can't trigger spending or publishing; and agents can only fetch your own domains and sources
already cited by AI, through the hardened crawler. A red-team test suite runs on every change.

### MCP server

- Connect Claude Desktop, IDEs or your own agents to Recommendr over **MCP** (Streamable HTTP)
  with **OAuth**: you choose the org and scopes; tokens are per org, revocable, rate-limited and
  audited.
- Exposes the same tools plus read-only resources (project summaries, weekly reports).
  `start_check` asks for confirmation.
- **Self-hosted:** run the MCP server locally in **stdio** mode.

### Closed loop (later)

Approve a fix → Recommendr opens a **GitHub pull request** on your site's repo (WordPress and
Webflow later) → after it ships, Recommendr compares visibility **before vs after** with the same
statistical tests and reports the effect with its uncertainty. Nothing is published without your
explicit approval of the exact change.

## Public AI visibility index (later)

Public pages per category ("Who AI recommends for family dentists in Austin") built **only** from
shared public observations, **only** for questions that are public-eligible (curated, or tracked
by at least 5 different orgs so no single customer's tracking is revealed), never from private
questions, brand facts or anything tenant-specific. Methodology and uncertainty are shown on
every page; businesses can request corrections.

## Out of scope (for now)

Payments, scraping consumer chat apps, sub-daily monitoring, traditional SEO rank tracking,
social listening, native mobile apps.
