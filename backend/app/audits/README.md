# audits

Website AI-readiness audit: robots.txt rules for AI crawlers (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended), JSON-LD, llms.txt, FAQ coverage and crawlability. The crawler is SSRF-hardened (DNS validation on every hop, blocked private ranges, capped redirects, size and time), respects robots.txt, and uses an honest user agent. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
