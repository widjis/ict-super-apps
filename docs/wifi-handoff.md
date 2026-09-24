# WiFi ICT Super Apps — checkpoint untuk melanjutkan

## Latest documentation: legacy contract alignment

The user approved adjusting the contract after the legacy registration comparison. `wifi-network-contract.md` now corrects the historical mock-screen baseline and expiry attribution, records exact source keys/SSID hints with provenance limits, and adds explicit connected-registration and expiry safeguards. `implementation-roadmap.md` and `open-questions-and-challenges.md` are synchronized. Source evidence remains `wifi-legacy-registration-review.md`; its statements that the contract was unchanged describe the earlier read-only audit, not this subsequent authorized edit.

No category rights, employee classification, comment format or SSID/AP policy were invented. These decisions, scheduler handover, write authorization and live test targets remain open. No application/API/configuration changes, router calls, deployment or runtime tests in this documentation slice. `AGENTS.md` was already dirty and remains out of scope; the legacy review report was already untracked. Publication is not implied by local edits.

Next: resolve those policy/evidence gates before connected implementation; do not treat this documentation approval as permission for writes or live rollout.

## Previous: Register Device UI-only preview

- Baseline `c27a0c4fc4a7c89d3a4a97035f3420106df28663` on `main`; source changes are uncommitted pending parent review. Do not include the pre-existing dirty `AGENTS.md`.
- User authorized a scoped Phase 3 UI-only exception: navigable **Preview / Not connected**, MAC validation, optional unverified device notes and local review/edit. No submit API, owner verification, selectable catalog, expiry, persistence or writes. **Phase 2 and connected registration are not complete.**
- 53 frontend + 73 backend + 24 native tests passed; typecheck/web/clean debug APK passed; Android lint 0 errors / 18 existing warnings. Actual App fixture at 320/390/768 passed keyboard validation/review/edit/back, draft discard and zero API/storage checks.
- Latest APK: `android/app/build/outputs/apk/debug/app-debug.apk`, **50,798,808 bytes**, SHA-256 **`f26161fd4ce80d5bd1b460b68c180541b911cbc6b3e5d247ac37d35f8a7b9ff2`**; 11/11 dist assets match, fixture absent. Parent should review then send as a Telegram attachment. Older APK hashes below are superseded.
- Evidence/screenshots: `docs/wifi-register-preview-evidence.md` and `/tmp/ict-wifi-register-qa/`. Decisions for connected work: `docs/open-questions-and-challenges.md`. No VPN/auth/secret/server/production calls; backend-comment rollout and physical-device/OCR gates remain open.
- Sections below are historical checkpoints, not current publication/artifact status. Read the active roadmap and latest contract status first.


Checkpoint: 2026-09-17 07:32 WIB. Pengguna meminta jeda dan penyimpanan state. Jangan menjalankan pekerjaan otomatis dari dokumen ini; tunggu permintaan lanjut.

## Check Device Status terbaru — 2026-09-20 WIB
- Detail lookup kini senada hub: header route asli `Check Device Status` dengan satu back ke WiFi, intro/icon ringkas, form putih, Camera/Gallery icons, disclosure MAC/privacy, dan states konsisten. Generic Slate Nexus/duplicate Back dibuang hanya untuk route ini; native-back mapping dan seluruh lookup/OCR logic tetap.
- Baseline source `b61c321117e973743b41c6410ad9cbd1d0327366` main. Perubahan lokal belum commit/push; tunggu review parent. Jangan ikutkan dirty `AGENTS.md` pre-existing.
- Verifikasi: 50 frontend + 73 backend + 24 native tests, typecheck/web/clean APK build passed, Android lint 0 errors/18 existing warnings. Browser actual App fixture 320/390/768 serta keyboard dan synthetic result/OCR confirmation passed. Lihat evidence terbaru dan `/tmp/ict-wifi-status-qa/`.
- **APK untuk delivery setelah review:** `android/app/build/outputs/apk/debug/app-debug.apk`, 50,796,708 bytes; SHA-256 `e06083f7caa9f0a0857eda359772a15ce8590d2f2bc92384208ec630eee9a670`. 11/11 dist assets cocok, fixture tidak packaged. Hash ini menggantikan semua APK historis di bawah. Parent perlu kirim sebagai Telegram attachment.
- Tidak ada VPN/server/backend/native changes. OpenAPI absent/unchanged. Uji physical-device OCR/OEM dan backend-comment rollout tetap terbuka, bukan dibuktikan oleh fixture lokal.

## Follow-up hub sebelumnya — 2026-09-20 WIB
- Hub WiFi diselaraskan dengan Asset Management existing: horizontal white cards, colored icon tiles, Operations Hub eyebrow, Check Status aktif; Register Device/Lease Report disabled Coming soon. OCR/lookup/backend dan navigasi global tidak diubah.
- Verifikasi lokal: 48 frontend + 73 backend tests; 24 native tests; lint/typecheck/build passed, Android lint 0 errors/18 existing warnings. Browser fixture 320/390/768 tanpa horizontal overflow dan final content clear bottom nav saat scroll; bukan bukti integrasi/device fisik.
- APK terbaru menggantikan checksum historis di bawah: `android/app/build/outputs/apk/debug/app-debug.apk`, 50,795,324 bytes; SHA-256 `c76fc70266b84e86ea035f2d012003b97c20ba0441a1493e4d5676715f7f4e50`, 11/11 aset dist cocok. Kirim attachment setelah review parent; belum dikirim oleh subagent.
- Source/test fixture/evidence siap review parent; belum commit/push oleh subagent. Dirty `AGENTS.md` sudah ada sebelum pekerjaan, jangan ikut stage. Roadmap scoped baru ada di `docs/implementation-roadmap.md`; OpenAPI absent/unchanged, task UI-only.
- Tidak ada percobaan VPN/deployment. Backend comment belum deployed; gate OCR fisik tetap terbuka. Evidence rinci di bagian visual follow-up dokumen evidence.

## Baca pertama
- `docs/wifi-network-contract.md`: kontrak fase, scope dan otorisasi.
- `docs/wifi-phase1-evidence.md`: hasil tes, deployment awal, follow-up, serta blocker.
- Git/AGENTS dan keadaan produksi harus dicek kembali; snapshot ini bukan status live.

## Posisi pekerjaan
- Project lokal `/Users/widjis/Documents/Projects/ict-super-apps`.
- Origin `https://github.com/widjis/ict-super-apps`, branch `main`.
- HEAD/pushed implementasi terakhir `82660b9f0d4170a3e71701adfea633bd19f9f534`: comment perangkat + OCR MAC kamera/galeri.
- Phase 1 awal sudah produksi pada commit `119b34427a25b911eb6bcc46b0a58c67d448386e`. Commit `260dd74788e36291d0fdda8a34c2977fa25b61be` merekam rollout awal.
- Follow-up backend comment BELUM dideploy: percobaan terakhir gagal sebelum autentikasi karena VPN putus, Docker dan MikroTik timeout. Tidak ada perubahan produksi pada percobaan itu.
- APK follow-up sudah dikirim Telegram. Pengguna mengatakan 'So far so good'; ini feedback positif, bukan bukti pengujian semua skenario OCR fisik.
- Phase 2 dan selanjutnya belum dikerjakan. Phase 2B QR SSID ditujukan untuk IT Support, bukan publik/self-service umum.

## Yang sudah dibuat
- API `POST /api/wifi/lookup`, existing JWT/session + LDAP_ALLOWED_GROUPS (active membership fresh), read-only pinned SSH, bounded queries/cache/rate limits, none/single/multiple leases.
- Check Status asli, mock WiFi metrics dihapus, registrasi/report fase berikut unavailable.
- Follow-up: `deviceDescription` berasal dari DHCP lease comment, bukan pemilik AD terverifikasi. User menegaskan keterangan perangkat comment-based.
- OCR Android lokal via bundled ML Kit: ambil foto atau galeri, kandidat MAC, pilih/edit/konfirmasi sebelum lookup. Tidak auto-lookup, tidak upload gambar atau raw OCR. Manual/paste tetap tersedia.
- Review menemukan decoding gambar besar dan logging URI tidak aman; sudah diperbaiki menjadi bounded off-main decoder, InputImage.fromBitmap, private cleanup, cancellation/lifetime safety. Review ulang tidak menemukan blocker source-level.
- Batas: 20 MiB input, 100 MP/32768-side sumber, 4 MP/2048-side output. API24–29 menolak unknown-length providers; operasi vendor yang benar-benar stuck dapat membuat OCR BUSY sampai selesai/restart. Tes fisik OEM/engine masih terbatas.

## Hasil verifikasi terakhir
- 47 frontend + 73 backend tests passed, lint/build passed.
- Native: 23 tes OCR + 1 tes existing passed; reviewer mengulang selection 23 OCR, bukan seluruh 24.
- Android lint 0 errors, 18 warnings yang didokumentasikan.
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 50,794,660 bytes.
- SHA-256 `ccf87035efc37e309d3981c3f0ffcd1b42a8bdb8b756fdc97172b00917a457d6`.
- 11/11 aset dist cocok; plugin dan model bundled; known router credentials tidak ditemukan dalam artifact. APK lama b185106... superseded, jangan kirim.
- APK tidak di-Git dan dapat tertimpa build berikut; verifikasi hash sebelum kirim ulang.

## Produksi dan scope izin
- Docker `10.60.10.59`, project `/root/ict-super-apps`.
- MikroTik `10.60.0.3`, user-approved SSH RSA fingerprint `SHA256:2+8LMB4ELZu61rJFsD++hqZEakgb4X6UgqVBFJ5c7Dw`.
- User secara eksplisit mengizinkan akun pribadinya sebagai backend MikroTik; ini exception terhadap rencana awal akun layanan. Jangan buat akun baru/ubah hak tanpa izin.
- Secrets tersimpan di protected `/Users/widjis/.hermes/.env`: `MIKROTIK_USER`, `MIKROTIK_PASSWORD`, `MTI_DOCKER_SSH_*`. Jangan cetak/copy ke Git/APK. Baca langsung di proses helper dengan identity verification.
- Deploy backend saja; jangan mengganti worker foto atau container lain. Preserve env CORS/LDAP policy dan semua konfigurasi existing. Tidak ada izin mutasi lease/router/AD/VLAN/SSID/firewall dari scope read-only ini.
- Existing LDAPS verification false tercatat; jangan diam-diam mengubah shared production setting. Laporkan risiko terpisah.
- Backup rollout awal `/root/ict-backups/wifi-phase1-20260916T223832Z` mencakup source/env/image/DB.
- Image backend awal `sha256:95bc491a44517035f00a6d5276532185a2b0e047fe9525175b489c1a6dc9f73c`.
- Worker foto tetap image `sha256:72eec5c557d6805a53a9ffa73e95f7a5f32ed422cf29f5c8a337b123ce0934b6`; ambil baseline live baru sebelum rollout.

## Langkah berikut saat pengguna meminta lanjut
1. Baca kontrak/evidence/checkpoint, cek git/status dan VPN/internal TCP live. Jangan menganggap VPN sudah terhubung atau mengubah route tanpa scope yang jelas.
2. Jika reachable: backup baru source/env/image; pastikan remote dirty aman sebelum fast-forward ke commit implementasi terbaru. Tidak ada schema migration untuk follow-up ini.
3. Build/recreate backend saja; preserve env dan identity semua container lain.
4. Verifikasi source commit/container image, health/auth deny, pinned RouterOS readback termasuk sanitized deviceDescription; tidak dump PII. Jangan klaim deploy dari local adapter test.
5. Update evidence, commit/push dokumentasi dan verifikasi remote SHA. APK existing tidak perlu rebuild untuk perubahan dokumentasi/backend-only jika hash/source masih tepat.
6. Minta user cek description serta OCR pada perangkatnya bila diperlukan. Jangan mulai Phase 2 sebelum menutup/menyepakati acceptance Phase1.

## Helper sementara (cek keberadaan/isi sebelum dipakai)
- `/tmp/ict_remote.py`, `/tmp/ict_root.py`: koneksi Docker, inspect safely.
- `/tmp/ict-wifi-production-verify.py`: masih memverifikasi rollout awal berdasarkan backup marker lama; WAJIB disesuaikan untuk follow-up, jangan dianggap bukti rollout baru.
- `/tmp/ict-wifi-comment-verify.py`: local adapter vs router, bukan production backend.
- `/tmp/ict-followup-artifact-verify.py`, `/tmp/ict-followup-source-verify.py`: artifact/source checks.
- `/tmp/ict-wifi-deploy-venv/bin/python`: dependency environment helper.
- `/tmp` bisa hilang; rekontruksi dari code/docs bukan bergantung padanya.

## Preferensi delivery
Pengguna sering di luar meja laptop. Kirim APK sebagai attachment Telegram menggunakan MEDIA:absolute-path, bukan hanya menyebut path. Simpan credential di secret store; dokumen hanya referensi key. Fokus sisa pekerjaan penting sebelum melanjutkan fase besar; kuota terakhir dicek tersisa16%, reset19 September15:10 WIB (historis, cek ulang jika ditanya).
