# prompts

Question discovery and management: generates candidate questions customers ask AI assistants, clusters them by intent, normalizes them (`normalized_question_hash`) so identical public questions can be shared across tenants, and marks questions containing private data as tenant-private so they are never shared. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
