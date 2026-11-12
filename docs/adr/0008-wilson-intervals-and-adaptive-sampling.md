# ADR-0008: Sampling with Wilson intervals and adaptive stopping

- Status: Accepted
- Date: 2026-11-12

## Context

LLM answers are non-deterministic: asking the same question twice can yield different
recommendations. Any "visibility" number is therefore an **estimate from samples**. Competitors in
this space typically show single percentages without uncertainty. Our positioning is "honest
about uncertainty", and every sample costs money (BYOK or platform budget). Per-cell sample sizes
are small (3 to 10), where the textbook Wald interval fails badly.

## Decision

**Interval:** report mention rate with the **Wilson score interval** (95%):

```
center    = (p̂ + z²/2n) / (1 + z²/n)
halfwidth = z / (1 + z²/n) × sqrt( p̂(1−p̂)/n + z²/4n² ),   z = 1.96
```

Examples: 0/3 → [0.00, 0.56], 3/3 → [0.44, 1.00], 5/10 → [0.24, 0.76].
Aggregates over questions/engines/days account for within-cell correlation with a design effect
`DE = 1 + (m − 1)ρ` (ρ estimated from history) and report effective n. The UI always shows n;
never a bare percentage.

**Adaptive stopping rule** per tenant view of a (question, engine, locale, model, day) cell:

```
n0 = 3, cap = plan cap (free: fixed 3; BYOK default 10, configurable 3..20), h* = 0.30
take samples in deterministic prefix order sample_index = 0, 1, 2, ...
stop when n ≥ cap                                   (reason: cap)
stop when n ≥ n0 and wilson_halfwidth(x, n) ≤ h*    (reason: precise)
otherwise request the next sample
```

Unanimous cells (0/3, 3/3: half-width 0.28) stop at 3; a 50/50 cell stops at n = 7; mixed cells
run to 7 to 10. Expected samples per cell ≈ 5 (assumption: 55% unanimous). The rule is fixed in
advance and recorded with the stop reason on each cell.

**Coverage check:** a Monte Carlo test (phase 6, hypothesis + numpy) checks **≥ 93% empirical
coverage** for nominal 95% across p ∈ [0, 1] *including* the stopping rule. If it fails, use
z = 2.24.

## Alternatives considered

- **Fixed n (e.g. always 10):** simplest, about 2x the cost (10 vs ~5 samples); wasteful on
  unanimous cells, which are most of them.
- **Wald (normal approximation) interval:** zero width at 0/n and n/n, poor coverage at small n.
- **Clopper-Pearson (exact):** guaranteed coverage but conservative (wider), so it would spend more
  samples for the same stopping target.
- **Bayesian Beta-Binomial with credible intervals:** attractive (and could be a later ADR), but
  priors are hard to explain to small-business users and hard to defend as "honest" without
  calibration; Wilson is well understood and nearly matches Jeffreys intervals.
- **Sequential probability ratio tests:** designed for testing a hypothesis, not estimating a rate.
- **Tight per-cell precision targets (e.g. h* = 0.10):** needs ~90 samples per cell; precision
  should come from aggregation, not per-cell sampling.

## Consequences

- \+ About half the samples of fixed n = 10, spent where outcomes are uncertain.
- \+ Defensible, well-known statistics; property-tested.
- \+ Free tier uses fixed n = 3 (predictable cost); intervals honestly show it's less precise.
- − Per-cell estimates are wide; the product must teach users to read trends and aggregates.
- − Optional stopping introduces a small bias; mitigated by a pre-registered rule, caps, and the
  coverage test.
- − Shared cells continue until the strictest tenant stops (ADR-0007).

## Related

- ADR-0007 (shared cells), ADR-0009 (change detection), ADR-0010 (cost per sample)
- system-design §8a, §8b, §3 (measurement honesty)
