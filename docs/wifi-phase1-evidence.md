# WiFi Phase 1 — implementasi dan evidence lokal/produksi

Status: **backend Phase 1 awal sudah dideploy; screenshot pengguna membuktikan lookup Android fisik berhasil. Follow-up comment/OCR sudah dibangun lokal, belum commit/push/deploy; OCR fisik belum diuji.** Implementasi dipublikasikan pada commit `119b34427a25b911eb6bcc46b0a58c67d448386e`. Pengguna mengizinkan rollout lanjutan dan secara eksplisit menyatakan “saya ijinkan kamu menggunakan akun pribadi saya” untuk akun MikroTik existing. Tidak ada migrasi, pembuatan akun, perubahan privilege, atau mutasi router/AD. Evidence rollout awal ada pada `260dd74788e36291d0fdda8a34c2977fa25b61be`; follow-up di bawah belum di-commit/push dan parent menangani publikasi setelah review independen.

## API dan keputusan keamanan

`POST /api/wifi/lookup`, body JSON `{ "mac": "02:AB:CD:EF:00:01" }` (contoh sintetis). POST dipakai untuk lookup read-only agar MAC tidak masuk URL/query/access log; endpoint ini tidak menulis ke router/database.

- Autentikasi JWT/session existing (`requireAccessToken`), kemudian rate limit, kemudian gate existing `requireAdUnlockAdmin` yang di-alias sebagai `requireIctSupport`. Middleware tersebut hanya membaca authorization, tidak menjalankan unlock/audit unlock. Reuse parser `LDAP_ALLOWED_GROUPS`: satu DN penuh atau semicolon-separated, bukan split koma. Tidak ada group/role baru atau client role claim. Empty/unset policy deny-all, akun harus ACTIVE dan direct membership diperiksa ulang melalui LDAP **setiap request**, termasuk sebelum cache hit. Ini shared policy dengan privileged AD operation; memperluas setting juga memperluas hak WiFi read.
- Respons selalu `Cache-Control: no-store` pada route WiFi, termasuk auth/error. Body atau raw error/komentar tidak dicatat oleh modul. Operator tetap harus melarang request-body logging pada reverse proxy/APM.
- 200: `ok`, normalized `mac`, `match: none|single|multiple`, array `leases`, `observedAt` ISO UTC, `stale:false`, `reachability:unknown`, `internetAccess:unknown`. Setiap lease punya `mac`, `server`, `configuredAddress` (IP atau null), `configuredPool` (pool atau null), `activeAddress` (IP atau null), `dhcpStatus`, `disabled`, `dynamic`. Follow-up menambah `deviceDescription:string|null` dari comment aktual, sanitized dan maksimal 512 UTF-16 code units. Tidak memilih lease pertama; tidak ada owner/hostname/expiry/uptime yang ditebak.
- Static lease berarti registered, bukan online. Disabled ditampilkan terpisah. DHCP bound/waiting berbeda dari reachability/internet. Pool Full/Limited tidak membuktikan enforcement atau mapping switch/SSID.
- 400 `INVALID_MAC`; 401 mengikuti auth existing; 403 `FORBIDDEN`; 429 `RATE_LIMITED` dan `Retry-After`; 503 authorization unavailable mengikuti middleware existing, atau safe source code `SOURCE_NOT_CONFIGURED`, `SOURCE_AUTH_FAILED`, `SOURCE_IDENTITY_FAILED`, `SOURCE_TIMEOUT`, `SOURCE_INVALID_RESPONSE`, `SOURCE_BUSY`, `SOURCE_UNAVAILABLE`. Unknown diagnostic disanitasi, bukan dilempar ke klien. Tidak ada kegagalan source/auth yang berubah menjadi `match:none`.
- Format MAC: six octets dengan seluruh delimiter colon atau hyphen, atau 12 hex; case/outer whitespace dinormalisasi. Mixed delimiter, multicast/broadcast, zero dan injection ditolak sebelum koneksi. Randomized unicast MAC tetap diterima.
- Limit per process: 20 lookup/actor/60 detik; maksimum 10.000 bucket aktif; 4 query router bersamaan; timeout SSH total 8 detik, maksimum respons 64 KiB/64 leases. Cache **positive-only**, maksimal 128 MAC/5 detik, waktu observasi asli tetap dipertahankan. No-match, network failure dan auth failure tidak dicache. Multi-replica rollout perlu rate limiter bersama atau pembatasan global di gateway; jangan menganggap batas ini cluster-global.

## Adapter nyata, bukan shell bebas

`backend/src/integrations/routeros/routeros.client.js` hanya mengekspor factory dengan satu operasi `lookup(mac)`. Tidak ada generic exec/path/action dari request. Satu template RouterOS tetap menjalankan `lease find where mac-address=<canonical MAC>` dan `lease get` untuk allowlist delapan field: MAC, server, address, active-address, status, disabled, dynamic, comment (tambahan follow-up yang diizinkan pengguna). `:foreach/:local/:put/:len/:tostr` hanya memformat output. Tidak ada add/set/remove/enable/disable/export, hostname, script lama atau inventory dump. Kebijakan awal yang mengecualikan comment diganti secara eksplisit oleh koreksi pengguna, bukan perluasan inventaris/pemilik.

Transport `ssh2` memakai SSH port 22 dan host-key SHA256 verifier, tanpa trust-on-first-use atau fallback insecure. Salah fingerprint ditolak sebelum autentikasi. Output length-prefixed diparse ketat dengan END marker; partial/error/unrecognized/mismatched MAC tidak dianggap hasil kosong. Koneksi timeout/error dihancurkan; late ready tidak mengeksekusi query. SSH dipilih karena identitas RSA sudah disetujui; tidak menggunakan API plaintext 8728. TLS-specific failure diuji pada jalur LDAP; ekuivalen identitas sumber RouterOS adalah SSH host-key mismatch, bukan klaim memakai RouterOS TLS.

Konfigurasi backend-only yang diperlukan: `MIKROTIK_HOST`, `MIKROTIK_USER`, `MIKROTIK_PASSWORD`, `MIKROTIK_SSH_FINGERPRINT`; semua contoh kosong di `.env.example`, tanpa secret frontend/Vite. Tidak ada perubahan CORS, LDAP parser/policy atau DB schema. Missing config menghasilkan unavailable, tidak fallback akun diagnosis. Pada verifikasi lokal akun personal hanya digunakan di proses terisolasi. Untuk rollout berikutnya, pengguna memberi **pengecualian eksplisit akun personal**: hanya `MIKROTIK_USER`/`MIKROTIK_PASSWORD` yang diperlukan dipindahkan melalui SSH tervalidasi ke runtime `backend/.env` produksi mode 0600, ditambah host dan pin yang disetujui. Tidak ada secret di env proyek lokal, image, APK, Git atau dokumen; seluruh file Hermes tidak disalin. Hak akun personal tidak diubah/dikurangi oleh deployment; service account least-privilege tetap tindak lanjut yang disarankan.

## UI

- Check Status menggunakan authenticated transport existing, form MAC dan paste native keyboard, petunjuk randomized MAC per SSID; tidak menjanjikan auto-read MAC. Follow-up menyediakan camera/gallery OCR Android dengan konfirmasi eksplisit, bukan QR Wi-Fi Phase 2B.
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

## Rollout backend produksi — 2026-09-17 WIB

- Host Docker `10.60.10.59`, checkout `/root/ict-super-apps`; SSH memakai existing known-host verification (reject unknown/mismatch). Checkout awal clean di `537e2baa212fd626eaa8f0896967ba4a0379613a`; fetch + SHA-check origin/main + `git pull --ff-only origin main` mencapai **`119b34427a25b911eb6bcc46b0a58c67d448386e`**, checkout tetap clean. Tidak ada reconciliation/discard file dirty.
- Sebelum perubahan, backup privat **`/root/ict-backups/wifi-phase1-20260916T223832Z`** (directory 0700, file 0600): `source.tar.gz` 3,842,548 bytes, `backend.env` 977 bytes, `backend-image.tar` 241,535,488 bytes, `database.dump` custom-format 14,352,783 bytes, `database-catalog.txt`, `containers-before.json`, `backup-evidence.json`. `pg_restore --list` berhasil dan memiliki TABLE DATA. Ini backup berjaga-jaga; **tidak ada migration/restore**.
- Build hanya `docker compose build backend_prod`; replacement hanya `docker compose up -d --no-deps --no-build backend_prod`. Tidak menjalankan compose down, recreate worker, atau service lain. Penambahan empat key MikroTik saja; seluruh existing container env termasuk CORS, `LDAP_ALLOWED_GROUPS`, LDAP/DB settings dibandingkan byte-for-byte dan **tetap sama**.
- Backend container baru **`28a1186bfb59bd0beb8e4bd4ce7c3d53c04dcac752ed147a0a202868d73eef6e`**, image **`sha256:95bc491a44517035f00a6d5276532185a2b0e047fe9525175b489c1a6dc9f73c`**, StartedAt `2026-09-16T22:42:13.238484496Z`. Image lama disimpan: `sha256:72eec5c557d6805a53a9ffa73e95f7a5f32ed422cf29f5c8a337b123ce0934b6`.
- Manifest **44 tracked backend source/package files** sama byte-for-byte dengan commit di host dan SHA-256 dalam container; `/app/.env` tidak ada di image/container filesystem. Secret hanya runtime environment. Probe config membuktikan semua empat key ada, pin tepat, tanpa mencetak nilainya.
- Snapshot mencatat **90 containers**. **89 non-backend containers mempertahankan ID dan image**, termasuk photo worker `3ba900d16a23652a6d8ab895463aa645ab8e8b2d5b317b92ea2142c4ab44999e`, image lama `sha256:72eec5c557d6805a53a9ffa73e95f7a5f32ed422cf29f5c8a337b123ce0934b6`, restart count 0. Worker tidak menerima env/router secret baru karena tidak direcreate. Tag image shared sekarang menunjuk backend baru; worker yang sedang berjalan tetap image lama. SonarQube existing crash-loop bertambah restart count 22677→22692 pada readback pertama, **ID/image tetap**; bukan deployment replacement.
- HTTP localhost produksi: `/health` **200 `{ok:true}`**; `POST /api/wifi/lookup` tanpa token **401 MISSING_TOKEN**, token invalid **401 INVALID_TOKEN**, keduanya **no-store**. Pemeriksaan ini mencapai listener produksi sebenarnya, bukan fixture route.
- Adapter/service dari **container produksi** dibandingkan dengan independent pinned-router per-field read: bound **1 lease/referenceMatches true**, waiting **1 lease/referenceMatches true**, synthetic absent **0**; observed `2026-09-16T22:44:18.056Z` dan `2026-09-16T22:44:18.740Z`. Semua operasi hanya find/get, tidak membuat lease. Tidak mencetak MAC/IP/komentar pemilik.
- Shared authorization middleware dari image produksi memakai **real LDAP service bind + ACTIVE/direct-membership read** untuk satu existing active app user dari query PostgreSQL read-only: allowed true. Ini tes gate terpisah, **bukan bukti user login/session maupun authorized HTTP lookup**. Tidak memalsukan token, membuat session, memakai password VPN sebagai password aplikasi, atau membuat akun.
- LDAP URL existing **LDAPS true**, `LDAP_TLS_REJECT_UNAUTHORIZED` efektif **false**. Konfigurasi tidak diubah diam-diam karena dipakai shared login/worker/AD paths. Koneksi terenkripsi tetapi identitas sertifikat LDAP tidak divalidasi; risiko ini tetap perlu penanganan CA/certificate terpisah. Pengecualian akun personal tidak berarti least-privilege telah tercapai.
- First pre-replacement config assertion berhenti karena `docker compose config --format json` merender literal dollar sebagai `$$`, bukan karena secret salah. Tidak ada replacement pada percobaan tersebut. Pemeriksaan diperbaiki agar membandingkan rendered escaping, kemudian actual container env diverifikasi sama persis dengan input secret. Tidak mengubah nilai secret.
- Helper **read-only** untuk parent: `/tmp/ict-wifi-deploy-venv/bin/python /tmp/ict-wifi-production-verify.py`; dependencies lokal `/tmp/ict-wifi-prod-probe.mjs`, `/tmp/ict_remote.py`. Helper memvalidasi host/router identity, commit/source/image/container/backup, per-container ID, actual HTTP auth errors, real gate dan bounded bound/waiting/absent router reads; tidak login/create session/mint token atau mutasi AD/router/DB. Output hanya metadata nonsecret, boolean/count/timestamp. Artifacts `/tmp` tidak durable dan bukan bagian Git.
- Rollback jika diperlukan dan disetujui: gunakan saved old image (load bila hilang), retag `ict-super-apps-backend_prod:latest`, pulihkan `backend.env` backup dengan mode 0600, kemudian recreate **hanya backend_prod** dengan `--no-deps --no-build`. Jangan merestore database atau merecreate photo worker; source archive dan previous commit tersedia untuk pemulihan source terpisah. Rollback belum dijalankan.

## Acceptance dan gate yang masih blocked

| Acceptance Phase 1 | Status / batas bukti |
|---|---|
| MAC normalization/invalid/missing, none/single/multiple, disabled/bound/waiting, pool vs active IP | PASS unit + HTTP/UI fixtures, bound/waiting/pool live readback |
| Source timeout/auth/identity/TLS, unauthorized/forbidden, rate limit | PASS automated failures; TLS pada LDAP, SSH identity pada RouterOS |
| Multiple lease tidak dipilih diam-diam, PII/secret safe | PASS; semua lease ditampilkan, field allowlist saja |
| UI empty/loading/result/error/stale dan mobile | PASS DOM + Chromium mobile viewport. Screenshot pengguna membuktikan lookup Android fisik; smoke OCR tambahan masih blocked |
| Read-only proof dan limited live readback | PASS static operation allowlist tests + actual pinned readback + local browser/HTTP/router |
| Tests/lint/web build/debug APK/assets/checksum | PASS lokal; bukan distribusi/rilis produksi |
| Produksi | **DEPLOYED dengan pengecualian akun personal eksplisit**; backup, backend-only replacement, exact image/source/env, API deny gate, real LDAP gate dan real router readback PASS. Shared LDAP policy/CORS tetap. LDAPS certificate verification existing **false**, belum diperbaiki; bukan klaim least-privilege atau TLS hardening selesai |
| Real Android installation/login/keyboard/clipboard/network | **KOREKSI PENGGUNA**: screenshot Android menampilkan hasil lookup nyata. `adb devices` lokal tetap kosong; agent tidak menjalankan smoke OCR/install APK baru atau menguji clipboard/keyboard secara fisik |
| Live LDAP-authenticated end-to-end | **Sebagian**: production service bind + fresh ACTIVE/direct-membership gate untuk existing app user PASS; flow user password login belum direproduksi oleh agent; screenshot pengguna membuktikan authorized lookup di app, bukan otomatisasi login oleh agent. Tidak membuat token/session diagnostik atau menganggap fixture sebagai login nyata |

Backend produksi sekarang menerima route WiFi; API tanpa token/invalid token terverifikasi 401 no-store dan adapter di container produksi membaca router nyata. Screenshot pengguna membuktikan authorized lookup berhasil di Android fisik, sehingga pernyataan lama “Android lookup belum terbukti” tidak lagi berlaku. Jangan mengklaim flow login telah diautomasi atau native OCR tambahan lulus sebelum gate tersisa ditutup. Phase 2 belum dimulai.

## Follow-up disetujui — deskripsi perangkat dan photo OCR (2026-09-17 WIB)

### Koreksi pengguna dan readback terbatas

- Screenshot pengguna diperiksa visual: Android menampilkan static lease enabled, status waiting, `DHCP_EMPLOYEE_VLAN63`, pool `EMPLOYEE - FULL_VLAN_63`, IP aktif belum dialokasikan/unknown. Ini bukti lookup bekerja pada HP fisik, bukan indikasi aplikasi gagal login. Screenshot tidak menunjukkan deskripsi karena implementasi awal sengaja tidak membaca comment. Branding global Slate Nexus tidak diubah dalam scope ini.
- Pengguna menjelaskan bahwa deskripsi registrasi ada dalam RouterOS comment dan meminta ditampilkan; izin read/display comment ini mengganti minimisasi awal hanya untuk ICT-only lookup. Tidak membuat association AD dari teks bebas.
- Literal MAC milik pengguna divalidasi format sebelum query. Independent pinned SSH read comment dibandingkan dengan adapter/service baru: **1 lease, referenceMatches true, descriptionsMatch true**, observed `2026-09-16T23:35:28.320Z`; status waiting, static enabled dan server/pool cocok. Nilai comment aktual disampaikan privat kepada pengguna, tidak disalin ke Git/evidence/fixture. Tidak ada router/AD writes atau akses server Docker pada follow-up.
- Helper parent: `/tmp/ict-wifi-deploy-venv/bin/python /tmp/ict-wifi-comment-verify.py`. Default hanya metadata/count/boolean/timestamp. Opsi `--show-comment` khusus menampilkan comment yang diminta pengguna, jangan redirect ke log publik. Credentials dibaca dari protected Hermes env, fingerprint approved diverifikasi sebelum autentikasi; bukan env proyek. Helper `/tmp` tidak durable.
- UI memberi label sumber `Device description (RouterOS comment)` dan peringatan bukan verified AD owner. Null/empty adalah Not provided; response backend versi lama tanpa field menunjukkan **Description unavailable — backend update required**, bukan mengklaim comment router kosong. Deploy backend baru tetap diperlukan agar APK baru menerima deskripsi di produksi.

### Implementasi OCR, privasi dan dependensi

- Plugin lokal Capacitor 8 Java `MacOcrPlugin`, didaftarkan oleh `MainActivity`. Bundled ML Kit Latin text recognition **`com.google.mlkit:text-recognition:16.0.1`**, bukan layanan cloud dan bukan placeholder JS. Kamera memakai Android camera intent dengan full-resolution private cache URI; galeri memakai OS `ACTION_GET_CONTENT` single image. Tidak meminta akses seluruh storage atau CAMERA permission karena capture dilakukan aplikasi kamera OS; grant/cancel/penolakan ditangani oleh pemilihan OS dan safe error. Device tanpa handler tetap manual/paste.
- **Koreksi setelah independent review:** jalur awal `InputImage.fromFilePath` ditolak (decode tanpa batas pada main thread dan SDK dapat mencatat URI). Jalur terkoreksi memakai `BoundedOcrImage` + `OcrImageInput` off-main, private copy maksimal 20 MiB, bounds-first subsampling maksimal 2048 px per sisi/4.000.000 pixel, EXIF dari private stream dan transform setelah subsampling, lalu hanya `InputImage.fromBitmap(bitmap, 0)` → recognizer. Model dibundel di APK, tidak memerlukan unduhan model pada first use. Parser JS hanya menerima MAC colon/hyphen/12hex eksplisit, unicast/nonzero, dedup/uppercase, tidak menebak O/0 dan tidak menerima substring identifier panjang. Maksimum OCR text 32.768 UTF-16 code units dan 32 kandidat. Pengguna memilih kandidat, bisa edit, lalu **Confirm MAC & Check Status**. Scan tidak memanggil API lookup otomatis.
- Bridge injeksi `scanImage` pada screen dan bridge injectable pada `scanMacImage` memungkinkan tests tanpa cloud/gambar pengguna. State/candidates hasil terlambat diabaikan setelah edit/unmount. Browser/iOS photo OCR tidak diklaim tersedia; tombol disabled, manual/paste tetap bekerja.
- App tidak mengunggah foto/teks OCR atau menyimpannya persisten; decoder membuat salinan galeri/capture privat sementara maksimal 20 MiB, kemudian menghapusnya. Hanya normalized MAC yang dipilih dikirim setelah konfirmasi ke endpoint existing. Foto capture dan salinan decoder privat sementara dihapus setelah success/cancel/error/30-second recognition timeout/destroy; startup menyapu file abandoned. **Batas retensi:** abrupt OS process kill dapat meninggalkan cache privat sampai startup berikutnya; app kamera/galeri eksternal berada di luar kontrol retensi ICT. Gambar asli yang dipilih pengguna tidak dihapus. File cache Android tidak termasuk backup normal.
- `loggingBehavior:'none'` menonaktifkan debug logging bridge Capacitor. Tidak menambahkan analytics, log OCR/MAC/comment, persisted URI grant, atau image fixture produksi. ML Kit menurut [Terms & Privacy](https://developers.google.com/ml-kit/terms) memproses input/output di perangkat tetapi dapat mengirim usage/performance metrics dan berkomunikasi untuk maintenance; disclosure ini terlihat di UI. Jangan mengklaim SDK tidak pernah melakukan jaringan sama sekali.
- Sumber integrasi: [ML Kit Android text recognition](https://developers.google.com/ml-kit/vision/text-recognition/v2/android), [Capacitor Android v8 plugin guide](https://capacitorjs.com/docs/plugins/android). ML Kit tunduk pada Google APIs/ML Kit terms (bukan klaim library berlisensi MIT). Robolectric test-only **4.17**, MIT menurut [published Maven POM](https://repo1.maven.org/maven2/org/robolectric/robolectric/4.17/robolectric-4.17.pom). Graph app dikunci di `android/app/gradle.lockfile`; tidak ada npm dependency baru.
- Security review menemukan advisory transitive Bouncy Castle pada Robolectric 4.16.1 awal: [CVE-2026-0636](https://nvd.nist.gov/vuln/detail/CVE-2026-0636) LDAP query injection dan [CVE-2025-14813](https://nvd.nist.gov/vuln/detail/CVE-2025-14813) GOST CTR. Sebelum delivery test dependency diupgrade ke 4.17, lockfile membuktikan BC **1.85** (di luar rentang affected <1.84), hanya unit-test classpath, bukan runtime APK. Tidak menjalankan broad upgrade dependency aplikasi/backend existing.

### TDD, build dan artifact follow-up

RED→GREEN nyata, sebelum implementasi terkait:

1. Service description `undefined` vs comment aktual → mapping; control/bidi/length sanitization gagal → sanitizer.
2. Adapter framed eighth field `SOURCE_INVALID_RESPONSE` → fixed allowlist comment; synthetic UTF-8 café frame teruji. Fixed read-only command prohibition tetap berlaku.
3. UI tidak menampilkan deskripsi → plain text source label/non-owner; backend lama salah dianggap kosong → explicit unavailable.
4. OCR parser/bridge export belum ada → parser konservatif dan Android bridge; camera button/candidate belum ada → candidate selection + editable explicit confirmation.
5. Late gallery result masih muncul setelah edit → generation guard. Empty/cancel/permission errors juga diuji tanpa private diagnostic. Satu run assertion DOM sempat menghabiskan waktu saat mencetak object React; diganti boolean assertion lalu failure terukur dan diperbaiki.
6. Native Robolectric: plugin tidak ada → invalid-source gate; camera/gallery tidak launch → intents; callback tidak ada → cancellation cleanup; recognition/result/error/cleanup belum jalan → ML Kit wiring + cleanup; stalled recognition tidak timeout → 30-second timeout/late-result guard. Android URI/intent/filesystem lifecycle nyata di Robolectric, **hasil engine ML Kit diinjeksi sintetis**, bukan klaim OCR gambar fisik lulus. FileProvider static cache di-reset antar Robolectric sandbox untuk isolasi test.

Gates sebelum review (historis; hasil native/APK digantikan oleh koreksi bounded decode di bawah):

| Perintah/pemeriksaan | Hasil follow-up |
|---|---|
| Baseline `npm test`, `npm run lint` sebelum edit | 37 frontend + 72 backend passed; lint exit 0 |
| `npm test` | **46 frontend + 73 backend passed**, 0 failed/skipped; `/tmp/ict-followup-tests.log` |
| `npm run lint` | `tsc --noEmit`, exit 0; `/tmp/ict-followup-lint.log` |
| `npm run build` / web build dalam APK script | Vite 6.4.1, 1725 modules, exit 0 |
| `node scripts/run-gradle.mjs :app:dependencies --write-locks` | Locked resolved app runtime/test graph |
| `node scripts/run-gradle.mjs clean` | BUILD SUCCESSFUL, 8 tasks executed |
| `npm run build:apkdebug` | BUILD SUCCESSFUL, 215 tasks: 186 executed, 29 up-to-date |
| `node scripts/run-gradle.mjs :app:testDebugUnitTest :app:lintDebug` | **8 OCR native tests + 1 existing test passed**; Android lint **0 errors, 16 warnings** pada existing manifest/resources/toolchain; `/tmp/ict-followup-native-final.log` |
| Chromium synthetic mobile fixture | 320/390/768 widths no overflow; input/submit 56px; camera candidate selection produced 0 lookup before confirm; 3 deliberate HTTP fixture calls; 0 page errors |
| `/tmp/ict-followup-artifact-verify.py` | **11/11 dist files byte-identical**, 0 mismatch/known router credential hits; native plugin present in DEX, **21 bundled model files**, packaged loggingBehavior none |
| `adb devices` | Empty; OCR/camera hardware smoke blocked on user device |

**APK unsafe sebelum review — superseded, tidak delivered, jangan didistribusikan:** `android/app/build/outputs/apk/debug/app-debug.apk`, **50,794,560 bytes**, SHA-256 **`b185106caa4123bd22e2b2c70b6896d32d52dbdfb504d595bf3c7340a6ad72cf`**. File pada path ini telah diganti clean rebuild terkoreksi di bawah. Manifest lama `/tmp/ict-followup-artifact.json` hanya evidence historis, bukan checksum APK terbaru. APK lebih besar karena bundled OCR model/native libraries multi-ABI; tidak dimasukkan Git. JDK Android Studio 21.0.8 dan SDK existing digunakan, tidak mengganti toolchain.

Mobile harness: `/tmp/ict-wifi-qa/followup-mobile-check.mjs`; screenshot sintetis `/tmp/ict-wifi-qa/followup-results.png` dan `followup-stale-error.png` diperiksa untuk keterbacaan (dua path hasil dari tiga capture). Bukan foto pengguna dan bukan hasil engine native. Independent review tetap gate parent; tidak ada commit/push/deploy dari implementer.

**Uji fisik tersisa sebelum menyatakan OCR selesai terverifikasi:** pasang APK baru; camera foto pengaturan HP lain dan galeri screenshot; uji airplane-mode recognition/model bundled, deny/cancel, foto blur/no-match, banyak kandidat, edit + confirm, background/process death dan cleanup; pastikan MAC dibandingkan dengan sumber gambar dan lookup tidak terjadi sebelum konfirmasi. Kamera/gallery provider OEM dapat berbeda. Screenshot pengguna sebelumnya membuktikan lookup Phase 1, bukan fitur OCR baru ini.

### Koreksi blocker native OCR — 2026-09-17 WIB

Review menemukan bahwa callback activity menjalankan decode SDK tanpa batas di main thread; timer main-looper tidak dapat memotong decode tersebut. `ImageUtils` SDK juga dapat mencetak URI saat gagal, walaupun logging bridge Capacitor dimatikan. Implementasi unsafe di atas **bukan artifact delivery**.

- Semua provider open/read, private copy, decode bounds/pixels, EXIF, dan pemanggilan recognizer sekarang berjalan pada satu worker process-wide. Atomic admission gate plus bounded queue mencegah job/provider macet menumpuk. Main thread hanya mengelola activity/result dan timeout 30 detik.
- Copy dibatasi **20 MiB** dengan checkpoint deadline/cancel sebelum/sesudah read. Header sumber ditolak sebelum pixel decode jika sisi melebihi **32.768 px** atau total melebihi **100.000.000 pixel**, untuk membatasi codec row/scratch work juga. Batas bitmap hasil decode **2048 px per sisi dan 4.000.000 pixel**, memakai power-of-two `inSampleSize` sebelum alokasi pixel. EXIF hanya membaca private bounded stream; delapan orientation dipetakan pada sampled bitmap, bukan full-resolution bitmap. Satu transform dapat sementara memegang dua bitmap bounded.
- File descriptor biasa dibaca pada worker; pipe/unknown-length API 30+ memakai nonblocking `fcntlInt` dan poll maksimal 250 ms per wait. **API 24–29 menerima regular-file providers tetapi menolak pipe/unknown-length providers secara aman** karena API publik nonblocking baru tersedia API 30; manual/paste tetap tersedia. Tidak memakai hidden API/reflection runtime atau fallback decode SDK.
- Provider `openFileDescriptor`, filesystem/FUSE, decoder native, atau SDK yang tidak kooperatif tidak dapat dipaksa berhenti secara aman oleh Java. UI tetap timeout; lane tetap occupied/BUSY sampai operasi sebenarnya selesai, sehingga tidak ada worker/bitmap baru yang menumpuk. Jika SDK tidak pernah selesai, bitmap bounded tetap dipertahankan dan scan berikutnya BUSY sampai process restart. Ini containment eksplisit, bukan klaim semua vendor call dapat diinterupsi.
- Timeout/destroy membatalkan token dan unlink private copy/capture tanpa recycle bitmap yang masih dipakai ML Kit. Bitmap baru direcycle setelah task SDK terminal; recognizer ditutup setelah task selesai. Callback memakai identitas call dan synchronization sehingga completion generasi lama tidak membersihkan/menyelesaikan call baru. Startup menyapu cache abandoned ketika tidak ada worker aktif.
- SDK hanya menerima bitmap melalui `InputImage.fromBitmap`; tidak menerima content URI/path. Provider exception tidak diteruskan ke logs/bridge. Synthetic revoked-URI lewat `ContentResolver` dan corrupt-image log capture tidak menemukan URI. Logging milik aplikasi provider eksternal bukan di bawah kontrol plugin.

TDD RED→GREEN diamati: decoder belum ada → native 6000×4000 PNG disubsample; header PNG sintetis 100000×100000 sebelumnya diterima → source-dimension/pixel cap sebelum decode; EXIF orientation 6 menghasilkan dimensi salah → transform; cancel API belum ada → cooperative cancellation/unlink; provider seam tidak berjalan off-main → worker/admission gate; privacy contract gagal pada `fromFilePath` → bitmap-only API; abandoned decoder copy tidak terhapus → startup sweep. Coverage tambahan menjalankan real native-graphics `BitmapFactory`, file-descriptor copy/decode, byte-cap/corrupt input, expiry sebelum read, blocked-read cancellation/unlink, revoked resolver, ML-task timeout tanpa premature recycle, late generation, serta BUSY selama provider macet.

**Batas harness:** Robolectric memodelkan pipe sebagai regular file dan tidak menjalankan kernel Android poll/read. Tes idle-pipe memakai shadow unknown-length untuk menguji control flow cancellation, bukan bukti kernel/OEM pipe IO. Tes bitmap memakai native graphics, sedangkan hasil engine ML Kit tetap task sintetis. Percobaan test barrier sempat bertabrakan dengan queue bounded; harness diperbaiki untuk menunggu slot dengan deadline, bukan memperbesar queue produksi. Android lint menemukan `fcntlInt` API-30 requirement; jalur older-API dibuat fail-closed, lalu lint lulus. Tidak menonaktifkan lint gate.

| Pemeriksaan akhir terkoreksi | Hasil aktual |
|---|---|
| `npm test` | **47 frontend + 73 backend passed**, 0 failed/skipped; `/tmp/ocr-full-test.log` |
| `npm run lint` | `tsc --noEmit`, exit 0 |
| `node scripts/run-gradle.mjs :app:testDebugUnitTest :app:lintDebug` setelah clean rebuild | **24 native tests passed** (11 decoder/input + 3 decode-boundary/lifecycle/privacy + 9 plugin + 1 existing), 0 failed/skipped; Android lint **0 errors, 18 warnings**; `/tmp/ocr-native-final.log` |
| `node scripts/run-gradle.mjs clean` | BUILD SUCCESSFUL, 8 tasks executed; `/tmp/ocr-clean.log` |
| `npm run build:apkdebug` | BUILD SUCCESSFUL, 215 tasks (186 executed, 29 up-to-date); `/tmp/ocr-apk-build.log` |
| `python3 /tmp/ocr-artifact-verify.py` | **11/11 dist files SHA-256 identical** to packaged `assets/public/`, 0 mismatch; only Cordova stub extras; corrected native classes in DEX; packaged loggingBehavior `none` |
| `git diff --check` | Exit 0; existing follow-up edits preserved |
| `adb devices` | Empty; no install/device OCR/production writes performed |

**APK terkoreksi untuk review parent, belum didistribusikan:** `android/app/build/outputs/apk/debug/app-debug.apk`, **50,794,660 bytes**. SHA-256 **`ccf87035efc37e309d3981c3f0ffcd1b42a8bdb8b756fdc97172b00917a457d6`**. JDK Android Studio **21.0.8**, SDK existing. Verifier mencetak manifest SHA tiap asset; helper `/tmp` tidak durable. APK/generated assets tidak dimasukkan Git. Tidak ada commit, push, deploy, router/AD/DB mutations atau output comment/secret pengguna pada perbaikan ini.

Warnings nonfatal: 16 lint warnings existing ditambah 2 rekomendasi menggunakan AndroidX alih-alih platform `ExifInterface`; platform parser min-API sesuai, input private dibatasi dan rotasi diuji. Toolchain Node/Gradle/Capacitor warnings tetap. Native decoder mencetak diagnostic generik untuk corrupt synthetic fixture, tanpa URI/path pengguna. Tidak mengganti dependency graph secara broad.

**Gate fisik tetap terbuka:** camera/gallery OEM (termasuk pipe/cloud provider), API 24–29 fallback, EXIF/mirrored photo, huge/corrupt images, actual SDK offline recognition, background/process death/cache retention, dan akurasi MAC pada foto pengguna. Parent review serta smoke APK terkoreksi harus selesai sebelum menyatakan OCR fisik terverifikasi.
