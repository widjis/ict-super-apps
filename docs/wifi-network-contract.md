# Kontrak kerja WiFi & Network — ICT Super Apps

Status: Phase 1 diimplementasikan, diverifikasi lokal dan backend produksi sudah dideploy dengan pengecualian akun personal yang disetujui. Pengguna telah membuktikan lookup berhasil pada Android fisik melalui screenshot. Follow-up deskripsi RouterOS comment dan OCR foto native diimplementasikan lokal; belum commit/push/deploy dan OCR fisik masih menunggu uji pengguna. Phase 2–5 belum diimplementasikan. Lihat evidence Phase 1 di `docs/wifi-phase1-evidence.md`.

## Dasar persetujuan

Pengguna menyetujui rekomendasi alat operasional ICT terlebih dahulu: Check Status nyata, daftar pool/perangkat nyata, kemudian registrasi terkontrol dengan audit. Kepemilikan/self-service dan expiry worker menyusul. Dokumen ini menjadi sumber scope dan acceptance implementasi WiFi; perubahan scope harus dicatat dan disetujui sebelum dilaksanakan.

## Baseline dan batas bukti

- Empat layar existing masih mock: WifiNetworkScreen, RegisterDeviceScreen, CheckDeviceStatusScreen, LeaseExpirationReportScreen. Navigasi/state visual tidak berarti integrasi telah tersedia.
- Pemeriksaan read-only router 10.60.0.3 (DHCP-CCR-PYRITE, CCR2116-12G-4S+, RouterOS 7.12.1) menunjukkan DHCP terpusat via relay pada TO_CS9300_PO_E3/E4; management loopback 10.60.0.3/32; transit 172.60.0.6/30; default route OSPF ke 172.60.0.5.
- Tidak ada interface VLAN atau bridge VLAN pada router tersebut. Nomor VLAN berasal dari nama konfigurasi, bukan bukti konfigurasi switch/AP. Kebijakan Full/Limited, isolasi, bandwidth, dan VLAN end-to-end belum diverifikasi.
- Snapshot menunjukkan 3667 static leases dan 0 dynamic; ini bukan jumlah perangkat online. Angka snapshot tidak boleh menjadi konstanta UI.
- Seluruh rule filter yang diperiksa disabled, simple queue 0; ini tidak membuktikan tidak ada kebijakan pada perangkat jaringan lain.
- Implementasi bot lama di whatsapp_api_n8nv2/reference/index_old.js memiliki bug expiry: metadata Redis kedaluwarsa sebelum cleanup membutuhkannya. Jangan menyalin mekanisme itu.

## Arsitektur dan aturan wajib

Android/React -> HTTPS backend ICT dengan autentikasi existing -> adapter RouterOS terenkripsi dan tervalidasi identitasnya. PostgreSQL menyimpan workflow, kepemilikan terverifikasi, masa registrasi dan audit.

- Tidak ada secret router dalam APK, frontend, Git, log, respons API, atau dokumen. Default rollout menggunakan akun layanan hak minimum. **Pengecualian Phase 1 disetujui eksplisit pengguna: “saya ijinkan kamu menggunakan akun pribadi saya”.** Persetujuan ini mengizinkan akun MikroTik personal existing untuk backend lookup read-only dan rollout ini, bukan pembuatan akun, perubahan privilege, atau mutasi router/AD. Hanya pasangan secret yang diperlukan ditransfer melalui SSH tervalidasi ke runtime `backend/.env` mode 0600; tidak menyalin seluruh env Hermes. Risiko akun personal (hak aktual tidak dipersempit, rotasi/lifecycle terkait pemilik) tetap terbuka; akun layanan least-privilege tetap rekomendasi tindak lanjut.
- Reuse konfigurasi/auth/database existing. Settings tambahan hanya jika kebutuhan jelas; jangan mengganti CORS/LDAP policy untuk memudahkan pengujian.
- RBAC di backend; sembunyinya tombol bukan otorisasi. Phase awal ICT-only; capability read/register/update/revoke harus ditetapkan dari model izin existing, bukan ditebak dari nama group.
- Adapter memakai operasi terstruktur/allowlist, bukan interpolasi input menjadi perintah shell. Validasi MAC dan identifier; timeout, batas concurrency, cache pendek dan rate limit. Tidak menjalankan script lama atau dump seluruh konfigurasi sensitif.
- Aplikasi gagal dengan jelas jika sumber tidak tersedia: unavailable/stale beserta waktu observasi; bukan not registered, bukan sukses palsu.
- Registered, DHCP bound, reachability, dan akses internet adalah status berbeda. Jangan memakai uptime router sebagai uptime perangkat.
- Full/Limited adalah kategori pool sampai kebijakan akses terverifikasi. Registrasi DHCP tidak memindahkan VLAN/SSID dan pencabutan lease tidak menjamin disconnect instan.
- Android: jangan menjanjikan auto-read MAC. Input/paste dan panduan randomized MAC per SSID tetap tersedia. Tambahan Phase 1 yang disetujui pengguna: foto kamera layar pengaturan HP lain atau pilih screenshot dari galeri, OCR native on-device, kandidat MAC eksplisit tervalidasi, lalu pengguna memilih/mengedit dan menekan konfirmasi sebelum lookup. Tidak ada lookup otomatis, cloud upload gambar/teks OCR, atau koreksi karakter ambigu seperti O→0. Browser menyatakan OCR tidak tersedia.
- Semua perubahan existing lease perlu review/konfirmasi, verifikasi target ulang, audit, dan hasil readback. Jangan mengklaim transaksi atomik lintas PostgreSQL/RouterOS.
- Tidak ada bulk delete, ubah VLAN/trunk, firewall, NAT, DNS, atau jaringan core dalam kontrak ini.

## Katalog mapping awal (harus divalidasi saat implementasi)

| Kategori | Pool RouterOS | DHCP server | Network / relay |
|---|---|---|---|
| Employee full | EMPLOYEE - FULL_VLAN_63 | DHCP_EMPLOYEE_VLAN63 | 10.60.20.0/22 / 10.60.20.1 |
| Employee limited | EMPLOYEE - LIMITED_VLAN_63 | DHCP_EMPLOYEE_VLAN63 | 10.60.20.0/22 / 10.60.20.1 |
| Visitor management | VISITOR-MANAGEMENT_VLAN_64 | DHCP_VISITOR_VLAN64 | 10.60.24.0/21 / 10.60.24.1 |
| Visitor staff | VISITOR-STAFF_VLAN_64 | DHCP_VISITOR_VLAN64 | 10.60.24.0/21 / 10.60.24.1 |
| Visitor nonstaff | VISITOR-NON_STAFF_VLAN_64_28 | DHCP_VISITOR_VLAN64 | 10.60.24.0/21 / 10.60.24.1 |
| Contractor regular | CONTRACTOR_VLAN_67 | DHCP_CONTRACTOR_VLAN67 | 10.60.34.0/24 / 10.60.34.1 |

Pool tambahan TV, printer, contractor VIP/CKB harus terlihat pada inventaris jika berizin tetapi tidak otomatis menjadi pilihan provisioning. Pool nonstaff berantai ke _29, _30, _31. Keempat DHCP aktif (termasuk printer) static-only. DHCP_NETWORK disabled. Jangan mengubah kondisi ini.

## Phase 0 — Kontrak dan checkpoint

Output: kontrak ini serta ledger evidence per fase. Tidak ada perubahan runtime.
Acceptance: scope, batas keamanan, dependensi, fase, dan keputusan terbuka tercatat; dokumen diverifikasi dan dipublikasikan melalui Git normal.

## Phase 1 — Check Status nyata (read-only)

Output: kontrak API lookup MAC, adapter RouterOS, otorisasi ICT, layar cek nyata; hapus hasil sukses hardcoded dan istilah AD/hardware hash yang salah. Fitur belum terimplementasi ditandai belum tersedia, bukan spinner koneksi permanen.

Acceptance:
- Unit/integration tests: normalisasi dan invalid MAC, tidak ditemukan, satu/banyak lease, disabled, bound/waiting, address berupa pool vs active-address, sumber timeout/auth/TLS gagal, unauthorized/forbidden, dan rate limit.
- Lookup tidak memilih lease pertama diam-diam jika MAC muncul di beberapa server; tampilkan hasil yang jelas.
- API tidak membocorkan secret. **Koreksi pengguna: deskripsi registrasi berada di DHCP lease `comment`; pengguna mengizinkan membacanya dan menampilkannya sebagai informasi perangkat pada ICT-only lookup.** Allowlist ditambah `comment`, respons `deviceDescription` nullable, hapus Unicode control/format, trim dan batas 512 UTF-16 code units; render sebagai plain text. Ini catatan bebas RouterOS, bukan bukti pemilik/AD employee terverifikasi. Jangan tulis komentar/MAC/foto/OCR ke log atau persistent client storage.
- UI empty/loading/result/error/stale, input/paste dan akses mobile teruji. Pada follow-up yang disetujui, camera/gallery OCR perlu native build + parser/bridge/UI/lifecycle tests, serta smoke test fisik terpisah. Foto kamera hanya file privat sementara untuk handoff Android, dihapus setelah hasil/cancel/failure/timeout/destroy; cleanup startup untuk proses yang dihentikan OS. Galeri dibaca dari grant pilihan pengguna tanpa copy/persisted grant; gambar asli pengguna tidak dihapus. Batas: file capture dapat tersisa sampai startup berikutnya bila proses dibunuh; kamera/penyedia galeri eksternal dapat memiliki kebijakan retensinya sendiri.
- Buktikan adapter fase ini hanya read-only; live lookup terbatas dibandingkan dengan router tanpa memublikasikan PII.
- Tes/lint/build terkait lulus; APK debug diuji aset dan checksum jika fase dirilis. Status login/tidak tersedia tidak boleh dicache sebagai negative lookup.

## Phase 2 — Inventaris perangkat, pool dan peta jaringan (read-only)

Output: daftar berhalaman, pencarian/filter MAC/hostname/komentar/kategori, katalog pool/rentang/relay/gateway, refresh nyata dan waktu observasi. UI mobile memakai daftar/kartu yang terbaca.

Acceptance:
- Batas query dan cache/snapshot terukur; pagination stabil, tidak menarik seluruh inventaris ke APK untuk setiap pencarian.
- Bedakan registrasi dengan alokasi aktif. Saturation memakai data pool used yang valid, deduplikasi rentang/next-pool, penanganan cycle dan pool hilang; jika belum tersedia tampilkan unavailable, jangan estimasi dari jumlah static lease.
- Label VLAN sebagai mapping konfigurasi, bukan hasil discovery switch; no mock metrics.
- Test sumber mati, hasil parsial, filter, pagination, izin dan pool chaining; sampel live readback cocok.

## Phase 2B — Daftar SSID dan QR Wi-Fi (tambahan disetujui pengguna)

Ekspektasi: hanya IT/ICT support yang berhak dapat memilih SSID pada menu WiFi & Network (support-only, bukan self-service pengguna biasa), menampilkan QR Wi-Fi, lalu memindainya dari perangkat yang akan dihubungkan. Ini QR konfigurasi Wi-Fi standar, bukan barcode MAC atau QR registrasi DHCP. Implementasi dilakukan setelah Phase 2; tidak membuka seluruh inventaris ICT untuk pengguna biasa.

Katalog awal, ejaan harus dipertahankan persis:
- `mti-01` — gunakan pasangan password yang diberikan pengguna untuk SSID ini.
- `mti-02` — gunakan pasangan password yang diberikan pengguna untuk SSID ini.
- `mti-03` — gunakan pasangan password yang diberikan pengguna untuk SSID ini.

Password asli sengaja tidak dicantumkan dalam kontrak/repository. Pasangan dari pesan pengguna adalah input konfigurasi rahasia, bukan nilai default source code; simpan melalui mekanisme secret backend yang disetujui saat implementasi. Jangan mengganti karakter, memangkas password, menukar pasangan SSID, atau menyimpulkan pola password. Jenis autentikasi, hidden SSID, dan pemetaan ketiga SSID ke VLAN/AP belum diverifikasi; jangan mengasumsikan mti-01/02/03 sama dengan Employee/Visitor/Contractor.

Output:
- Daftar SSID berizin dengan tombol Tampilkan QR, nama jaringan yang jelas dan petunjuk scan melalui kamera/pengaturan Wi-Fi perangkat lain.
- QR dibuat dari SSID, jenis keamanan terverifikasi, password yang sesuai, dan hidden flag yang terverifikasi. SSID ditampilkan dari katalog konfigurasi, bukan diklaim hasil scan radio atau bukti sinyal tersedia.
- Untuk HP yang sama dengan aplikasi: panduan bergabung/manual tetap tersedia; kemampuan tombol Connect native harus diuji sesuai versi Android dan persetujuan OS. Tidak menjanjikan HP dapat memindai layar sendiri atau tersambung diam-diam.
- QR berisi kredensial yang dapat dibaca siapa pun yang mendapatkannya. Jangan menyebutnya terenkripsi atau sekali pakai. Ekspor/share/download QR tidak diaktifkan default; kebijakan distribusi dan hak melihat/reveal/copy password ditetapkan sebelum rilis.

Keamanan:
- Pisahkan secret Wi-Fi yang memang boleh disampaikan kepada pengguna berizin dari kredensial administratif router yang tidak pernah dikirim ke aplikasi.
- Tidak ada password atau payload QR nyata dalam Git, fixture, APK statis, analytics, access log, crash report, URL/query string, atau persistent client storage. Backend mengotorisasi setiap pengambilan secret; respons no-store, state sensitif dibersihkan saat logout/layar ditutup. Penampilan sementara dalam memori perangkat pengguna berizin diperlukan untuk merender QR.
- Backend menerapkan hak akses per SSID dengan policy yang disetujui; jangan menganggap semua akun login boleh mengakses semua PSK. Catat audit akses menggunakan user/SSID/waktu saja, tanpa password atau payload QR.
- Gagal mengambil kredensial tidak boleh menghasilkan QR dummy. Rotasi password tidak memerlukan rebuild APK; cache tidak boleh terus menampilkan kredensial lama setelah refresh/logout.
- Proteksi capture layar bila diterapkan hanya mitigasi; QR masih bisa difoto perangkat lain. Penghapusan akses aplikasi tidak mencabut PSK yang sudah diketahui pengguna.

Acceptance:
- Unit tests encoding/decoding QR menggunakan password sintetis dengan karakter khusus termasuk semicolon, colon, backslash, comma dan quote; round-trip SSID/password harus identik, tanpa menormalisasi secret. Verifikasi format QR dengan parser independen.
- Test pasangan tiga SSID, izin per SSID, unauthorized/forbidden, secret tidak tersedia, rotasi, no-store, logout, dan tidak bocornya secret di log/build artifact.
- Uji QR pada perangkat Android nyata: terbaca, nama SSID tepat, prompt OS sesuai, dan association berhasil pada SSID tersedia dengan autentikasi yang disepakati. Uji iOS jika dukungan iOS dinyatakan; tidak mengklaimnya lulus dari tes Android.
- Bedakan hasil association Wi-Fi, alokasi DHCP dan akses internet. Pada DHCP static-only, scan QR tidak otomatis mendaftarkan MAC atau menjamin IP/internet; arahkan ke Check Status/registrasi sesuai kewenangan.
- Tidak mengubah PSK, konfigurasi SSID/AP/VLAN, DHCP atau router sebagai efek menampilkan QR. Uji koneksi jaringan dilakukan pada perangkat yang disetujui, bukan membuat registrasi router tanpa izin.

## Phase 3 — Registrasi ICT terkontrol

Output: form existing tersambung backend, employee directory reuse, jenis perangkat, MAC, kategori yang diizinkan, komentar dan review/confirmation. Awal tanpa expiry aktif jika Phase 5 belum selesai; jangan menerima durasi yang tidak dapat ditegakkan.

Acceptance:
- Keputusan kewenangan kategori (Full/Management/Contractor dll.) ditutup sebelum implementasi write.
- Validasi pool-server, MAC, duplicate/concurrent submission, request idempotency, dan target DHCP aktif/static-only.
- Database operation intent/audit persisten sebelum mutasi; readback router setelah write. Timeout ambigu direkonsiliasi sebelum retry, bukan add ulang buta.
- Skenario router sukses/DB gagal dan DB sukses/router gagal dapat ditelusuri dan direkonsiliasi; state pending/failed/unknown eksplisit.
- Tidak overwrite/mengadopsi existing lease tanpa persetujuan. Uji mutasi nyata memakai perangkat/MAC, pool, dan rollback yang ditentukan serta diizinkan pengguna; tidak membuat registrasi uji sembarang.

## Phase 4 — Kepemilikan dan self-service terbatas

Output: Perangkat Saya, employee-device association, riwayat, permintaan registrasi/perubahan dengan persetujuan sesuai policy.

Acceptance: policy maksimum perangkat/kategori/approval disepakati; ownership terverifikasi; tes IDOR/akses lintas pengguna, employee inactive, perubahan pemilik, legacy lease unknown; pengguna tidak dapat memberi dirinya kategori privileged. Legacy import tidak menulis ulang semua lease atau menebak pemilik dari komentar.

## Phase 5 — Masa berlaku, perpanjangan dan worker

Output: expires_at persisten di PostgreSQL, report expiry nyata, renew/approval, worker bounded dengan lock, retry/backoff, graceful shutdown, audit dan observability. Notifikasi memakai mekanisme yang disepakati; tidak mengaktifkan kanal baru otomatis.

Acceptance:
- Pisahkan masa registrasi dari DHCP lease-time; legacy tanpa bukti diberi unknown, bukan permanent atau expired hasil tebakan.
- Worker hanya mencabut registrasi terkelola/terverifikasi; cek identitas MAC+server+lease dan revisi sebelum mutasi. Renew-vs-revoke race, job duplikat, restart, router offline, metadata mismatch, waktu/timezone dan expired backlog teruji.
- Metadata tidak terhapus sebelum aksi dan audit selesai; pending revocation != revoked. Bukan janji pemutusan sesi instan.
- Tidak boleh ada dua scheduler yang sama-sama mengelola lease yang sama; inventaris dan handover bot lama wajib sebelum aktivasi.

## Gate delivery setiap fase

1. Catat fase aktif, file/API/schema yang disentuh dan keputusan yang sudah ditutup.
2. Tulis regression tests sebelum implementasi; gunakan fixture terlabel untuk test, bukan hasil produksi fiktif.
3. Run unit/integration/UI checks, lint/build; review security dan diff, jaga unrelated work.
4. Update evidence ledger dengan perintah, hasil aktual, batas verifikasi, commit dan artifact.
5. Commit/push normal, verifikasi remote SHA. APK perubahan Android: build debug dengan toolchain existing, verifikasi packaged assets dan SHA-256; tidak commit artifact.
6. Produksi adalah gate terpisah: scope deploy/akun layanan/migrasi/backup/rollback harus dikonfirmasi. Approval kontrak bukan izin mutasi router atau rollout otomatis.
7. Jangan mulai fase berikut sebagai fitur selesai sebelum acceptance fase berjalan terpenuhi. Jika blocked, catat blocker; jangan mark passed.

## Keputusan terbuka sebelum fase terkait

- Phase 1: gate ICT memakai policy existing `LDAP_ALLOWED_GROUPS`, direct membership aktif di-refresh per request dan empty policy deny-all; transport SSH dengan fingerprint SHA256 wajib. Rollout backend dan penempatan secret telah dilaksanakan berdasarkan pengecualian akun personal eksplisit; akun layanan least-privilege menjadi tindak lanjut. LDAPS existing memakai certificate verification nonaktif, dipertahankan tanpa mengubah shared policy dan dicatat sebagai risiko belum diperbaiki.
- Phase 2B: hak melihat QR per SSID, jenis autentikasi/hidden flag, sumber secret backend, dan mapping SSID ke VLAN/AP; pasangan password dari pengguna tidak boleh masuk Git.
- Phase 3: allowlist kategori per role, kategori tambahan yang boleh diregistrasi, struktur komentar, perangkat uji yang disetujui.
- Phase 4: ownership verification, approval dan batas perangkat; layanan bisa diakses lewat mobile data atau wajib internal/VPN sesuai deployment existing.
- Phase 5: durasi maksimum/permanen, timezone tampilan, renew policy, kanal notifikasi, kepemilikan scheduler lama dan strategi handover.
- Firewall/core: terpisah, hanya diperlukan untuk klaim kualitas akses atau pencabutan instan; tidak termasuk implementasi DHCP ini.

## Evidence ledger

- Phase 0: dokumen kontrak dibuat berdasarkan persetujuan pengguna dan hasil inspeksi source/router. Tidak ada tes runtime atau perubahan router dalam fase dokumentasi ini. Referensi snapshot diagnosis lokal (tidak di-Git): /tmp/mikrotik-mapping-readonly.json; snapshot bisa hilang dan bukan sumber runtime aplikasi.
- Phase 1: implementasi lokal, TDD/unit/HTTP/UI, read-only live adapter dan browser→HTTP→router (directory fixture terisolasi), lint, web build dan APK debug telah diuji. Bukti, checksum, batas pengujian dan acceptance blocked tercatat di `docs/wifi-phase1-evidence.md`. Backend-only produksi telah dideploy pada commit `119b34427a25b911eb6bcc46b0a58c67d448386e` dengan backup dan readback; tidak ada mutasi router/AD. Screenshot pengguna kemudian membuktikan lookup di Android fisik berhasil; ini bukan bukti flow login telah diautomasi atau OCR native telah diuji. Follow-up comment/OCR hanya lokal, gate publikasi/deploy tetap menunggu review parent.
- Phase 2–5 termasuk Phase 2B QR support-only: belum dimulai; seluruh acceptance fase tersebut masih terbuka.
