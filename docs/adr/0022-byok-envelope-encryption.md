# ADR-0022: Bring-your-own-keys with envelope encryption

- Status: Accepted
- Date: 2026-11-12

## Context

Recommendr is free because **users bring their own API keys** (OpenAI, Google Gemini,
Perplexity, Anthropic) per organization, so provider spend lands on their accounts, not ours.
That makes us custodians of high-value secrets: a leaked key means real money spent by an
attacker and a broken trust promise. Workers must be able to use keys unattended (scheduled
runs), so we can't use client-side-only encryption; we must be able to decrypt server-side. And
self-hosters need the same design without cloud dependencies.

### Threat model

| Threat | Must defend? |
|---|---|
| Database dump / backup leak / Neon branch shared by mistake / SQL injection read | **Yes**: ciphertext alone must be useless |
| Ciphertext copied between rows/orgs (SQL injection write) | **Yes**: must fail to decrypt |
| Keys appearing in logs, error messages, Sentry, traces, API responses, frontend | **Yes** |
| Malicious org member reading a key back | **Yes**: write-only API |
| Full compromise of a running app host (env + memory) | Residual risk: accepted, mitigated by later KMS option |

## Decision

**Envelope encryption with AES-256-GCM** (implemented with the `cryptography` package, added in
the phase that builds the vault):

- Per secret: a random 256-bit **data encryption key (DEK)**; the API key is encrypted with
  AES-256-GCM (random 96-bit nonce) and **AAD = `org_id ‖ key_id ‖ provider`**.
- The DEK is wrapped with AES-256-GCM under the **key encryption key (KEK)** from the environment
  variable `KEY_ENCRYPTION_KEY` (32 random bytes, base64), with AAD = `key_id ‖ kek_version`.
- Stored columns: `ciphertext, nonce, wrapped_dek, dek_nonce, kek_version, last4`; plaintext
  and DEK are discarded immediately.
- **Rotation:** set a new `KEY_ENCRYPTION_KEY` with a higher version and move the old one into
  `KEY_ENCRYPTION_KEYS_PREVIOUS` (`version:key` list). A backfill job **re-wraps DEKs** (the
  secrets themselves are never re-encrypted, so rotation is cheap and doesn't touch plaintext),
  then the old KEK can be retired. `kek_version` says which KEK unwraps each row.
- **Write-only API:** after saving, responses only ever contain provider, label, **last 4
  characters**, status, created date, last used, usage and cost. There is no endpoint that
  returns a key.
- **Validate on save** with the cheapest call that proves the key works (model listing where it's
  free; otherwise a 1-token completion), classifying invalid / insufficient permissions / no
  quota. Invalid keys are rejected with a clear message.
- **Revoke** (status `revoked`, ciphertext deleted after a grace period) and **replace**
  (validate the new key, insert it, revoke the old one, in one transaction; usage history stays
  linked through `replaced_by`). Only owner/admin can do these, and each is audit-logged.
- **Scrubbing:** a structlog processor and a Sentry `before_send` hook redact known key shapes
  (`sk-…`, `sk-ant-…`, `pplx-…`, `AIza…`) and fields named like `*key*`, `*secret*`, `*token*`
  or `authorization`. Provider exceptions are re-raised as sanitized errors; HTTP debug logging
  for provider hosts is disabled. **Tests** push fake keys through every log, error and Sentry
  path and assert they never appear.
- **Decryption happens only in workers** (and the API's validation path), in memory, for one call.
- **Credential resolver** for every engine adapter:
  1. the org's active **BYOK key** for that provider;
  2. otherwise the **platform free-tier key**, if the org is on the free tier, the engine is a
     free engine, and both the org quota and the platform budget allow it (ADR-0023);
  3. otherwise **blocked** with an actionable message (add a key, or wait for the quota reset).
     The engine is marked blocked for the run, never recorded as zero (ADR-0020).
- **Usage and cost** per key and per org come from the usage ledger (ADR-0010) and are shown in
  the UI; an optional monthly cap per key is enforced as a reservation scope.

## Alternatives considered

- **Plaintext (or base64) in the DB:** rejected; any dump leaks every key.
- **pgcrypto (`pgp_sym_encrypt` in SQL):** the key travels to the database in SQL statements,
  where it can show up in logs, `pg_stat_statements` or error messages, and the DB server sees
  the plaintext. No AAD binding and awkward rotation.
- **Single-layer AES with the env key directly:** works, but rotation means re-encrypting every
  secret with plaintext in memory; no per-secret key isolation.
- **Cloud KMS (AWS KMS, GCP KMS) for the KEK:** strongest (the KEK never leaves the HSM, access
  is audited). Rejected *for now*: it adds a cloud dependency that self-hosters don't have, plus
  latency and cost per unwrap. The envelope design makes this a **drop-in later option** (the
  KEK provider is an interface) through a superseding ADR.
- **HashiCorp Vault (transit engine):** excellent but heavy to operate, especially for
  self-hosters.
- **Don't store keys; the user pastes a key per run:** breaks scheduled runs, the core feature.

## Consequences

- \+ A DB dump, backup or leaked preview branch reveals no usable keys.
- \+ AAD stops ciphertext swapping across rows and orgs.
- \+ Cheap KEK rotation; the same design works hosted and self-hosted.
- − Whoever controls the app environment (KEK) and DB can decrypt. That is the accepted residual
  risk, documented, with KMS as the upgrade path.
- − **Losing the KEK makes every stored key unrecoverable** (users must re-enter keys). Backup and
  rotation runbooks are required; self-hosting docs stress this.
- − Validation calls may cost a fraction of a cent on some providers.
- − Scrubbing is defense in depth, not a guarantee; it needs tests and review whenever logging
  changes.

## Related

- [ADR-0010](0010-budget-reservations.md) reservations and ledger; [ADR-0023](0023-free-tier-with-platform-spend-cap.md) free tier
- [ADR-0011](0011-aimd-adaptive-concurrency.md) per-key AIMD scopes; [ADR-0020](0020-partial-results-instead-of-zeros.md) blocked ≠ zero
- system-design §8l, §11
