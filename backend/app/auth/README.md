# auth

Identity and sessions: email+password sign-in with argon2id hashing, Google OAuth, secure httpOnly session cookies on the parent domain, password reset, and the current-user/current-org dependencies every other module's routes use. Owns users, credentials, sessions and the security audit log. Phase 1: empty skeleton, no logic yet; other modules use it only through its service interface, never its tables.
