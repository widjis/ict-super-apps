(2026-04-02)

## Feature:
- Backend modular refactor (layered modules)

## Changes:
- Split backend/src/server.js routes into core + modules under backend/src/modules
- Moved core runtime files from backend/src root into backend/src/core (server/app, db, jwt, db-migrate)
- Moved integrations from backend/src root into backend/src/integrations (ldap, pomon)
- Moved repositories from backend/src root into backend/src/modules (users, carddb)
- Added carddb CLI under backend/src/modules/carddb/cli

## Notes:
- API paths are preserved; refactor focuses on maintainability and separation of concerns
