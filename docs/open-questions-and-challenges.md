# Open questions and challenges

## WiFi registration — next connected/write phase

The current Register Device preview is an authorized UI-only preparation exception. It does not register devices, select categories, verify ownership, or complete Phase 2 inventory. Do not use these questions to block safe local preview work, and do not interpret preview approval as write authorization.

1. **Category authority:** which existing application roles/capabilities can register each category, including privileged Full/Management and additional contractor/printer/TV pools? Confirm the server-side allowlist; group names alone are not policy.
2. **Live catalog:** implement/validate Phase 2 pool/server catalog, freshness and eligibility before selectable provisioning choices. Historical contract mappings are not a runtime catalog or end-to-end VLAN/SSID/access guarantee.
3. **Directory association:** reuse `/api/ad/users` rather than free-text employee IDs. Confirm required identity/active-employee checks, who can select on behalf of whom, and handling of visitor/contractor devices. Directory selection alone must not claim verified ownership without an agreed verification rule.
4. **Device fields / comment structure:** approve required vs optional fields, device-type choices and the RouterOS comment format/data minimization. Preview type/description are optional unverified notes with local 64/512-code-unit safety bounds, not an approved provisioning schema. Never infer AD ownership from a legacy comment.
5. **Write authorization and test target:** obtain explicit permission for mutation, exact user-approved test MAC/device, category/pool/server, rollback and readback plan. The existing personal router account exception authorizes read-only lookup, not writes.
6. **Write safety:** persistent intent/audit, backend RBAC and pool validation, idempotency, duplicate/concurrent submission handling, revalidation/readback, ambiguous timeout reconciliation and no unapproved existing-lease adoption/overwrite remain unimplemented.
7. **Expiry:** no duration input or enforcement claim before Phase 5 worker, scheduler handover and policy are implemented. DHCP lease-time is not registration expiry.

## Legacy comparison — unresolved evidence after contract alignment

- Confirm exact SSID case and AP/VLAN mapping: legacy help uses `MTI-01/02/03`, while the approved catalog preserves `mti-01/02/03`. Neither the help nor DHCP pool selection proves association or access enforcement.
- Obtain the deployed bot/workflow revision and scheduler ownership before migration. External n8n classification/authorization remains unreviewed; do not infer it from gateway help or dormant AI dispatch.
- No reviewed source establishes employee-to-category classification, structured employee/device comments or `DHCP_DISABLED`. Obtain the exact missing source if required; do not invent policy or extra provisioning categories.
- Contract alignment adds acceptance requirements, not implementation: shared-service authorization, strict MAC/comment validation, durable intent/idempotency/readback/reconciliation, and durable expiry with verified cleanup remain open.

## Separate open gates

- Phase 2 inventory and Phase 2B support-only QR are unimplemented.
- Backend-comment rollout remains pending; this task did not attempt VPN, login, server access or deployment.
- Physical Android preview/keyboard and existing camera/gallery/OEM/offline OCR acceptance require device testing; browser fixtures/native unit tests are not physical-device evidence.
- `docs/openapi.yaml` is absent. No backend/API contract changes in this slice; review/create the applicable API specification before connected implementation.
- Parent review, normal Git publication and APK delivery are separate gates. Pre-existing dirty `AGENTS.md` is outside this slice and must not be staged with it.
