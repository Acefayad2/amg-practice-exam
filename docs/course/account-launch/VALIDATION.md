# Account update validation — September 13, 2026

## Completed

- 56 local backend/Identity/Edge test groups passed, including server-side scoring, allowed records, account separation, stale-write conflicts, immutable submitted tests and reporting failure handling.
- 18 adapter checks and 32 browser checks passed against the real client bundles with isolated dummy service responses. These cover actual lesson/assessment controls, completion/restoration, wrong-answer retry history, stale-tab rejection, feedback persistence, sign-out and desktop/mobile layout.
- Apps Script tests passed: verified-source data, formula-safe text, blank absent scores, correct timed-test denominator, idempotent upserts, header mismatch rejection and untouched historical Sheet1.
- Actual Netlify preview: both confirmed synthetic accounts could sign in through the Identity API, open protected lessons and read their own empty account records. Cross-account save headers returned403. Reporting returned `not_configured` and made no Google writes.
- Real signed-out course/lesson/data requests redirected to login; unauthenticated progress API returned401. Public bundles do not contain the registration code.
- Existing workbook’s three empty reporting tabs were prepared and their exact headers, formats and hidden IDs verified by readback. All three tabs were also inspected visually at100% zoom. Sheet1 was excluded from every mutation.
- Two temporary account records and their62 allowlisted storage keys each were removed after the hosted API checks. The temporary admin test function is excluded from the reviewed source/deploy.

## Fixes found during review

Stale assessment tabs could previously borrow a newer cached revision; exact-snapshot conflict handling now prevents the overwrite. Save acknowledgements no longer close review explanations or result disclosures. Queued writes show Saving immediately.

The installed Identity2.0 SDK prefers its runtime operator token while retrieving a full user profile, then can fall back to JWT claims without email-confirmation data. A shared server wrapper retains the SDK-verified ID and retrieves only the same account’s full profile using the actual session cookie and a fixed Identity endpoint. Invalid tokens, mismatched IDs, revoked roles, redirects and unavailable profiles fail closed. This correction passed both unit tests and real hosted API/Edge checks.

The actual Netlify runtime gives top-level roles precedence during event serialization. The shared registration policy now aligns top-level roles and app metadata so an incoming empty role list cannot erase the course grant; eight checks passed through the installed runtime. CLI27.5.2 also drops typed event-subscription metadata during upload. The update uses a separate typed handler in each supported Identity event filename with one shared policy. Actual hosted event dispatch remains an explicit acceptance check.

The old reporting endpoint accepted legacy browser payloads. New reporting requires an exact service/version handshake before any authenticated POST, and its legacy environment fallback was removed. The endpoint remains deliberately disabled pending Google authorization/deployment.

## Not yet verified / pending

The final real-browser test with actual temporary credentials and saved lesson progress was blocked by automatic approval review before it ran. The owner was asked to approve that exact test; no equivalent test was substituted. The earlier browser checks use dummy service responses and must not be represented as this final integrated acceptance run.

Preview public-signup probes returned unconfirmed accounts without the expected role grant or access-code cleaning. Their course access stayed denied, and the accounts were deleted. Actual production registration-code enforcement and email-confirmation delivery must be checked before announcing this update as live. A manual admin confirmation does not prove email-token delivery or the signup event.

Google Apps Script source is saved in the existing bound project, but its new external-request scope still needs Google authorization and the existing web-app deployment must be updated. The Mac was locked and the authorization window was inaccessible to computer control. No automatic reporting is claimed.

Existing workbook sharing still allows anyone with the link; the owner has been asked whether to restrict it. No detailed agent data has been sent through the new reporting flow.

No production deployment has been made for this account update yet. The previous course remains live while the reviewed account update stays in preview. No video credits were used.

## Developer dependency note

Compatible dependency patches were applied. npm audit still reports two development-tool findings in the older Vite/esbuild toolchain; fixing those requires a separate major-version toolchain update. The deployed static assets do not expose the local Vite development server.
