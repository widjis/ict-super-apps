# Register Device — UI-only preparation evidence

## Scope and baseline

- User authorized continuing local Register Device validation/review/testing without VPN. This is a scoped Phase 3 UI-only sequencing exception, **not completed Phase 2 inventory or connected Phase 3 registration**.
- Entry source: `c27a0c4fc4a7c89d3a4a97035f3420106df28663`, branch `main`, origin `https://github.com/widjis/ict-super-apps`. Only `AGENTS.md` was dirty before this work; it was not edited/staged. No commit or push by implementer; parent review remains required.
- Read AGENTS, roadmap, handoff, contract, Phase 1 evidence, actual App/WiFi/Asset Management design tokens, directory implementation and existing MAC library. No production/VPN/auth/secret access or backend/router/AD/database mutations.

## Implemented behavior

- Register Device whole-card entry is enabled and explicitly **Preview / Not connected**. Lease Report stays native-disabled. Check Status and OCR source/behavior are unchanged.
- Register route owns a single sticky title/back to WiFi. Removed only its old generic Slate Nexus wrapper/spacer from App. Native-back route mapping is unchanged.
- Whole-input MAC format validation wraps the existing `extractMacCandidates` library: colon/hyphen/12-hex, unicast/nonzero, normalized local review. No extraction from arbitrary surrounding text and no auto-read/OCR claims on this preparation screen. Existing manual/paste and selected-SSID/randomized-MAC guidance remain available.
- Optional type/description are unverified drafts with 64/512 UTF-16-code-unit local limits. Control/format characters are rejected; values render as React text, never HTML. These limits do not settle production field choices or comment schema.
- Employee directory and category/pool are explicitly unavailable, with no arbitrary employee-ID input, privileged static choices or fake catalog. No expiry input. The existing directory endpoint is identified in the contract for future reuse, not called or faked here.
- Review and Edit draft are local only. No registration submit, transport call, registration success, verified owner or access claim. React screen memory only; leaving the route discards the draft. No MAC/notes persistence or logging was added.

## TDD and automated checks

Observed RED → GREEN before each production slice:

1. Local review regression failed because the old screen had no form; implemented whole-input validation and honest local review.
2. Optional bounded-text regression failed because the fields did not exist; implemented draft inputs, limits, control/format rejection and safe text rendering.
3. Actual App route and hub regression failed on the old Slate Nexus header/disabled Register entry; implemented scoped route header and honest preview navigation.

Regression coverage includes empty/invalid/zero/broadcast/mixed-separator/prefixed/multiple MACs; normalized review; optional omitted notes; oversized/control/bidi/zero-width notes; literal HTML rendering; unavailable directory/catalog and absent employee/expiry choices; no transport/storage; actual-route back/re-entry discarding state; disabled report. Existing lookup/OCR tests continue passing.

| Check | Actual result |
|---|---|
| `npm test` | **53 frontend + 73 backend tests passed**, zero failures; `/tmp/wifi-register-tests.log` |
| `npm run lint` | TypeScript `tsc --noEmit` passed |
| `npm run build` | Vite build passed, 1725 modules |
| `node scripts/run-gradle.mjs clean` | Passed; `/tmp/wifi-register-clean.log` |
| `npm run build:apkdebug` | Passed; `/tmp/wifi-register-apk.log` |
| `node scripts/run-gradle.mjs :app:testDebugUnitTest :app:lintDebug` | **24 native tests**, 0 failures/errors/skips; **0 lint errors / 18 existing warnings**; `/tmp/wifi-register-native.log` |
| `git diff --check` | Passed |

Android Studio JDK 21.0.8 and existing Android SDK were used. Existing Node module-registration/toolchain warnings remain. The Node/JSDOM harness imports React before installing the DOM; test-only no-op legacy input-event hooks prevent its focus-polyfill diagnostic. No production workaround or dependency was added.

## Actual App browser verification

`test/fixtures/wifi-register.html` / `.tsx` is a test-only entry that imports the actual App. It visibly labels the local fixture, stubs session restoration and fails/counts any transport use. It uses no real credentials, production auth bypass or fabricated registration response. It is not imported by production.

Chromium verification at **320×740, 390×844, 768×1024**:

- Document width equals viewport width in form/review; one h1 and one header back; MAC field 56px high.
- Native Space-key activation exercises invalid submit (focus returns to MAC), valid local review (focus moves to review heading), edit, back to hub and re-entry. Draft retained on edit and empty after leaving/re-entry. Lease Report stays disabled.
- **Zero session transport calls, zero `/api/` resource requests, empty localStorage/sessionStorage** in all three isolated fixture runs.
- Screenshots: `/tmp/ict-wifi-register-qa/idle-{320,390,768}.png`, `validation-{320,390,768}.png`, `review-{320,390,768}.png`, `hub-{320,390,768}.png`. Report: `browser-report.json` in that directory. Normal idle and narrow review were visually inspected for legibility, card alignment and focus indication.
- Initial harness Enter dispatch did not activate the native button; final keyboard verification uses Space. Two harness selector-quoting errors were corrected before the complete three-width run; neither was an application error. No claim of Enter-key or physical Android keyboard verification is made.

## APK for parent review/delivery

- Path: `android/app/build/outputs/apk/debug/app-debug.apk`
- Size: **50,798,808 bytes**
- SHA-256: **`f26161fd4ce80d5bd1b460b68c180541b911cbc6b3e5d247ac37d35f8a7b9ff2`**
- **11/11 current dist files byte-identical** to packaged `assets/public/`; no local fixture marker/path/content packaged. Manifest: `/tmp/ict-wifi-register-qa/artifact-verification.json`.
- This supersedes older APK hashes for this preview. Generated APK/assets are not staged. Parent should attach the verified APK to Telegram after review, not only send its path.

## Remaining gates

`open-questions-and-challenges.md` records category authority, live catalog, directory association/verification, device fields/comment format, explicit write authorization/test target/rollback, audit/idempotency/reconciliation and expiry-worker requirements. No arbitrary test registration was created. Phase 2 and connected Phase 3 are not marked complete.

`docs/openapi.yaml` remains absent/unchanged: no backend/API contract modification in this UI-only slice. Backend-comment deployment and physical Android preview/OEM/OCR acceptance remain separate and open. Local browser/native unit/build checks are not VPN, backend, router, physical-device or deployment evidence.
