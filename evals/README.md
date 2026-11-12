# evals

Golden datasets and the extraction evaluation harness (phase 5).

- **Golden set:** hand-labeled AI answers (brand mentions, rank, sentiment, competitors, cited sources, factual claims) across engines, categories and locales.
- **Harness:** runs the current extractor and entity resolution cascade against the golden set and computes precision, recall and F1 per field and per engine.
- **CI gate:** blocks merges that regress extraction quality beyond agreed tolerances (see `docs/system-design.md` §8h and ADR-0012/0013).
- **LLM-judge calibration:** measures agreement (Cohen's kappa) between the LLM judge and human labels before the judge is trusted for anything.

Golden data contains only public AI output, never tenant data or API keys.

## Agent evals (phase 10)

- **Scenarios** (`agents/`): scripted cases built on the deterministic fake provider adapters and fixtures where the correct diagnosis is known (e.g. "a competitor gained because a new listicle is cited by 3 engines").
- **Measured in CI:** diagnosis accuracy, citation validity (every cited answer/metric id exists and supports the claim), and cost per agent run.
- **Prompt-injection red team** (`redteam/`): pages, AI answers and files containing injected instructions (fake tool calls, spend/publish requests, exfiltration and prompt-leak attempts). CI asserts that no spend/publish tool executes, that nothing is fetched outside allowed domains, and that the injection is flagged. See `docs/system-design.md` §14 and ADR-0027/0028.
