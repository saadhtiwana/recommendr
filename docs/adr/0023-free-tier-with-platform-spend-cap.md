# ADR-0023: Free tier with a global platform spend cap

- Status: Accepted
- Date: 2026-11-12

## Context

BYOK (ADR-0022) makes Recommendr free to run, but asking a small business owner to create
OpenAI and Anthropic accounts before they've seen any value is a big funnel drop. A small
**keyless free tier** lets people see their AI visibility first. Free capacity is paid by the
platform (us), so it needs a hard ceiling that can't be exceeded by concurrency, abuse or
success.

Cost math (system-design §4): a free project costs about 10 questions × 2 engines × 4.33 weeks ×
3 samples × $0.006 ≈ **$1.56/month**. 1,000 free orgs ≈ $1,540/month, so a $500 budget covers
about 320 active free orgs.

## Decision

- **Free tier entitlements** (plan `free`, as rows in `plan_entitlements`): **1 project, ≤ 10
  questions, weekly runs, 2 engines on low-cost models, fixed 3 samples** per
  (question, engine) (no adaptive extension). Enforced at the API (creating projects and
  questions) **and** at authorize time through `quota_buckets` and the usage ledger, so
  concurrent workers can't exceed it (ADR-0010).
- **Global cap:** `PLATFORM_MONTHLY_BUDGET_USD` is a reservation scope (`platform`) checked on
  every free-tier provider call (and every free-tier agent/extraction call).
- **Pacing:** the monthly budget is released linearly (refilled daily as a token bucket), so
  early-month signups can't drain it and the last week isn't starved.
- **Alerts** to the platform owner at **80% and 100%** of the cap (outbox → email). At 100%,
  free-tier runs are **blocked**. Affected runs show "free capacity for this month is used up; add
  your own key to continue, or wait until <date>", recorded as blocked, never as zero visibility
  (ADR-0020).
- **Lower scheduling priority:** free-tier jobs have weight **0.25** in weighted fair queuing vs
  **1.0** for BYOK (ADR-0006), and use the platform key's own AIMD scope (ADR-0011). Free users
  are served after paying-their-own-way users when there is contention, but they are never
  starved.
- **Sharing:** free-tier models are shared observations like any other (ADR-0007), which stretches
  the budget because popular free questions are sampled once.
- **Abuse controls:** one free org per verified email; signup rate limits per IP; disposable
  email domains blocked; the project website must resolve; runs are tied to the weekly cadence
  (no on-demand free runs beyond a small allowance).
- Self-hosted instances have **no free tier** and no platform key (ADR-0024).

## Alternatives considered

- **No free tier (BYOK only):** zero platform cost, but a much worse first-run experience for
  the target user (non-technical small businesses). Rejected for hosted; it is the self-hosted
  mode.
- **Free tier without a global cap (per-org limits only):** per-org limits don't bound total
  spend: 10x signups means 10x cost. Rejected.
- **Hard monthly cap without pacing:** the budget would be gone by the 10th in a busy month,
  creating a terrible experience for anyone signing up later. Rejected.
- **Free trial (14 days full product) instead of a permanent tier:** more value up front, but
  time-limited free plus BYOK is confusing; a small permanent tier is simpler to explain.
- **Ads / data monetization:** incompatible with the privacy boundary (ADR-0007) and the
  product's honesty positioning.

## Consequences

- \+ Keyless onboarding with a bounded worst case: platform spend ≤ cap + one batch of in-flight
  reservations (≤ $1).
- \+ The same reservation machinery as BYOK caps; paid plans later are just more plan rows.
- − When the cap is hit, free users are blocked until the next day's release or next month,
  which needs good messaging.
- − Low-cost models and 3 fixed samples give wider intervals; the UI must make the uncertainty
  explicit (it always shows intervals and n).
- − Abuse controls add signup friction (email verification).

## Related

- [ADR-0006](0006-weighted-fair-scheduling.md), [ADR-0010](0010-budget-reservations.md), [ADR-0011](0011-aimd-adaptive-concurrency.md), [ADR-0022](0022-byok-envelope-encryption.md)
- system-design §4 (free-tier sensitivity), §8m
