# evals

Golden datasets and the extraction evaluation harness (phase 5).

- **Golden set:** hand-labeled AI answers (brand mentions, rank, sentiment, competitors, cited sources, factual claims) across engines, categories and locales.
- **Harness:** runs the current extractor and entity resolution cascade against the golden set and computes precision, recall and F1 per field and per engine.
- **CI gate:** blocks merges that regress extraction quality beyond agreed tolerances (see `docs/system-design.md` §8h and ADR-0012/0013).
- **LLM-judge calibration:** measures agreement (Cohen's kappa) between the LLM judge and human labels before the judge is trusted for anything.

Golden data contains only public AI output, never tenant data or API keys.
