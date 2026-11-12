# orgs

Organizations (tenants), memberships, invitations and RBAC roles (owner, admin, member, client-viewer). Sets the per-transaction tenant context (`SET LOCAL app.org_id`) that Postgres Row-Level Security policies enforce, and exposes permission checks to other modules. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
