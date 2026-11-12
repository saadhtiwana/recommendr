# runs

Measurement runs: turns a project's questions into a run DAG (discover/fan-out -> sample -> extract -> aggregate -> project read models -> alert), tracks per-engine completeness, and marks results partial instead of zero when a provider fails. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
