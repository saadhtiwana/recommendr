# workflow

The durable workflow engine on Postgres: jobs table, `SELECT ... FOR UPDATE SKIP LOCKED` claiming, leases with heartbeats, fencing tokens that reject zombie-worker writes, transactional outbox for step transitions, retries with exponential backoff and full jitter, a dead state for poison jobs, weighted fair queuing across orgs, and adaptive polling (no LISTEN/NOTIFY). Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
