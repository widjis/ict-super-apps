# Active Directory account unlock

`POST /api/ad/users/:samAccountName/unlock` accepts a URL-encoded **exact sAMAccountName** and an access bearer token. Request body is not used. DN input, passwords, enable/disable operations and bulk unlock are not supported.

## Authorization and configuration

- Existing access-token/session verification runs first; document tokens are rejected.
- Configure backend `LDAP_UNLOCK_ADMIN_GROUPS` as a semicolon-separated list of full AD group DNs. It is **deny-all when unset/empty**. This is separate from `LDAP_ALLOWED_GROUPS` (login eligibility).
- Every request looks up the authenticated actor in AD and requires ACTIVE status plus **direct** membership in one configured unlock-admin group. Nested/primary-group membership is not expanded; token `role` claims and cached memberships do not grant access. AD authorization lookup failures fail closed.
- Uses the existing `LDAP_URL`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_SEARCH_BASE` (fallback `LDAP_BASE_DN`) and `LDAP_TLS_REJECT_UNAUTHORIZED` settings. Never put secrets in git. Docker Compose already loads `backend/.env`; an operator must supply the new group setting there or via managed environment configuration and restart the backend when deploying. No environment file is changed by this implementation.
- Use LDAPS with trusted certificates and `LDAP_TLS_REJECT_UNAUTHORIZED=true` in production. Keep the search base and permissions scoped to the intended users/OU.

## Required AD delegation

The configured **service identity**, not the browser user, needs directory search/read access to the actor's `memberOf` and account state; search/read access to target user objects; and **Read lockoutTime / Write lockoutTime** on the intended descendant User objects/OU. Read `userAccountControl` is needed for verified status. Do not grant reset-password, write `userAccountControl`, Domain Admin, or broad full-control privileges for this feature. Protected accounts may not inherit OU delegation (AdminSDHolder); AD refusal is returned, not bypassed.

## Operation and responses

The backend escapes LDAP filter values, resolves exactly one person/user (excluding computers) under the configured search base, and uses that returned DN for a single ldapts `Change` / `Attribute` replace of `lockoutTime` with string `0`. It does not change password, `pwdLastSet` or `userAccountControl`. It reads the exact DN back from the same LDAP client/DC before declaring success.

- **200** `{ "ok": true, "user": { "id": "<requested sAMAccountName>", "status": "ACTIVE" | "DISABLED" } }`: lockoutTime read back as zero. Disabled accounts remain disabled. Already-unlocked accounts are idempotently cleared.
- **400** `INVALID_ID`; **404** `NOT_FOUND`; **409** `AMBIGUOUS_ID`: no target write.
- **401** existing missing/invalid/expired/revoked-token errors; **403** `FORBIDDEN`: no target write.
- **503** `AD_AUTHORIZATION_UNAVAILABLE` (or existing `AUTH_UNAVAILABLE`): cannot establish authorization; no target write.
- **502** `LDAP_INSUFFICIENT_ACCESS` for AD modify result 50; sanitized `LDAP_SERVICE_BIND_FAILED`, `LDAP_SEARCH_FAILED`, `LDAP_MODIFY_FAILED`, `LDAP_CONNECT_FAILED`, `LDAP_TLS_FAILED` for directory failures.
- **502** `LDAP_UNLOCK_UNVERIFIED`: the write was acknowledged but readback failed, remained locked, or lacked required state. The account **may already have been changed**; refresh/check before retrying. A transport failure during modify can likewise leave an uncertain outcome.
- **500** `LDAP_CONFIG_MISSING` or `AD_UNLOCK_FAILED`: server-side configuration/unexpected failure.

Error bodies are `{ "ok": false, "error": "<code>" }`; raw LDAP diagnostics and secrets are never returned. A later lockout or cross-DC replication delay remains possible after a successful readback.

## Audit and UI

Structured JSON stdout events `ad.account.unlock` include a random requestId, timestamp, actorId, target, outcome and HTTP status. ATTEMPT and final outcome events are correlated; unauthorized attempts are recorded too. Forward backend stdout to durable restricted-access logging with retention in production. This is not a new database audit table; a process crash may leave an ATTEMPT without a final event. Tokens, headers, bodies, service credentials and raw LDAP errors are excluded.

The UI disables the pending account button and suppresses duplicate requests, keeps per-account success/error messages, and updates only that account from the verified server result. It never optimistically labels an account ACTIVE, resets a password, or enables an account.

## Local verification (no live AD)

`npm test`, `npm run lint`, `npm run build`. LDAP bind/search/modify/unbind are mocked in unlock tests. Tests cover real route authorization, direct group membership, disabled actors, LDAP errors, audit output, filter escaping, returned DN use, exact modification, readback failure and per-account client state. Production group configuration, delegation and actual DC interoperability still require an operator-controlled acceptance test; no real account was unlocked during development.
