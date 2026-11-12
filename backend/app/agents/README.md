# agents

The internal agent (ask-your-data) and background agents (diagnosis, actions, fix writer, competitor investigator): a tool-using loop with max steps, token budget and a cost cap charged through budget reservations; grounding validation that rejects uncited numeric claims; approval gates for spend/publish tools; prompt-injection defenses (untrusted content in delimited data blocks, taint tracking, no arbitrary egress); and full replayable traces of every step. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
