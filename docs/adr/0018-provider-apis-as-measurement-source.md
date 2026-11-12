# ADR-0018: Provider APIs with web search as the measurement source, with honest limitations

- Status: Accepted
- Date: 2026-11-12

## Context

We want to know what ChatGPT, Gemini, Perplexity and Claude tell customers. Customers use the
**consumer apps** (chatgpt.com, gemini.google.com, perplexity.ai, claude.ai). There are two ways
to measure:

1. **Official APIs with web search/grounding enabled** (OpenAI Responses API with web search,
   Gemini with Google Search grounding, Perplexity Sonar, Anthropic with the web search tool).
2. **Automating the consumer apps** (headless browsers, logged-in accounts, scraping responses).

## Decision

Use **official provider APIs with web search/grounding** as the measurement source, and be
**explicit about what that does and doesn't represent**.

- Each engine adapter uses the API configuration closest to the consumer experience (search
  enabled, consumer-equivalent model family where available, locale/location parameters when
  supported) and records the **exact model identifier**, tool configuration and
  `prompt_template_version` on every observation.
- The question is sent as a plain user message with a minimal, versioned system prompt
  (or none where the API allows), so we don't steer the answer.

**Honest limitations (shown in the product and the docs):**

- **Not identical to the consumer apps.** Consumer apps add personalization, conversation
  memory, user location, their own (unpublished) system prompts, A/B experiments and sometimes
  different model versions or search pipelines. API answers are a **proxy**, not a replay of what
  a particular customer saw.
- **Location:** consumer apps infer the user's location; APIs only partially support location
  hints. Local-business results may differ.
- **Model versions** change silently on both sides; we record the model ids and annotate
  changes (ADR-0009).
- **Calibration study** (phase 4): for a sample of questions, compare API answers with manually
  collected consumer-app answers (fresh logged-out sessions where possible, fixed locations) and
  publish the agreement (overlap of mentioned brands, rank correlation) per engine. Update it
  periodically.
- **UI disclaimer** on every visibility view: "Measured via official APIs with web search. Real
  users may see different answers depending on personalization, location and app version." It
  links to the methodology page and the calibration results.

## Alternatives considered

- **Scraping consumer apps:** closer to what users see, but violates providers' terms of
  service, needs many accounts and proxies, breaks with every UI change, is hard to scale
  reliably, and is a legal and ethical liability for an open-source project. Results would also
  depend on the scraping account's own personalization.
- **APIs without web search:** cheaper, but answers come only from training data, are stale, and
  miss citations, so they'd be much less representative of modern AI search.
- **Third-party panels / browser extensions collecting real users' chats:** representative, but
  privacy-invasive and out of keeping with our values.

## Consequences

- \+ Legal, reliable, reproducible, scalable, and every observation is attributable to a model.
- \+ Citations and (where exposed) search fan-out queries are available as structured data.
- \+ Users can use their own keys (BYOK, ADR-0022), which wouldn't work with scraping.
- − We measure a proxy. That's mitigated by transparency (disclaimer, calibration study,
  methodology page), and it's consistent with "honest about uncertainty".
- − Web search tool pricing makes calls relatively expensive (~$0.01 per call), which motivates
  the shared observation layer (ADR-0007) and adaptive sampling (ADR-0008).
- − Provider API features differ (e.g. not all expose fan-out queries); some metrics are
  engine-specific and labeled as such.

## Related

- [ADR-0007](0007-shared-observation-layer.md), [ADR-0008](0008-wilson-intervals-and-adaptive-sampling.md),
  [ADR-0009](0009-change-detection-with-benjamini-hochberg.md), [ADR-0022](0022-byok-envelope-encryption.md)
