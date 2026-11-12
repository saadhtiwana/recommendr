# ADR-0009: Change detection with Benjamini-Hochberg FDR control

- Status: Accepted
- Date: 2026-11-12

## Context

Users want to know when their AI visibility changes, but samples are noisy (ADR-0008) and a
project has ~120 (question, engine) cells (30 questions × 4 engines). Testing each cell at
α = 0.05 would produce ~6 false alerts per project per period from noise alone. Alert fatigue
kills trust; the product promise is that alerts mean something (system-design §3: ≤ 10% false
discoveries, ≤ 1 non-actionable alert per project per month).

## Decision

Per project per period (default: this week vs the previous 4 weeks):

1. For each cell with enough data in both periods, run a **two-proportion z-test** on mention
   rate (pooled variance, with the design-effect correction from ADR-0008); use **Fisher's exact
   test** when any expected count is < 5.
2. Apply **Benjamini-Hochberg** at **q = 0.10** across the project's family of m cells:

```
sort p-values p(1) ≤ ... ≤ p(m)
k = max { i : p(i) ≤ (i / m) · q }
reject H(1) ... H(k)
```

3. Fire an alert only if a cell is BH-significant **and** |Δ| ≥ **10 percentage points**
   (minimum effect size) **and** both periods are **complete** for that engine (partial data never
   alerts, ADR-0020).
4. Headline project-level metrics (overall mention rate, share of voice) are tested separately,
   Bonferroni across that handful.
5. If the provider `model` differs between periods, the alert is annotated
   "model changed from X to Y", and the analysis can be stratified by model.
6. Alerts are deduped (the same cell/direction alerts once until it reverts) and carry
   "not useful" feedback, which feeds the alert-quality SLO.

## Alternatives considered

- **Fixed thresholds ("alert if rate moves 20 pp"):** ignores sample size; noisy cells fire
  constantly, large cells miss real changes.
- **Per-test α = 0.05, no correction:** ~6 false alerts per project per week.
- **Bonferroni (α/m):** controls family-wise error, so it's far too conservative with m ≈ 120;
  almost no real change would ever alert.
- **Bayesian change-point detection:** good for continuous monitoring, but harder to explain and
  calibrate; possible later for trend views.
- **Sequential monitoring (e.g. always-valid p-values):** attractive for daily peeking, more
  complex; our periods are fixed and pre-defined, so classical tests are valid.

## Consequences

- \+ The expected share of false alerts is ≤ 10%, which we can state in the product.
- \+ BH stays valid under positive dependence between cells (shared sources), our likely case.
- \+ The minimum effect size means alerts are both real *and* meaningful.
- − Some real but small or short-lived changes won't alert; they still appear in trend charts
  with intervals.
- − Requires enough samples per period; low-cadence free-tier projects get fewer, coarser alerts
  (shown honestly).

## Related

- ADR-0008 (intervals and design effect), ADR-0020 (partial data), ADR-0027 (diagnosis agent triggered by alerts)
- system-design §8c, §3, §12
