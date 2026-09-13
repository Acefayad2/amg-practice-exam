# Shared-code course validation — September 13, 2026

## Current target

The user chose one shared AMG access code with name/email progress tracking. Individual Identity accounts, passwords, signup confirmation and recovery are no longer the launch flow. This file keeps its stable location while separating replacement evidence from the earlier prototype.

## Verified for this reporting conversion

- `node scripts/qa/account-reporting.test.mjs`: **17 groups passed** against the actual Apps Script source and in-memory service doubles. The checks cover the exact version2 handshake, session-only envelope, rejection of old Identity payloads and cookie-injection strings, canonical report URL, protected-cookie forwarding, rejected unauthenticated/redirected responses, authoritative report validation, lock contention, header-only setup, formula-safe strings, missing scores, scored/simulation denominator separation, retry/update/separate-learner upserts, coordinator header protection and untouched historical Sheet1.
- No real course session, learner row or remote service was used by those tests. Source changes alone do not establish Google deployment or automatic reporting.
- The converted progress adapter passed **22** actual-source local checks, independently rerun. The independent entry browser harness passed **22** checks against the real built login/course bundles with intercepted dummy services: wrong code, code masking/clearing, keyboard focus, expired gate recovery, normalized profile, learner binding, safe return destination, startup retry, malformed ready rejection and **zero Identity requests**. No product change or harness correction was required by that browser run.
- Entry-browser bundle hashes remained stable during the run and matched current public files afterward: login `79cd0afaca49393c91273a547b6f2952b5f49064df6780597e0a6dce646e5452`; account `e12f1881c2cc61915faee80edd8e4f61b6a130dd955347d4ee8332339ebd19c8`. These are mocked-service UI checks, not real hosted cookie acceptance.
- The existing workbook already has the three empty reporting tabs. Preparation read back exact headers, formats, freeze counts, dimensions and hidden record-ID columns; all 999 intended data rows per new tab were empty. No permission changes or historical Sheet1 mutations were made. These stable headers remain unchanged by this conversion.
- Record grouping is explicitly documented as server-derived from normalized self-reported email, not verified email ownership or personal identity.

## Regression protections to retain in the new client

The prior progress adapter fixed stale assessment snapshots borrowing newer cache revisions, save acknowledgements removing visible explanations, and premature Saved status for queued writes. Prior local tests also covered lesson completion/retry history, learner-key scoping, logout, late responses and uncertain-response retry payloads. Those findings remain relevant, but their previous Identity-bound test counts must not be presented as completed acceptance of the new session client. Rerun the focused tests against the final shared-code bundles and record their hashes/results after integration.

Question identities, original answer indices, lesson versions, completion gates, scoring and authored teaching should remain unchanged by this access/reporting conversion. The final integration check must confirm that protection.

## Required before claiming the replacement live

1. Verify the final shared-code server and browser flow: valid code/name/email entry, rejected wrong code, invalid/expired session denial, sign out, learner switching, stale saves and returning with the same normalized email. Confirm that no private code or signing key appears in public assets.
2. Verify actual hosted course-route protection and learner-scoped server storage using the approved test scope. Mocked API/browser tests do not prove deployed cookie behavior.
3. Install/authorize the version2 Apps Script source and update the existing deployment. Confirm the exact service/version GET handshake and rejected invalid-session POST before enabling the reporting URL.
4. Verify one authorized complete reporting path and any test-row cleanup. Keep learner data out of the workbook until its intended sharing/rollout policy is resolved by the owner.
5. Record the final application commit, production deployment and actual results in `RELEASE.json`. Do not inherit the earlier prototype's preview status as this release's status.

Google's external-request authorization and the existing Apps Script deployment were pending when conversion began. The old Identity prototype's public-signup event problem and confirmation-email acceptance are superseded by the user-selected shared-code flow; they are not requirements to bring back individual accounts.

## Historical prototype evidence

The earlier individual-account prototype had local/preview checks for scoring, CAS conflicts, immutable submitted tests and mock spreadsheet upserts, plus temporary Identity accounts that were removed. Its commit and preview identifiers are retained as explicitly superseded history in `RELEASE.json`. It was not the shared-code release and does not prove the replacement has been deployed.

No video generation is part of this change. Compatible dependency patches from the earlier implementation remain; the previously recorded Vite/esbuild development-tool findings require a separate toolchain update if still present in the final dependency audit.
