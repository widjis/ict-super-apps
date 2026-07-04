(2026-05-05)

## Feature:
- Added Helpdesk, Assets & License Compliance, and Asset Lookup screens in Feature Hub

## Changes:
- Added hash-based deep link support for screens (e.g. #prf-monitoring, #helpdesk, #assets-license, #asset-lookup)
- Added Approved By field to PRF Monitoring and PRF Details
- Normalized Pomon API responses to support { ok, data } and direct-array payloads
- Made APK debug build script cross-platform via Node wrapper (gradlew / gradlew.bat)
- Removed Recent Alerts section from Feature Hub and increased bottom padding to avoid overlap with BottomNav

(2026-04-03)

## Changes:
- Filter MikroTik DHCP lease export hanya untuk pool CONTRACTOR_VLAN_67
- Tambah opsi delete lease per pool dengan mode dry-run/apply di script export MikroTik
- Perbaiki mapping pool export/delete: support lease.address berisi nama pool atau IP address
- Tambah opsi --skip-bound untuk skip lease status=bound saat delete
- Tambah opsi --ym YYYY-MM untuk filter berdasarkan lastConnectedDate (month & year)
- Mode delete: --delete-pool tanpa nilai / "*" artinya semua pool; parsing flag diperbaiki agar tidak salah ambil argumen
- Fix filter --ym: kalau lastConnectedDate kosong (last-seen=never), lease tidak ikut terhitung
- Tambah delete berdasarkan input CSV/teks MAC address (--delete-mac-csv / --delete-mac)
- Export: --filter-pool support "*" untuk export semua pool

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
