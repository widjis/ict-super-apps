# WiFi legacy registration — read-only source re-audit

## Scope and decision

This is a sanitized source review, not production verification or permission to register a device. No application was imported or started; no network, SSH, router, AD, Redis or database operation was performed. The ICT contract is intentionally unchanged. Connected registration remains blocked on its existing approval and acceptance gates; the current UI is only a local preview.

**Correction to the earlier source scope:** the v2 project's `reference/index_old.js` is not the only local implementation. The sibling `whatsapp_api_n8n/index.js` contains a package-selected registration implementation. Its WiFi integration block is identical to the v2 reference after newline normalization, but its command authorization is materially different. Conversely, v2's `reference/index.js` is a webhook gateway, not that registration implementation. Do not conflate these three files or claim any one is the deployed bot.

**Exhaustive mapping found in the reviewed implementations: six category keys, six distinct pools, three distinct DHCP servers, and three VLAN numbers inferred from names.** There is no employee-to-category classification algorithm, structured employee/device comment builder, or `DHCP_DISABLED` branch in these source files. Those requirements cannot be reconstructed as proven legacy behavior without another source revision or the external n8n workflow.

## Evidence identities and citation convention

All paths below are relative to `/Users/widjis/Documents/Projects/`:

- **N** = `whatsapp_api_n8n/index.js`; repository HEAD `8c6ef6ea179f2c19345ab10ef6bbc232556ca2b6`. Package main/start selects `index.js` (`whatsapp_api_n8n/package.json:4-9`). This repository has unrelated dirty files, including package.json; they were preserved. N itself was not listed dirty.
- **R** = `whatsapp_api_n8nv2/reference/index_old.js`; containing repository HEAD `ba77239764e9452e44e5a44e03ee9ecb34c701eb`. This is **ignored local reference material**, not content pinned by that Git revision (`whatsapp_api_n8nv2/.gitignore:30-31`; verified with `git check-ignore`). The same applies to `reference/index.js`.
- **V** = `whatsapp_api_n8nv2/src/features/whatsapp/start.ts` at the v2 revision above. Package main/start uses `dist/index.js`; development uses `src/index.ts` (`whatsapp_api_n8nv2/package.json:5-10`). `src/index.ts:11-15` imports the WhatsApp gateway and HTTP routes. Local dist existence is not evidence of deployment or parity with current source.
- **C** = `ict-super-apps/docs/wifi-network-contract.md`, reviewed at ICT HEAD `24cca4c0a7b06d8a87da8cca70de7e5010902d74` before adding this report. The pre-existing dirty `AGENTS.md` was read and preserved.
- **P** = `ict-super-apps/docs/implementation-roadmap.md:3-19`: active phase is the authorized Phase 3 UI-only preparation exception, not connected registration.

Byte-level source fingerprints, computed locally without executing JavaScript:

| File | Lines | SHA-256 |
|---|---:|---|
| N | 8557 | `146ca1dccc05a99cf5f8deadbd7fb44246269b8a2f3a4d23d7d8803c55e8409a` |
| R | 7799 | `8cc2a875ef5e227d663986f809f619ab5caf3ed548b7f05b3ada37f699845921` |
| `whatsapp_api_n8nv2/reference/index.js` | 616 | `f22b256ef4926711858706ea25a90540de91666649b407f4f15b0a13162114af` |
| `whatsapp_api_n8n/index_old.js` | 7557 | `baf1679acd8dab64b445e16d92c4ba81013face033a25783b03b94373e803562` |

The normalized block starting at `//Mikrotik Integration` and ending before `// Schedule the update task` has SHA-256 `c25076d70cba6a04a45fe0313901873de42f19a059114a318884aee2bbdf7b98` in both N and R. This establishes equality of the mapping/add/expiry/report block, **not equality of the whole files or their callers**. All line citations refer to these inspected local contents.

No repository-local AGENTS.md was found in either n8n project. ICT's instructions and WiFi handoff, contract, evidence and active roadmap were read. Historical handoff claims were not treated as current live state.

## Entrypoints and dispatch

### Package-selected sibling implementation (N)

1. Incoming message event delegates to `handleMessage` (N:6328-6365).
2. Slash-prefixed text calls `handleChatBot` and returns **before** the conversational gating logic (N:4991-5032). `handleChatBot` contains an if/else chain, not a shared authorization wrapper (N:5264-5289).
3. `/addwifi` directly parses and calls `addWifiUser` (N:5537-5577). **There is no WiFi phone allowlist check in this branch.** A separate allowlist inside another command branch (N:5341-5367) does not protect registration. Group/own-message filtering for ordinary conversation at N:5016-5022 is not a WiFi authorization gate either.
4. `/pools` enumerates the mapping keys; `/leasereport` calls the Redis-backed report; `/checkwifi` calls the router lookup (N:5581-5602). `/movewifi` appears in help (N:4483-4485, 5272) but no corresponding active handler was found; help is not implementation.

### Ignored v2 reference (R)

R:5681-5709 **does** restrict `/addwifi`: extract a direct-chat phone JID, reject missing match, then require membership of `allowedPhoneNumbers`. That list is loaded from an environment setting (R:238). Group JIDs fail this extraction; it is not a role-aware group-participant check. This branch also checks pool/MAC presence before parsing. The shared `addWifiUser` function itself still has no actor or authorization parameter (R:1481-1531). R:5750-5771 exposes pool/report/check branches without the add branch's local gate.

### AI dispatch is present in source but not the current conversational call path

- N:4244-4255 parses assistant function arguments as JSON; N:4356-4364 passes them directly to `addWifiUser`. R:4625-4633 has the equivalent tool case. Neither shared mutation entrypoint enforces authorization, ownership or a category permission matrix.
- However, the helper containing that switch, `sendMessageAndGetResponse` (N:4204; R:4473), has no active caller in the inspected monoliths. Its other call occurrences are commented out (N:3072,3122; R:3341,3391). Therefore this is a **latent/unwired local AI mutation path**, not evidence that today's normal AI conversation executes it.
- Active `handleAssistantMessage` instead forwards a payload to an external n8n webhook and sends its returned reply (N:2900-2991; R:3158-3260). The workflow definition and deployed workflow version were not inspected. Registration/classification inside that external system remains unknown; absence from the gateway is not proof of absence in n8n.

### Current v2 TypeScript gateway

- V:3289-3299 sends slash commands to `handleCommand`; other messages use the conversational gateway. The command switch starts at V:2228-2239 and its default simply returns (V:3025-3027).
- WiFi names survive in help at V:729-734 and V:787-811, but no add/check/pools/report/move execution case or RouterOS provisioning helper was found in the scanned current source. The help text must not be interpreted as a working port.
- V:2096-2169 resolves an AD user and embeds it in the n8n payload; V:2211-2226 sends through the n8n integration. `reference/index.js:358-408` likewise constructs and forwards a webhook payload; it contains no local WiFi pool mapping.
- The fresh scan covered 18 current v2 `.ts`/`.js` source files and nine local dist `.js` files. WiFi hits in current source were command help and helpdesk classification text, not RouterOS registration. This is a source finding only, not a test of any deployed gateway or workflow.

## Complete code-derived category / pool / server / VLAN map

The two mapping objects were extracted programmatically from N and R, joined by exact category key, and compared. Both contain the following six rows (N:1161-1179; R:1418-1436). The slash prefix and pool spelling are significant.

| Exact category key | Lease `address` pool value | Lease `server` value | VLAN inferred from names | Historical C network / relay, NOT code-derived |
|---|---|---|---:|---|
| `/staff` | `VISITOR-STAFF_VLAN_64` | `DHCP_VISITOR_VLAN64` | 64 | `10.60.24.0/21` / `10.60.24.1` |
| `/nonstaff` | `VISITOR-NON_STAFF_VLAN_64_28` | `DHCP_VISITOR_VLAN64` | 64 | `10.60.24.0/21` / `10.60.24.1` |
| `/contractor` | `CONTRACTOR_VLAN_67` | `DHCP_CONTRACTOR_VLAN67` | 67 | `10.60.34.0/24` / `10.60.34.1` |
| `/management` | `VISITOR-MANAGEMENT_VLAN_64` | `DHCP_VISITOR_VLAN64` | 64 | `10.60.24.0/21` / `10.60.24.1` |
| `/employeefull` | `EMPLOYEE - FULL_VLAN_63` | `DHCP_EMPLOYEE_VLAN63` | 63 | `10.60.20.0/22` / `10.60.20.1` |
| `/employeelimited` | `EMPLOYEE - LIMITED_VLAN_63` | `DHCP_EMPLOYEE_VLAN63` | 63 | `10.60.20.0/22` / `10.60.20.1` |

Network/relay cells are explicitly attributed to C:37-42's earlier router snapshot, not inferred from JavaScript or revalidated now. No pool ranges, prefix lengths, gateway assignment, relay setup, next-pool traversal, free-address allocation or pool-capacity check appears in the provisioning routine. `_28` is part of the pool name; it must not be read as an independently implemented VLAN or prefix rule.

**VLAN selection versus VLAN assignment:** selecting a key selects a pre-existing pool name and DHCP server name. The write sends only `address`, `mac-address`, `comment`, and `server` to `/ip/dhcp-server/lease/add` (N:1253-1259; R:1510-1516). It does not send `vlan-id`, configure switch/AP tagging, change SSID, create an interface, set a relay, or move an associated station. RouterOS is left to allocate from the configured pool. Full/Limited/Management labels do not prove bandwidth, firewall or isolation policy.

### SSID and device-type hints — documentation inside source, not classification

N:4490-4496 help associates visitor staff/nonstaff/management with mobile phones on **MTI-02**, employee full/limited with laptops on **MTI-01**, and contractor with laptops on **MTI-03**. V:811 repeats this help. These uppercase legacy labels are preserved here; they are not normalized into C:78-80's lowercase `mti-01`, `mti-02`, `mti-03`, whose exact SSID spelling remains the contract input.

No code validates device type or SSID against the chosen key. There is no branch determining Full versus Limited from employee attributes, or Management versus Staff versus Nonstaff from title/grade/department. The caller supplies the category. The help hints are useful legacy evidence missing from the contract, but are not proof of AP configuration or an approved category policy.

### Explicitly investigated missing categories

- `DHCP_DISABLED`: no exact branch or mapping found in either monolith or current v2 source. Do not translate this into `DHCP_NETWORK`, a disabled lease flag, or an automatic rejection category.
- TV, printer/VLAN 62, contractor VIP and contractor CKB: no registration mappings found in these implementations. C:44 mentions historical inventory-only extras, without their complete pool/server/range map. This report does not invent those missing identifiers.
- `DHCP_NETWORK`, nonstaff chaining to `_29`/`_30`/`_31`, static-only state, printer server details and administrative enablement are router-inventory facts asserted in C:44, **not implemented source mapping branches**.
- Unknown `poolName` throws; there is no disabled-category fallback (N:1224-1231). A missing server lookup would use literal `Unknown`, but all six actual keys have a server mapping. There is no query validating target existence, active state or static-only configuration before write.

These negative findings are bounded to the inspected local sources. If the intended index.js has employee classification, special pools or `DHCP_DISABLED`, it is a different artifact/revision or an external workflow; obtain that exact sanitized source before treating such branches as legacy requirements.

## Employee lookup and comment semantics

- `/addwifi` takes pool, MAC and free-text comment; it does **not** call an employee directory or take an employee ID (N:5537-5567; R:5698-5736).
- Conversational enrichment calls `findUserByMobile` with a five-second race, falls back to a null user on failure, then still forwards the message (N:2910-2942). The helper searches AD by mobile and takes the first match, returning name, email, department and gender (N:3139-3164). This is sender context, not employee/device ownership verification or WiFi category authorization.
- Current v2 similarly caches `findAdUserByPhone` results (default 600,000 ms) and attaches them to webhook messages (V:291-306, 2123, 2167). No WiFi policy consumes them locally.
- The command splits on ordinary space, nonbreaking space or apostrophe. It removes `/days <value>` when the numeric check passes, rejoins the remaining words and trims. `/test` is recognized and removed only inside that valid-duration branch (N:5538-5557). This is not a robust quoted-field grammar; apostrophes and repeated spaces can alter parsing.
- `comment` defaults to an empty string for direct/helper calls. There is no structured employee ID/name/department/device-type schema, sanitization, length bound, ownership marker, or managed-operation ID (N:1224,1257). Help's “John Doe - Staff Member” is an example, not an enforced format. AI function arguments could provide arbitrary comment text if that dormant path were wired.

## Write, validation, duplicate handling and readback

1. Pool is selected from static objects; MAC processing only removes colons (N:1224-1234). Add lacks strict hex/unicast validation, case normalization, hyphen handling and bounded comment validation. N's command reads `parts[2].replace` before its local try block, so missing arguments throw rather than giving its intended local error reply (N:5538-5540,5559). R adds presence validation but still lacks strict MAC validation.
2. Add immediately connects and writes the lease. It does not pre-read duplicates, compare server/MAC ownership, hold a lock, persist intent, assign an idempotency key or distinguish concurrent retries (N:1252-1259).
3. The write response is assigned to `data` and not used. There is no lease-ID persistence or post-write readback; success is a message constructed from input values after the awaited command and optional Redis write (N:1254-1269).
4. Router success followed by Redis failure returns failure without rollback or durable reconciliation, leaving a possible actual registration. A retry can therefore repeat an ambiguous write. Connections close on the success path only, not in finally (N:1261-1273).
5. Separate `/checkwifi` accepts 12 hex digits after stripping colons/hyphens and queries a canonical colon-uppercase MAC. It selects the **first** lease and labels `address` as “IP Address”, even though add uses a pool name in that field. It does not establish online/reachability status (N:1482-1537). This separate command is not automatic registration readback.

## Duration, Redis TTL, report and scheduled cleanup

The active implementation must be distinguished from the commented older add function at N:1181-1222, which stored a timestamp without EX. The active add function is N:1224-1274 (R:1481-1531).

- Default duration is null: no expiration metadata is recorded. That is “no bot-managed expiry in this call”, not proof of a permanent production entitlement.
- Truthy duration is parsed with `parseInt`; normal mode uses local `Date.setDate`, test mode uses `setMinutes` (N:1239-1249). There is no positive/integer/finite/max-duration policy, consistent timezone policy, or rigorous AI-input validation. Fractional values truncate; invalid/negative/zero inputs are not safely specified. String `0` from the command differs from numeric zero in the helper. `/test` without accepted `/days` remains comment text.
- After router add, `wifi_lease_<colonless MAC>` stores only a timestamp with `EX=floor((deadline-now)/1000)` (N:1261-1264). Case/server/lease identity and original ownership are not retained; the key is MAC-only across servers.
- Cleanup runs every **10 minutes**, as the cron expression `*/10 * * * *` says, despite a nearby “every minute” comment (N:1412-1422; R:1671-1679). No overlap lock or handover guard appears.
- Cleanup obtains all `wifi_lease_*` with unbounded KEYS, then GET, formats pairs into a MAC and requires `deadline + 5000 < sweepStartTime` (N:1292-1312).
- **Confirmed logical expiry defect:** the only metadata key normally disappears at/before the deadline because of EX, while deletion requires it to remain readable beyond deadline plus five seconds. A normal overdue entry is therefore not discoverable. Adding a more frequent poll does not repair this contradiction. Pre-existing non-TTL records could behave differently, so do not claim no legacy deletion can ever occur.
- If eligible metadata remains, cleanup queries by MAC only and takes the first matching lease, then removes its `.id` (N:1312-1325). It does not verify the stored server, original ID, ownership, disabled/dynamic flags or a renewal revision. `deleteLease` retries three times immediately without backoff or deletion readback (N:1277-1289).
- After remove it deletes Redis metadata and sends a group notification in the same try block (N:1322-1331). Notification failure can be logged as deletion failure after deletion already succeeded. Missing-router-lease handling leaves the metadata in place (N:1332-1334). Outer errors can terminate the remaining sweep; no bounded per-item reconciliation exists.
- Lease report reads the same keys, includes only future timestamps and the first router match, and sends comment/expiry text (N:1347-1394). It is neither a complete registration inventory nor an expired backlog report; records lost by TTL cannot appear. Success-only close and verbose raw lease/comment logging add reliability/privacy concerns.
- Removing a DHCP lease is not a verified immediate station disconnect or internet-access revocation. No session/firewall/AP enforcement accompanies cleanup.

## Contract comparison — correction, omission or intentional new design

| Contract location | Assessment from this re-audit |
|---|---|
| C:11, “four screens still mock” | Stale unqualified baseline wording relative to C:3, the implemented lookup and P:3-19's preview. Keep as explicitly historical or correct in a separately approved contract edit. No edit made here. |
| C:16, reference-only expiry attribution | The expiry defect is confirmed, but attribution is incomplete: package-selected sibling N has the same active WiFi block. R is ignored reference content, not pinned by the v2 Git revision. |
| C:33-42, six-row mapping | Correct for the six code-defined categories. It is not an exhaustive router inventory. Add exact slash keys and source provenance if revised. Networks/relays must retain historical-router provenance, not be claimed as JavaScript-derived. |
| C:44, extra categories/chaining/static-only | Not contradicted by code, but not proved by this source audit. No additional provisioning branch was found, including `DHCP_DISABLED`. Need authorized inventory/source evidence, not guessed mapping. |
| C:28 and 70, VLAN/policy caveats | Correct and essential. Source chooses pool/server, does not assign VLAN/SSID or verify Full/Limited enforcement. |
| C:82, SSID-to-VLAN mapping unverified | Still correct for production. Omitted nuance: legacy help contains MTI-01/02/03 device/pool hints (N:4490-4496; V:811). Preserve these only as source hints and retain exact-spelling uncertainty. |
| C:112,119,128-132, employee association | Directory revalidation, verified ownership and self-service are **new ICT design**, not a port of addWifiUser. Legacy sender enrichment and free comment are not ownership. |
| C:111,158, comment schema | Correctly open. No enforced legacy employee/device template was found. Optional preview type/description limits are new local UI safeguards, not an approved router comment format. |
| C:24,122, category rights | New enforceable backend policy is required. Reference's phone gate is narrower than a role matrix, sibling N lacks that WiFi gate, and latent AI helper lacks an actor check. Do not inherit one branch's apparent authorization globally. |
| C:123-126, idempotency/audit/readback/reconciliation | Intentional new safety design, absent in legacy. The source does not support a claim that duplicates or successful writes are already verified. |
| C:119, no active expiry before worker | Correct. Legacy days/test options do not provide dependable enforcement and must not be copied to preview/registration prematurely. |
| C:134-142, durable PostgreSQL deadlines/worker | Intentional replacement design, not legacy parity. Must resolve managed ownership, renewal races, server/ID identity and scheduler handover. The TTL defect is not the only cleanup risk. |
| C:22,108-117, personal-account and UI-only restrictions | Unchanged. The personal-router account exception is read-only; this audit does not authorize registration, test leases, rollout or credential changes. |

## Decisions and unresolved evidence

1. Preserve the six mappings as **code evidence**, not a selectable production catalog or access entitlement. No extra category is approved by this report.
2. Do not implement VLAN mutation: the observed registration mechanism is static lease creation using an existing pool and DHCP server. End-to-end VLAN/SSID and policy verification is separate.
3. Do not transplant the legacy free-text/phone gating/expiry mechanism into ICT. The contract's actor policy, directory association, durable workflow, reconciliation and worker are deliberate new work requiring approval.
4. Obtain the exact intended source/workflow if employee classification, special pools, structured comments or `DHCP_DISABLED` are expected. This review cannot honestly report missing branches as present.
5. Still unresolved: which bot/workflow revision is deployed; whether another scheduler is active; external n8n AI tool definitions and authorization; actual special-pool names/ranges/server enablement; SSID spelling and AP mapping; access enforcement; approved role/category matrix and test device/rollback.
6. VPN/private-network state was not probed or repaired. Prior connectivity failure is historical context, not a new test result. Source conclusions and production conclusions remain explicitly separate.

## Verification and changes

Performed local Git revision/status checks; package/entrypoint inspection; narrow source reads with sensitive configuration lines omitted; programmatic mapping extraction and equality/count checks; source hashing; active-call versus commented-call inspection; and static comparison against the contract. No production data/credential values, auth usernames, passwords, tokens or connection strings are included here. No app tests/builds were run because importing or starting the monolith can initialize external integrations and jobs.

Only this report was added to ICT docs. No contract, roadmap, OpenAPI, application, secret, runtime setting or existing dirty file was changed. No commit or push was performed. OpenAPI is unaffected because there is no API or behavior change. Durable facts and their source references are contained in this report; no global memory or other profile was modified.
