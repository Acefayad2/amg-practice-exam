# AMG course access and progress reporting

This documentation keeps its existing path so coordinator links remain stable. The current flow uses one shared AMG access code, followed by the learner's name and email. The earlier individual-account/Identity prototype is superseded. The shared-code course is live at https://amg-exam-portal.netlify.app (application commit f19764c, production deployment 6aa64116875c3a1413f75eb7). The hosted preview passed actual entry and durable-progress checks. Google Sheets sync remains disabled.

## Learner flow

1. Open `/course/`. A visitor without a valid course session is sent to `/login/`.
2. Enter the shared **AMG access code**, then select **Continue**.
3. Enter your **full name and email**, then select **Start learning**. There is no individual password, account registration or email-confirmation step.
4. Watch each lesson or use its transcript alternative. Answer every required lesson question correctly and use the explicit finish step to complete that part. Practice tests remain optional and available anytime.
5. Return using the same AMG code and email to resume the corresponding learner record on another browser or device.
6. Use **Leave course** on a shared computer before another person enters their details.

The access code is checked on the server and must remain outside public source and browser bundles. The server issues the course session identified by the `__Host-amg_session` cookie. Progress writes and reporting require a valid server session; a posted name, score or completion claim does not establish one.

## What the learner ID means

The server normalizes the supplied email and derives a stable internal learner ID with a secret-key HMAC. That ID groups saved lesson progress and practice attempts. Names and emails are self-reported; this flow does not verify email ownership or the learner's identity. Someone who has the shared code and supplies the same email selects the same learner record. Agents should use their own consistent email, and coordinators should verify the name/email association when interpreting reports.

Local caches and write locks are scoped to the server learner ID. Earlier unscoped browser-only records remain untouched and are not automatically assigned to the next learner. Changing the shared code or server signing/HMAC secrets requires an explicit continuity/revocation plan; this document does not prescribe an unreviewed rotation.

## Existing Google workbook

[AMG Practice Exam Results](https://docs.google.com/spreadsheets/d/1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw/edit)

- **Sheet1:** historical exam results; left untouched.
- [**Course Progress**](https://docs.google.com/spreadsheets/d/1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw/edit#gid=1001): one current row per learner ID, including lesson completion, question mastery, latest activity and practice scores.
- [**Lesson Progress**](https://docs.google.com/spreadsheets/d/1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw/edit#gid=1002): one row per learner ID and lesson, including required-question results and resume position.
- [**Practice Tests**](https://docs.google.com/spreadsheets/d/1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw/edit#gid=1003): one row per submitted attempt. Timed scores exclude the ten simulation items.

The three reporting tabs have been created with empty data rows. Their existing headers remain compatible: the hidden **Account ID** column contains the internal learner ID, despite its historical label. It is not evidence of a verified account. No header rename or historical-data migration is part of this conversion.

Stable learner, lesson and attempt keys prevent duplicate rows on retry. Missing scores stay blank. Formula-like text is escaped. The server computes reporting metrics from saved records and the original answer keys; Apps Script fetches that authoritative report instead of accepting browser-supplied percentages.

Google reporting is a secondary copy of server-saved progress and is currently disabled. Course progress can save durably without the spreadsheet connection. Once reporting is enabled and verified, normal updates are coalesced for up to two minutes, with a shorter thirty-second interval for completion/submission events. The interface distinguishes progress saving from reporting status.

## Reporting protocol and deployment

Source: `scripts/google-sheets/Code.gs`, for the existing bound Apps Script project and existing web-app deployment. Its public GET handshake must return exactly the expected service **AMG Learning reporting**, `ok: true` and version **2** before the backend forwards a session.

The reporting POST body contains exactly `{action:'course_sync', sessionToken}`. The cookie-safe token has exactly two nonempty base64url segments separated by one dot and is at most 4096 characters. The report's learner ID is 64 lowercase hexadecimal characters. Apps Script uses that token only as the `__Host-amg_session` cookie on a GET to the fixed canonical `https://amg-exam-portal.netlify.app/api/learning?report=1` endpoint. It does not follow redirects, use an Identity token endpoint, accept a client-supplied destination or trust client-supplied report data. The token is neither written to the workbook nor logged by the script.

`setupCourseReporting` makes an unauthenticated GET to that same report endpoint and expects **401**. This requests Google's external-fetch scope and checks that reporting remains session-protected. It prepares/checks the reporting headers without creating learner rows.

**Current Google state:** the bound editor still contains the saved version 1 reporting source. Version 2 exists in this local repository; it has not been installed or deployed. Google's **Verify it's you** passkey step is waiting for the owner to complete it. This does not establish that Google's external-request authorization has been granted.

`AMG_APPS_SCRIPT_URL` remains `pending_authorization`. After owner verification, install the version 2 source, complete the required authorization, and update the existing web-app deployment. Verify the exact version 2 handshake and invalid-session rejection, then perform an authorized actual Sheet-write test before claiming automatic reporting works. Reuse the existing workbook and deployment endpoint; the earlier Identity-based reporting source must not receive the new session token.

## Release limits and validation

The shared-code preview passed **42 actual-entry checks**, including all eight required questions in Part 1, durable server saving, leaving the course, a second learner in the same browser and exact restoration in a fresh browser context. Reporting was disabled throughout. The final local entry refinement passed **24 browser checks**, including non-JSON HTTP 429 handling. See the [validation record](VALIDATION.md). The production deployment receipt is recorded in RELEASE.json; all 27 production smoke checks passed, including preview-to-production progress restoration, optional practice and leaving the course. Google Sheets acceptance remains pending.

The workbook's sharing settings were not changed by reporting-tab preparation. Any pending sharing decision remains separate. Course-route access does not provide DRM for externally hosted media. Course completion is a study record, not an official licensing result, a guaranteed exam pass or proof of approved education hours.
