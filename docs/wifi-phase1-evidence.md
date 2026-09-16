# WiFi Phase 1 — implementasi dan evidence lokal

Status: **implementasi lokal tersedia; bukan rilis produksi**. Pengguna menyetujui Phase 1 untuk mempermudah IT support. Tidak ada deploy, migrasi, pembuatan akun, mutasi router, commit atau push dalam pekerjaan implementasi ini. Publikasi Git ditangani reviewer/parent secara terpisah.

## API dan keputusan keamanan

`POST /api/wifi/lookup`, body JSON `{ "mac": "02:AB:CD:EF:00:01" }` (contoh sintetis). POST dipakai untuk lookup read-only agar MAC tidak masuk URL/query/access log; endpoint ini tidak menulis ke router/database.

- Autentikasi JWT/session existing (`requireAccessToken`), kemudian rate limit, kemudian gate existing `requireAdUnlockAdmin` yang di-alias sebagai `requireIctSupport`. Middleware tersebut hanya membaca authorization, tidak menjalankan unlock/audit unlock. Reuse parser `LDAP_ALLOWED_GROUPS`: satu DN penuh atau semicolon-separated, bukan split koma. Tidak ada group/role baru atau client role claim. Empty/unset policy deny-all, akun harus ACTIVE dan direct membership diperiksa ulang melalui LDAP **setiap request**, termasuk sebelum cache hit. Ini shared policy dengan privileged AD operation; memperluas setting juga memperluas hak WiFi read.
- Respons selalu `Cache-Control: no-store` pada route WiFi, termasuk auth/error. Body atau raw error/komentar tidak dicatat oleh modul. Operator tetap harus melarang request-body logging pada reverse proxy/APM.
- 200: `ok`, normalized `mac`, `match: none|single|multiple`, array `leases`, `observedAt` ISO UTC, `stale:false`, `reachability:unknown`, `internetAccess:unknown`. Setiap lease punya `mac`, `server`, `configuredAddress` (IP atau null), `configuredPool` (pool atau null), `activeAddress` (IP atau null), `dhcpStatus`, `disabled`, `dynamic`. Tidak memilih lease pertama; tidak ada owner/hostname/comment/expiry/uptime yang ditebak.
- Static lease berarti registered, bukan online. Disabled ditampilkan terpisah. DHCP bound/waiting berbeda dari reachability/internet. Pool Full/Limited tidak membuktikan enforcement atau mapping switch/SSID.
- 400 `INVALID_MAC`; 401 mengikuti auth existing; 403 `FORBIDDEN`; 429 `RATE_LIMITED` dan `Retry-After`; 503 authorization unavailable mengikuti middleware existing, atau safe source code `SOURCE_NOT_CONFIGURED`, `SOURCE_AUTH_FAILED`, `SOURCE_IDENTITY_FAILED`, `SOURCE_TIMEOUT`, `SOURCE_INVALID_RESPONSE`, `SOURCE_BUSY`, `SOURCE_UNAVAILABLE`. Unknown diagnostic disanitasi, bukan dilempar ke klien. Tidak ada kegagalan source/auth yang berubah menjadi `match:none`.
- Format MAC: six octets dengan seluruh delimiter colon atau hyphen, atau 12 hex; case/outer whitespace dinormalisasi. Mixed delimiter, multicast/broadcast, zero dan injection ditolak sebelum koneksi. Randomized unicast MAC tetap diterima.
- Limit per process: 20 lookup/actor/60 detik; maksimum 10.000 bucket aktif; 4 query router bersamaan; timeout SSH total 8 detik, maksimum respons 64 KiB/64 leases. Cache **positive-only**, maksimal 128 MAC/5 detik, waktu observasi asli tetap dipertahankan. No-match, network failure dan auth failure tidak dicache. Multi-replica rollout perlu rate limiter bersama atau pembatasan global di gateway; jangan menganggap batas ini cluster-global.

## Adapter nyata, bukan shell bebas

`backend/src/integrations/routeros/routeros.client.js` hanya mengekspor factory dengan satu operasi `lookup(mac)`. Tidak ada generic exec/path/action dari request. Satu template RouterOS tetap menjalankan `lease find where mac-address=<canonical MAC>` dan `lease get` untuk allowlist tujuh field: MAC, server, address, active-address, status, disabled, dynamic. `:foreach/:local/:put/:len/:tostr` hanya memformat output. Tidak ada add/set/remove/enable/disable/export, komentar, hostname, script lama atau inventory dump.

Transport `ssh2` memakai SSH port 22 dan host-key SHA256 verifier, tanpa trust-on-first-use atau fallback insecure. Salah fingerprint ditolak sebelum autentikasi. Output length-prefixed diparse ketat dengan END marker; partial/error/unrecognized/mismatched MAC tidak dianggap hasil kosong. Koneksi timeout/error dihancurkan; late ready tidak mengeksekusi query. SSH dipilih karena identitas RSA sudah disetujui; tidak menggunakan API plaintext 8728. TLS-specific failure diuji pada jalur LDAP; ekuivalen identitas sumber RouterOS adalah SSH host-key mismatch, bukan klaim memakai RouterOS TLS.

Konfigurasi backend-only yang diperlukan: `MIKROTIK_HOST`, `MIKROTIK_USER`, `MIKROTIK_PASSWORD`, `MIKROTIK_SSH_FINGERPRINT`; semua contoh kosong di `.env.example`, tanpa secret frontend/Vite. Tidak ada perubahan CORS, LDAP parser/policy atau DB schema. Missing config menghasilkan unavailable, tidak fallback akun diagnosis. Akun personal diagnosis hanya dipakai di proses uji lokal terisolasi, dari secret store di luar repo; **tidak disalin ke env proyek/server/APK**.

## UI

- Check Status menggunakan authenticated transport existing, form MAC dan paste native keyboard, petunjuk randomized MAC per SSID; tidak menjanjikan auto-read/scan.
- Empty/loading/result/error/stale; semua hasil lintas server ditampilkan. Pengamatan berusia 60 detik atau refresh gagal diberi Stale, tetap ada waktu observasi. 401/403 menghapus hasil sebelumnya. Input baru membatalkan request lama, clear hasil; late response tidak dapat mengisi MAC lain. Unmount membatalkan request; timeout client 30 detik. Tidak ada persistent lookup storage.
- WiFi hub tidak lagi memiliki mock pools, saturation, lease count atau network-health chart. Register Device dan Lease Report disabled/unavailable; direct rendering layar fase lanjut juga hanya menampilkan unavailable, bukan connecting permanen. Tidak ada implementasi Phase 2, QR, provisioning atau expiry worker. Tambahan Phase 2B tetap dipertahankan dan diperjelas **support-only**.

## TDD dan verifikasi aktual

Siklus RED→GREEN dijalankan sebelum kode terkait: normalisasi (undefined function → pass), semantics lookup (undefined factory → pass), fixed SSH read/pin/parser (undefined factory → pass), source failure/config/size validation (must-not-connect gagal → pass), HTTP authorization (router missing → pass), rate limit (200 alih-alih 429 → pass), source sanitization (code generik alih-alih safe auth code → pass), cache/concurrency (missing bound → pass), app mount (404 alih-alih 401 → pass), UI awal (hardcoded user/uptime → pass), error/stale/unavailable screens → pass, stale timer/cancel race → pass, serta late SSH ready setelah timeout (command masih berjalan → pass). Tes concurrency awal pernah menggantung; diperbaiki agar failure dibatasi 30 ms sebelum implementasi bound.

Perintah dan hasil final (2026-09-16, lokal):

| Pemeriksaan | Hasil |
|---|---|
| `node --test backend/test/wifi*.test.js` (cwd root) / `node --test test/wifi*.test.js` (cwd backend) | 10 tests passed pada run terakhir terkait WiFi |
| `node --import tsx --test test/wifi-ui.test.ts` | 13 passed |
| `npm test` | Full run akhir: **37 frontend + 72 backend passed**, 0 failed/0 skipped; log lokal `/tmp/ict-wifi-qa/final-tests.log` |
| `npm run lint` | `tsc --noEmit`, exit 0 |
| `npm run build` | Vite 6.4.1, 1724 modules transformed, exit 0 |
| JDK | Android Studio OpenJDK 21.0.8 |
| `node scripts/run-gradle.mjs clean` | BUILD SUCCESSFUL, 8 tasks executed |
| `npm run build:apkdebug` dengan JAVA_HOME/ANDROID_HOME/ANDROID_SDK_ROOT existing | BUILD SUCCESSFUL, 213 tasks: 184 executed, 29 up-to-date |

Warning non-fatal: Node 26 `module.register()` deprecation dari toolchain tsx/Vite; Gradle flatDir warning dan Capacitor unchecked Java operations. `npm audit --omit=dev` backend melaporkan 7 advisory existing dependency families (1 low, 4 moderate, 2 high; body-parser, qs, brace-expansion, tmp, uuid/exceljs/msal); ssh2 tidak ada pada daftar advisory. Tidak menjalankan broad audit fix di luar scope.

### Live read-only router dan local end-to-end

- Router 10.60.0.3, identity RSA approved `SHA256:2+8LMB4ELZu61rJFsD++hqZEakgb4X6UgqVBFJ5c7Dw` diverifikasi pada setiap SSH connection (helper referensi Paramiko dan adapter Node ssh2).
- Uji pertama mencoba JSON serialize/proplist pada versi router aktual dan gagal syntax/value-name; tidak digunakan dalam implementasi. Fixed length-prefixed read bekerja pada router aktual.
- `/tmp/wifi-live-verify.py`: ambil terbatas satu sampel bound dan satu waiting, bandingkan seluruh field allowlist dengan independent per-field `lease get`. Hasil aktual: bound `leases:1, referenceMatches:true, match:single, poolVsIP:true`, observed `2026-09-16T14:26:52.134Z`; waiting hasil sama dengan status waiting, observed `2026-09-16T14:26:56.188Z`. Synthetic absent MAC query menghasilkan 0, bukan dibuatkan lease. Output hanya status/count/boolean/timestamp, tidak ada MAC/IP/comment pemilik live dipublikasikan.
- `/tmp/wifi-live-verify.py --http-ui`: Chromium mobile → real Check Status component/authenticated HTTP wrapper → localhost Express WiFi route → JWT verifier + shared group gate → real pinned SSH adapter → router. **PASS** `realBrowserHttpAdapter:true`, `routerReadbackMatches:true`, `revokedFixtureMembershipClearsResult:true`, `realRouterWrites:0`, `pageErrors:[]`. LDAP identity/service responses adalah fixture sintetis terisolasi, bukan login user/AD produksi; tidak ada database produksi yang dihubungi. Ini bukan bukti live LDAP/service-account production rollout.

### Mobile browser checks

Browser tool profile gagal dibaca, sehingga dipakai Chromium headless dengan profil baru terisolasi melalui Playwright temporary di `/tmp/ict-wifi-qa` (tanpa mengubah profile pribadi/dependencies proyek). Semua request non-local diblokir pada harness.

`node /tmp/ict-wifi-qa/mobile-check.mjs`: synthetic fixtures berlabel; empty, invalid input, input/paste-compatible field, tap lookup, multiple bound/waiting+disabled, failed refresh/stale. Lebar 320/390/768 semuanya `scrollWidth === innerWidth`; input dan tombol 56 px (>=44 px). 0 uncaught page errors, 2 transport calls, 3 screenshots. Screenshot hasil diperiksa visual: label/value terbaca, tidak overflow, tidak ada klaim online. Evidence lokal (tidak di-Git): `/tmp/ict-wifi-qa/mobile-empty.png`, `mobile-results.png`, `mobile-stale-error.png`. Harness fixture tidak membuktikan konektivitas AP atau instalasi perangkat Android.

### APK dan exact assets

Artifact: `android/app/build/outputs/apk/debug/app-debug.apk`, **7,382,030 bytes**.

SHA-256: `d0de75ce8a2c0032f9e46fd1ae3c880acb011f98f427b6a0f041d34573e72dd0`.

Verifier membandingkan **11/11 file dist byte-for-byte** dengan ZIP `assets/public/`; 0 mismatch. Hanya tambahan Capacitor `cordova.js` dan `cordova_plugins.js`. Semua isi ZIP APK discan terhadap username/password diagnosis yang disimpan lokal: tidak ditemukan. Source scan tidak menemukan password diagnosis atau tambahan username diagnosis baru; beberapa kecocokan username sudah ada di HEAD pada berkas lama, tidak ditambahkan perubahan ini. Tidak ada artifact/generated assets yang dimasukkan Git. Detail lokal: `/tmp/ict-wifi-qa/artifact-verification.json`.

## Independent review dan verifikasi parent

- Review independen tidak menemukan blocker pada scope SSH pin/parser/read-only commands, shared authorization, cache/rate limit dan UI cancellation.
- Parent mengulang `npm test` (37 frontend + 72 backend passed), `npm run lint`, `git diff --check`, serta verifikasi 11/11 packaged assets dan SHA-256 APK; semuanya sesuai.
- Parent mengulang `/tmp/wifi-live-verify.py`: bound dan waiting masing-masing satu lease dengan `referenceMatches:true`, absent count 0, exit 0. Tidak ada mutasi router.
- Gap test nonblocking: test HTTP membership revocation saat ini setelah no-match, belum secara spesifik setelah positive cache terisi; fixture token WiFi tanpa sid belum menguji revoked-session secara khusus pada route WiFi. Shared session verification dipakai dan diuji suite existing; kedua tambahan ini tetap follow-up, bukan klaim telah diuji.

## Acceptance dan gate yang masih blocked

| Acceptance Phase 1 | Status / batas bukti |
|---|---|
| MAC normalization/invalid/missing, none/single/multiple, disabled/bound/waiting, pool vs active IP | PASS unit + HTTP/UI fixtures, bound/waiting/pool live readback |
| Source timeout/auth/identity/TLS, unauthorized/forbidden, rate limit | PASS automated failures; TLS pada LDAP, SSH identity pada RouterOS |
| Multiple lease tidak dipilih diam-diam, PII/secret safe | PASS; semua lease ditampilkan, field allowlist saja |
| UI empty/loading/result/error/stale dan mobile | PASS DOM + Chromium mobile viewport. **Native Android device smoke masih blocked** |
| Read-only proof dan limited live readback | PASS static operation allowlist tests + actual pinned readback + local browser/HTTP/router |
| Tests/lint/web build/debug APK/assets/checksum | PASS lokal; bukan distribusi/rilis produksi |
| Produksi | **BLOCKED**: akun layanan least-privilege read-only belum disediakan/disetujui, secret placement dan backend deployment belum diotorisasi. Policy setting harus ditinjau sebagai shared ICT gate dan LDAPS certificate verification aktif pada konfigurasi rollout. Jangan deploy akun personal |
| Real Android installation/login/keyboard/clipboard/network | **BLOCKED**: `adb devices` kosong; tidak ada perangkat/emulator target yang disetujui/tersambung. APK build tidak diklaim sebagai device test |
| Live LDAP-authenticated end-to-end | **Belum diverifikasi**; local E2E memakai fixture membership terisolasi, authorization middleware aslinya tetap dijalankan |

Backend produksi belum menerima endpoint ini; APK baru tidak membuat server menjadi tersedia. Jangan menyatakan Phase 1 rollout selesai atau memulai Phase 2 sebagai accepted sebelum gate terkait ditutup.
