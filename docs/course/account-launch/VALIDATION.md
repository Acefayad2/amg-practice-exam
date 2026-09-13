# Shared-code course validation — September 13, 2026

## Current target

The user chose one shared AMG access code with name/email progress tracking. Individual Identity accounts, passwords, signup confirmation and recovery are no longer the launch flow. This file keeps its stable location while separating replacement evidence from the earlier prototype.

## Verified for this reporting conversion

- `node scripts/qa/account-reporting.test.mjs`: **17 groups passed** against the actual Apps Script source and in-memory service doubles. The checks cover the exact version2 handshake, session-only envelope, rejection of old Identity payloads and cookie-injection strings, canonical report URL, protected-cookie forwarding, rejected unauthenticated/redirected responses, authoritative report validation, lock contention, header-only setup, formula-safe strings, missing scores, scored/simulation denominator separation, retry/update/separate-learner upserts, coordinator header protection and untouched historical Sheet1.
- No real course session, learner row or remote service was used by those tests. Source changes alone do not establish Google deployment or automatic reporting.
- The converted progress adapter passed **22** actual-source local checks, independently rerun. The final independent entry browser harness passed **24** checks against the real built login/course bundles with intercepted dummy services: wrong code, a non-JSON HTTP 429 response with wait/retry guidance, code masking/clearing, keyboard focus, expired gate recovery, normalized profile, learner binding, safe return destination, startup retry, malformed ready rejection and **zero Identity requests**. The final run covers the HTTP 429 refinement.
- Entry-browser bundle hashes remained stable during the run and matched current public files afterward: login `7bff98b07c2d2e705c8b352027c2ac05f0aed74f2eb4fb4c08a90bab4bb78454`; account `e12f1881c2cc61915faee80edd8e4f61b6a130dd955347d4ee8332339ebd19c8`. These are mocked-service UI checks, not real hosted cookie acceptance.
- The existing workbook already has the three empty reporting tabs. Preparation read back exact headers, formats, freeze counts, dimensions and hidden record-ID columns; all 999 intended data rows per new tab were empty. No permission changes or historical Sheet1 mutations were made. These stable headers remain unchanged by this conversion.
- Record grouping is explicitly documented as server-derived from normalized self-reported email, not verified email ownership or personal identity.

## Hosted shared-code preview verified

Preview deployment `6aa63f682b404d1fa29d9b4f` passed **42 actual-entry checks** using approved synthetic learners against real hosted services. The evidence is `output/qa/learner-live-entry.json`; it is local QA evidence, not a public learner-data export.

The real entry forms accepted the shared code, then name/email. Protected lesson access, transcript study and all eight required Part 1 answers reached durable server storage. The test verified original answer indices, first-answer dates/counts, attempt identity and explicit completion. Leaving the course cleared access; a second learner in the same browser inherited none of the first learner's progress. A fresh browser context restored the exact first learner record from the server without an unnecessary replacement write. No uncaught runtime errors occurred.

Every authenticated API observation reported `not_configured` for coordinator reporting. No Google Sheet write was attempted or proved by this run. The hosted preview result and the final local 24-check HTTP 429 refinement are distinct evidence; the local refinement does not imply another hosted run.

The shared-code course was published in production deployment `6aa64116875c3a1413f75eb7`, application commit `f19764c`. All **27 production smoke checks passed**: anonymous access protection, real code/profile entry, exact restoration of the preview-completed lesson, enabled optional practice tests, zero submitted practice attempts and cleared access after Leave course. No Identity requests or uncaught JavaScript errors occurred. See `../shared-code-review/production-review.json`. The practice dashboard made one expected review-import save; both exact synthetic records are removed after testing. This publishes durable course progress independently of the still-disabled Google Sheet connection.

## Regression protections to retain in the new client

The prior progress adapter fixed stale assessment snapshots borrowing newer cache revisions, save acknowledgements removing visible explanations, and premature Saved status for queued writes. Prior local tests also covered lesson completion/retry history, learner-key scoping, logout, late responses and uncertain-response retry payloads. Those protections remain relevant and the converted adapter is covered by the current local checks above. The earlier Identity-bound counts are not added to the shared-code validation totals. The final release receipt should bind the coordinated results to the deployed build.

Question identities, original answer indices, lesson versions, completion gates, scoring and authored teaching should remain unchanged by this access/reporting conversion. The final integration check must confirm that protection.

## Remaining release and Google verification

1. **Completed:** 27 production smoke checks passed against application commit `f19764c`, production deploy `6aa64116875c3a1413f75eb7`.
2. Complete the owner's Google **Verify it's you** passkey step. The owner has been asked to complete it; no completion reply was available at this documentation update. The bound editor still has the saved **version 1** reporting source. The **version 2** source remains local and is neither installed nor deployed.
3. After that verification, install/authorize version 2 and update the existing Apps Script web-app deployment. Confirm its exact service/version handshake and invalid-session rejection. `AMG_APPS_SCRIPT_URL` remains `pending_authorization` until the integration is safe to enable.
4. Perform an authorized actual Sheet-write test, verify the intended rows and any test-data cleanup, and preserve the existing workbook sharing unless the owner requests a change. Empty formatted tabs and local Apps Script tests do not prove live reporting.

The former Identity prototype's signup/confirmation requirements are superseded. They must not be reintroduced as requirements for the user-selected shared-code flow. Historical Sheet1 remains outside the reporting changes.

## Historical prototype evidence

The earlier individual-account prototype had local/preview checks for scoring, CAS conflicts, immutable submitted tests and mock spreadsheet upserts, plus temporary Identity accounts that were removed. Its commit and preview identifiers are retained as explicitly superseded history in `RELEASE.json`. It was not the shared-code release and does not prove the replacement has been deployed.

No video generation is part of this change. Compatible dependency patches from the earlier implementation remain; the previously recorded Vite/esbuild development-tool findings require a separate toolchain update if still present in the final dependency audit.
