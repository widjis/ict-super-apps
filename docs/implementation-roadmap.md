# Implementation roadmap

## Current documentation slice — legacy registration contract alignment

Objective: apply the user-approved source-review findings to the WiFi contract without application, API or infrastructure changes. Implementation phase remains the Phase 3 UI-only exception below.

Sources: `wifi-legacy-registration-review.md`, `wifi-network-contract.md`, `wifi-phase1-evidence.md`, `open-questions-and-challenges.md`.

- [x] Correct historical mock-screen wording and expiry attribution to both reviewed implementations.
- [x] Preserve exact category keys, pool/server provenance and legacy SSID hints separately from unverified live AP/access policy.
- [x] Make shared-service authorization, validation, duplicate/concurrency/readback/reconciliation and durable expiry acceptance explicit.
- [x] Preserve unresolved category/ownership/comment/SSID/scheduler decisions and read-only/write-approval boundaries.
- [ ] Connected registration, worker implementation and associated runtime acceptance remain unimplemented.

Output: documentation-only alignment; no backend/API change, no OpenAPI schema change, no deployment or router mutation. Verification performed: amendments compared with the cited source review; scoped Git diff inspected; `git diff --check` exited 0. Only the contract, roadmap, open questions and handoff were edited; pre-existing dirty `AGENTS.md` and untracked review report were preserved. No runtime tests/builds were run for these prose-only changes. Publication is separate from this local edit.

## Active implementation: WiFi Phase 3 — authorized UI-only preparation exception

Objective: provide useful local validation/review for Register Device without VPN, API submission, router writes, employee ownership claims or production category choices. The user's “Oke lanjutkan” authorizes this preparation slice only. This is an explicit sequencing exception, **not completion of Phase 2, Phase 3 registration or any prior rollout/physical-device gate**.

Sources: `wifi-network-contract.md` (Phase 3 and open decisions), `wifi-handoff.md`, `wifi-phase1-evidence.md`, actual App/WiFi/Asset Management screens, existing MAC parser and directory source (`UserManagementScreen.tsx`).

- [x] Navigable Register Device card with **Preview / Not connected**; Lease Report remains disabled.
- [x] Single actual-route header/back; existing Operations Hub tokens/cards; no global header changes.
- [x] Whole-input MAC validation using existing candidate library, manual/paste, local-only review/edit; no success or registration submission.
- [x] Optional bounded plain-text device type/description labeled unverified drafts; unavailable directory/category catalog; no employee-ID or expiry input.
- [x] TDD regressions; actual App browser fixture at 320/390/768, keyboard validation/review/edit/back and draft discard, zero API requests/storage.
- [x] 53 frontend + 73 backend + 24 native tests; typecheck, web build, clean debug APK, Android lint 0 errors / 18 existing warnings; 11/11 packaged web assets verified.
- [x] Contract, open questions, evidence and handoff synchronized.
- [ ] Parent review and Git publication (explicitly not performed by implementer).
- [ ] Physical Android preview/keyboard tests (not claimed from browser/native unit tests).

Output: local UI-only preview and debug APK, with **no registration backend integration**. Evidence and artifact hash: `wifi-register-preview-evidence.md`. Category rights, directory-backed association, comment format, approved mutation test device/pool/rollback, audit/idempotency/reconciliation and write authorization remain next-phase gates. `openapi.yaml` remains absent and unchanged because no backend/API contract changed.

## Previous: WiFi Phase 1 — Check Device Status presentation follow-up

Objective: align the lookup detail with the existing WiFi / Asset Management language, including its actual App route header, without changing lookup, OCR, confirmation, authorization or backend behavior.

Sources: `wifi-network-contract.md`, `wifi-handoff.md`, `wifi-phase1-evidence.md`, existing WiFi / Asset Management screens and user screenshots.

- [x] Route-scoped header with one named back action to WiFi; no global rebrand or native-back mapping change.
- [x] Compact icon-led form, accessible guidance/privacy disclosures, responsive controls and coherent idle/loading/error/results/OCR review presentation.
- [x] Actual App route regression and browser fixture; 320/390/768 geometry, keyboard disclosure/submit/back and synthetic result/OCR confirmation checked.
- [x] 50 frontend + 73 backend + 24 native tests; typecheck, web build, clean Android build and lint (0 errors / 18 existing warnings).
- [x] APK 11/11 dist asset equality, SHA-256 and no fixture content verified; evidence/handoff updated.

Output: local production UI code and debug APK ready for parent review. No commit/push, server/VPN changes, API changes or physical OCR validation. Challenge/evidence: see Check Device Status visual follow-up in `wifi-phase1-evidence.md`. Existing physical-device and backend rollout gates remain open.

## Previous: WiFi Phase 1 — hub presentation follow-up

Objective: match the existing Asset Management operations-hub language without changing lookup, OCR, authorization or backend behavior.

Sources: `wifi-network-contract.md`, `wifi-handoff.md`, `wifi-phase1-evidence.md`, existing `AssetsLicenseComplianceScreen.tsx`, user-supplied Asset Management screenshot.

- [x] Horizontal white cards, colored icon tiles, blue eyebrow and responsive typography using existing tokens.
- [x] Whole-card Check Status navigation; Register Device and Lease Report remain disabled with honest coming-soon labels.
- [x] 320px+ rendering, keyboard access and bottom-navigation clearance verified.
- [x] Regression tests, typecheck, web build, Android APK/assets/checksum verified.
- [x] Evidence and handoff updated.

Output: production WiFi hub component and debug APK; no backend/VPN/server changes. Phase 2–5 remain unimplemented. OCR physical-device gates and blocked backend-comment rollout remain open.

Challenge / verification: 48 frontend + 73 backend tests, 24 native tests, typecheck/build/APK/assets passed; browser fixture 320/390/768 geometry, keyboard and screenshots verified. See visual follow-up in `wifi-phase1-evidence.md`. Parent independent review and Git publication remain pending; implementation checklist completion is not a production deployment claim. This file was absent at task entry; it does not claim to reconstruct the project-wide roadmap. `docs/openapi.yaml` is also absent at task entry; this UI-only task does not introduce or change an API contract.
