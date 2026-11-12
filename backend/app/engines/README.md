# engines

Provider adapters for ChatGPT, Gemini, Perplexity and Claude, using their APIs with web search/grounding. One uniform interface (question in; answer, citations, exact model identifier and token cost out), deterministic seeded fake adapters for tests, an idempotency key per call, and per-provider AIMD concurrency control coordinated through Postgres. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
