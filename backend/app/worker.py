"""Workflow worker entrypoint (the Render `worker` process). Phase 1: placeholder.

Future role (phase 3+): run a loop that claims runnable jobs from the Postgres `jobs` table with
`SELECT ... FOR UPDATE SKIP LOCKED`, picking the next org by weighted fair queuing. Each claim
takes a lease (lease_owner, lease_expires_at) and a fresh fencing token. Long handlers heartbeat
to extend the lease, and every write a handler makes presents the token so a zombie worker's
stale writes are rejected. A step's result and the enqueueing of its successor steps commit in
one transaction (transactional outbox). Failures retry with exponential backoff and full jitter;
jobs that exhaust max_attempts move to `dead` with full context. The worker polls with adaptive
backoff instead of LISTEN/NOTIFY, which doesn't work through Neon's transaction pooler; backing
off when idle also lets Neon auto-suspend. Connects with the direct (unpooled) URL. On SIGTERM it
stops claiming, finishes or releases in-flight jobs, and exits.
"""


def main() -> None:
    raise SystemExit("worker: not implemented yet (phase 3)")


if __name__ == "__main__":
    main()
