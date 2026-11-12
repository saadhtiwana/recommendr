"""Scheduler entrypoint (the Render `cron` job). Phase 1: placeholder.

Future role (phase 3+): run on a schedule, find projects whose measurement run is due (daily by
default, by plan), and enqueue one root `run` job per due project with an idempotency key of
(project_id, scheduled_date). If two scheduler invocations overlap, or one is retried, no
duplicate runs are created. It also enqueues periodic maintenance (partition creation, rollup
compaction, R2 archival, lease reaping), each under its own idempotency key. It does no
measurement work itself, only enqueues; the workers do the work. Exits when done, so it costs
nothing between runs and doesn't keep Neon awake.
"""


def main() -> None:
    raise SystemExit("scheduler: not implemented yet (phase 3)")


if __name__ == "__main__":
    main()
