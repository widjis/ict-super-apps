# Implementation roadmap

## Active: WiFi Phase 1 — hub presentation follow-up

Objective: match the existing Asset Management operations-hub language without changing lookup, OCR, authorization or backend behavior.

Sources: `wifi-network-contract.md`, `wifi-handoff.md`, `wifi-phase1-evidence.md`, existing `AssetsLicenseComplianceScreen.tsx`, user-supplied Asset Management screenshot.

- [x] Horizontal white cards, colored icon tiles, blue eyebrow and responsive typography using existing tokens.
- [x] Whole-card Check Status navigation; Register Device and Lease Report remain disabled with honest coming-soon labels.
- [x] 320px+ rendering, keyboard access and bottom-navigation clearance verified.
- [x] Regression tests, typecheck, web build, Android APK/assets/checksum verified.
- [x] Evidence and handoff updated.

Output: production WiFi hub component and debug APK; no backend/VPN/server changes. Phase 2–5 remain unimplemented. OCR physical-device gates and blocked backend-comment rollout remain open.

Challenge / verification: 48 frontend + 73 backend tests, 24 native tests, typecheck/build/APK/assets passed; browser fixture 320/390/768 geometry, keyboard and screenshots verified. See visual follow-up in `wifi-phase1-evidence.md`. Parent independent review and Git publication remain pending; implementation checklist completion is not a production deployment claim. This file was absent at task entry; it does not claim to reconstruct the project-wide roadmap. `docs/openapi.yaml` is also absent at task entry; this UI-only task does not introduce or change an API contract.
