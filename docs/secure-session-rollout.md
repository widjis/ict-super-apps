# Secure session rollout

## Implemented contract

- `/api/me` DB/config failures are `503 ME_UNAVAILABLE`, never invalid-token responses. Auth verification infrastructure failures are `503 AUTH_UNAVAILABLE`; invalid signatures are `401 INVALID_TOKEN`; expired access/document tokens are `401 TOKEN_EXPIRED`.
- New clients opt in on login with `sessionTransport: "native" | "web"`. Access JWTs last **at most 15 minutes** and carry a session ID. Refresh sessions have **30-day absolute** and **7-day idle** limits (fixed server policy, not sliding beyond the absolute limit).
- Refresh values use 256-bit randomness; only SHA-256 hashes and used-token history are stored. PostgreSQL row locks serialize rotation/logout. A deterministic, domain-separated HMAC successor allows a **30-second retry grace** after a lost response; retry returns the same successor only while it remains current, without extending expiry. Older/reused generations revoke the family after grace. A guessed token never revokes a legitimate session.
- `POST /api/auth/refresh` rotates; `POST /api/auth/logout` revokes the family. Both require JSON. Native sends `sessionTransport: "native", refreshToken`; web sends `sessionTransport: "web"` and uses its cookie. Neither endpoint logs credentials. Responses have `Cache-Control: no-store`.
- Every session-bound authenticated API request checks the session row and `users.is_active`; logout invalidates outstanding access JWTs and new document links too. Existing stateless JWTs remain a compatibility exception (see below).
- Native access/refresh pairs are one atomic SecureStorage record (`auth_session_v2`). Web refresh is host-only `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`; only access JWT/expiry metadata is in localStorage. TLS is required. Web frontend/API must be **same-site**; use an HTTPS reverse proxy, not unrelated domains. Local HTTP development requires `NODE_ENV=development` to omit `Secure`.
- Client serializes refresh/login/logout (including Web Locks across modern browser tabs), retries a protected request once, and ignores stale failures from an older token. Startup outages show Retry without erasing credentials or bypassing biometric unlock. Failed logout explicitly keeps the session for a real revocation retry; it does not falsely claim remote logout.
- Biometric unlock remains available on mobile. New app no longer saves/replays AD passwords for indefinite biometric re-login; old saved passwords are removed on successful login/session clearing. Absolute expiry requires an actual login again.

## Docker production rollout (operator-run, not executed by this change)

Actual Compose service: **`backend_prod`**, build target `prod`, `network_mode: host`, port **5059**. Development service is `backend`, port 8080. There is no database service in this Compose file. PostgreSQL is external.

1. Back up the existing PostgreSQL database and keep the previous backend image for rollback. Pull/copy this code to the Docker server.
2. Edit the server's `backend/.env` privately. Keep all current LDAP/PostgreSQL settings. Ensure:
   - `JWT_SECRET`: required, strong random secret, identical on all backend replicas; preserve existing value for compatibility. Changing it invalidates access JWTs and rotation retry derivation.
   - `POSTGRES_URL`: required, plus existing optional `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_SSL`, `POSTGRES_SSL_REJECT_UNAUTHORIZED` overrides.
   - `CORS_ORIGIN`: comma-separated **exact** trusted web origins, e.g. `https://apps.example.com`; no wildcard and no trailing slash. Android `https://localhost` and iOS `capacitor://localhost` are built-in. Compose's old forced `CORS_ORIGIN: "*"` was removed so `env_file` now takes effect. Include all legitimate browser origins, including same-origin public HTTPS when terminating TLS at a proxy.
   - `NODE_ENV=production` is already set by the Docker prod image. `PORT=5059` is already set by `backend_prod`.
   - `JWT_EXPIRES_IN` applies **only to legacy login**, default `12h`. New session access lifetime is fixed at 15 minutes; refresh policy is fixed at 30 days absolute / 7 days idle / 30 seconds retry grace. No new refresh secret is required.
3. Build and apply the additive migration **before replacing the backend**:

   ```sh
   docker compose build backend_prod
   docker compose run --rm --no-deps backend_prod npm run db:migrate
   docker compose up -d --no-deps backend_prod
   docker compose logs --tail=100 backend_prod
   curl --fail http://127.0.0.1:5059/health
   ```

   `db:migrate` uses the existing node-pg-migrate runner and applies pending migrations, including `004_auth_sessions.cjs` (`auth_sessions`, `auth_refresh_tokens`). Do not run both migration and backend replacement concurrently. Do not use `docker compose config` in shared logs: it can print resolved secrets.
4. Verify with a test account on the actual device: login, reopen app, access `/api/me`, refresh after access expiry, logout, and verify the old access/refresh pair is rejected. Briefly simulate an API outage to confirm Retry preserves credentials. Do not post tokens in logs/chat.
5. Deliver/install the new APK after backend migration/rollout. The APK endpoint remains the project's existing build-time `VITE_API_BASE_URL`; no endpoint or `.env` secrets were modified.

## Compatibility and rollback

- Old APKs omit `sessionTransport`: login still returns the original `{ok, token, user}` shape and legacy `JWT_EXPIRES_IN` lifetime, with no refresh session. Existing stateless tokens continue working until expiry; their logout is local-only and cannot be revoked individually. Updated middleware reports `TOKEN_EXPIRED` consistently, but old UI cannot gain automatic refresh without updating.
- New APK can consume an old backend's token-only login (native omits cookies, preserving wildcard-CORS compatibility), but cannot refresh until the new backend is deployed. Existing legacy sessions are **not silently promoted** from a bearer JWT into a month-long session. After expiry, or after manual logout/login, the new APK obtains its first bounded refresh session. A one-time login is therefore expected.
- Browser rollout needs backend first: new web auth uses credentialed requests and explicit CORS allowlisting. Cross-site cookie deployment is intentionally unsupported by SameSite Strict.
- Keep migration tables when rolling back the binary; migration is additive. Rolling back to the old server loses session-ID revocation enforcement. Do not treat old server rollback as preserving this security guarantee. Migration `down` exists and is locally tested, but must not be run while new clients/backend are active.
- AD authorization is checked at password login. Changing AD password/group membership alone is not automatically pushed into PostgreSQL; operators must revoke sessions/deactivate the local user when immediate removal is required. For a specific user, run a parameterized administrative DB operation equivalent to `UPDATE auth_sessions SET revoked_at = now() WHERE user_id = $1`; updating `users.is_active=false` also blocks session-bound access/refresh. No public admin-revocation API is added.
- Schedule operator-controlled cleanup of expired session rows, e.g. `DELETE FROM auth_sessions WHERE expires_at < now() - interval '7 days'`. FK cascade removes token history. Keep used-token history until session expiration for replay detection; never truncate it independently for active sessions.
- Apply reverse-proxy rate limits to login/refresh and protect PostgreSQL access. Existing dependency audit findings are separate follow-up work; do not run forced dependency downgrades as part of this rollout.

## Local verification and boundaries

Run `npm test`, `npm run lint`, and `npm run build:apkdebug`. DB tests use in-memory PGlite (PostgreSQL WASM) with the actual 004 up/down migration, not a live database. HTTP tests bind loopback only. PGlite serializes transactions to model separate checked-out clients; this is not a load test of a multi-replica PostgreSQL deployment.

Build on this Mac uses the existing Android Studio JDK 21:

```sh
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' \
ANDROID_HOME='/Users/widjis/Library/Android/sdk' \
npm run build:apkdebug
```

Artifact: `android/app/build/outputs/apk/debug/app-debug.apk` (debug-signed, not a release APK).

No remote deployment, live migration, or real AD login was performed. Docker image build could not be exercised locally because the configured Colima daemon socket is absent. No Android device was connected, so device install/biometric/Keystore smoke testing remains for the operator. Tests/build do not claim those checks passed.
