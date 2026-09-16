# Missing employee photo worker

`photo_sync_worker` runs in the existing Compose project from exactly the
`backend_prod` image; it exposes no HTTP listener/port. Build `backend_prod`
first. It reuses `backend/.env` (`LDAP_*`, `SRC_DB_*`, `POSTGRES_*`), including the
existing CardDB column/table mapping. No new secrets or policy settings.

## Initial scope

- On startup, then one hour after each finished cycle, enumerate active AD users
  with the existing paginated directory client (500 per page). Only nonempty
  employeeID values are candidates. Login/VPN group membership is **not** a
  photo-sync criterion. AD access is read-only.
- Compare candidates against PostgreSQL. Each cycle attempts at most 50 missing
  photos, sequentially (concurrency 1). Never overwrite a photo row, even if
  another writer inserts while a source request is running. Never insert an
  empty photo. Existing manual sync commands remain unchanged; do not use their
  legacy `--all` mode for this worker.
- Separate `photo_sync_retry` metadata persists absence for 24 hours. New IDs
  precede retried IDs; oldest-attempt ordering avoids repeatedly selecting the
  first page. A source failure immediately stops further source requests and
  opens a persistent circuit for 1, 2, 4, 8, 16, then at most 24 hours. The global
  circuit also covers LDAP/connect failures. Successful cycles reset the circuit.
- A PostgreSQL session advisory lock prevents overlapping cycles, including
  across replicas. A failed/lost session must not continue writing.
- **No weekly update reconciliation in this release.** Existing photo changes
  in CardDB are not copied by this missing-only worker.

## Deploy (authorized operators only)

Before migrations, preserve source, `.env`, prior backend image and a custom
`pg_dump` backup; validate with `pg_restore --list`. Keep backups private.
Fast-forward the clean checkout to the published commit without changing
existing CORS or `LDAP_ALLOWED_GROUPS`. Then:

```sh
docker compose build backend_prod
docker compose run --rm --no-deps backend_prod npm run db:migrate
docker compose up -d --no-deps backend_prod photo_sync_worker
```

Migration 005 is additive (`photo_sync_retry`, `photo_sync_status`). Do not run
`compose down`, recreate unrelated services, or run down-migrations as rollback.
To pause source access safely: `docker compose stop photo_sync_worker`.
To roll back code, stop the worker and redeploy the saved backend image; retain
additive tables and copied photos unless a separately approved restore is needed.

## Observe

```sh
docker compose ps photo_sync_worker
docker compose logs --tail=10 photo_sync_worker
```

Logs contain only cycle state and counts (`attempted`, `synced`, `missing`,
`failed`, `skipped`), never IDs, image bytes, source errors or credentials.
`photo_sync_status` holds latest completed counts, completion time, failure count
and next source attempt. The container healthcheck reads its private heartbeat
file; stale progress, source/worker errors and circuit backoff are unhealthy.
An unhealthy worker is not permission to bypass the circuit. Check source
connectivity/configuration and retain retry metadata.

## Client cache

EmployeePhoto and MePhoto cache **only HTTP 404** for five minutes, bounded to
2,000 negative entries. A page remount/revisit after TTL retries the API; a
continuously mounted fallback does not automatically poll. Authentication,
network and server failures are not cached. Object URLs are consumer-owned and
revoked on unmount/key change; late responses never create URLs after unmount.
Successful images are fetched again on remount rather than retained globally.

## Verification

`npm test`, `npm run lint`, `npm run build`. Tests execute migrations and worker
SQL with PGlite; advisory-lock/client failures use controlled session doubles.
Production verification must separately confirm actual lock behavior, migration
history, container/image identity, API health and bounded cycle counts. When a
photo is copied, compare a source and stored sample privately without printing
identifiers or image data, and verify pre-existing photo digests are unchanged.
