# ADR-0014: Postgres Row-Level Security with per-transaction tenant context

- Status: Accepted
- Date: 2026-11-12

## Context

Recommendr is multi-tenant: agencies, small businesses and their clients share one database.
A single missing `WHERE org_id = …` in any query, endpoint, job handler or agent tool would leak
one customer's competitors, questions, verified facts or BYOK usage to another. Application-level
filtering alone relies on every developer and every code path getting it right forever.

The web process connects through **Neon's pooler (PgBouncer in transaction mode)**: a server
connection is assigned to a client only for the duration of one transaction. Session-level
state (`SET`, prepared statements, advisory locks, `LISTEN`) can leak to another tenant's
transaction or vanish.

## Decision

- Every tenant table has `org_id uuid NOT NULL` and:

```sql
ALTER TABLE t ENABLE ROW LEVEL SECURITY;
ALTER TABLE t FORCE ROW LEVEL SECURITY;          -- applies even to the table owner
CREATE POLICY tenant_isolation ON t
  USING      (org_id = current_setting('app.org_id', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org_id', true)::uuid);
```

- **Tenant context is per transaction:** the first statement of each unit of work is
  `SELECT set_config('app.org_id', $1, true)`. The third argument `true` makes it transaction-local
  (equivalent to `SET LOCAL`, but parameterizable). It is set by a FastAPI dependency *after*
  authenticating the user and checking membership/role (application-level check, defense in depth).
- **Fail closed:** `current_setting('app.org_id', true)` returns NULL when unset, so the
  predicate is NULL and the transaction sees **zero rows** and can't insert.
- **Roles:** migrations run as the owner role. The app role (`recommendr_app`) is not the owner
  and has **no `BYPASSRLS`**. The worker role can claim `jobs` across orgs (the jobs table is not
  RLS-scoped) but sets `app.org_id` per job transaction before touching tenant tables. No runtime
  role bypasses RLS.
- **Pooler compatibility:** asyncpg on the pooled URL uses `statement_cache_size=0` (named
  prepared statements don't survive transaction pooling); no session `SET`, advisory locks or
  `LISTEN` on pooled connections.
- **CI enforcement:**
  - a catalog check fails CI if any table with an `org_id` column lacks `relrowsecurity AND relforcerowsecurity`:

    ```sql
    SELECT c.relname FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE a.attname = 'org_id' AND c.relkind IN ('r','p')
      AND NOT (c.relrowsecurity AND c.relforcerowsecurity);
    ```

  - per-table tests create orgs A and B and assert that A's context can't SELECT, UPDATE, DELETE
    or INSERT B's rows, and that no context means no rows.

## Alternatives considered

- **Application-level filtering only:** works until someone forgets. RLS turns that bug from
  "data leak" into "empty result".
- **Schema per tenant:** strong isolation, but migrations × thousands of schemas, a catalog
  explosion, and painful cross-tenant workflows (shared observations, job queue).
- **Database per tenant:** strongest isolation, but operationally impossible at 500 to 50,000
  orgs on a small team and budget.
- **Session-level `SET app.org_id`:** leaks across tenants under transaction pooling, which is a
  correctness *and* security bug.
- **Separate DB user per tenant:** doesn't work with pooling and connection limits.

## Consequences

- \+ Isolation is enforced by the database, independent of application bugs; agent tools and
  MCP inherit it for free.
- \+ Compatible with Neon's transaction pooler.
- − Every transaction pays one extra statement (negligible).
- − RLS predicates must be index-friendly: tenant indexes lead with `org_id`/`project_id`.
- − Cross-tenant operations (admin, global observation layer, job claiming) need explicit
  non-RLS tables or carefully reviewed roles. Kept minimal and reviewed.
- − Disabling prepared-statement caching on pooled connections costs a little parse time.

## Related

- [system-design §7, §8j](../system-design.md#j-rls-with-a-transaction-pooler-adr-0014), [ADR-0007](0007-shared-observation-layer.md),
  [ADR-0019](0019-render-and-neon-hosting.md)
