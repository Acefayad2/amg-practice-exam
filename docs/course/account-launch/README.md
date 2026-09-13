# AMG accounts and course reporting

## Agent flow

1. Open `/course/`; signed-out visitors are sent to `/login/`.
2. Create an account with full name, email, an individual password and the new private AMG registration code. Confirm the email, then sign in.
3. Watch each lesson or use its transcript alternative. Answer every required lesson question correctly to complete the lesson.
4. Resume with the same account on another browser/device. Practice tests remain optional and available anytime.
5. Sign out on a shared computer. Another account does not inherit this account’s progress.

The old shared password was present in the public repository and has been replaced. The new registration code is saved privately outside the repository.

The shared access code is validated only on the server during registration. It is never included in the public login bundle. Netlify Identity manages passwords and confirmation/recovery emails. Course access requires a confirmed account and the server-assigned `amg-agent` role.

## Same Google workbook

[AMG Practice Exam Results](https://docs.google.com/spreadsheets/d/1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw/edit)

- **Sheet1:** historical exam results; left untouched.
- **Course Progress:** one current row per agent, with lesson completion, question mastery, latest activity and practice scores.
- **Lesson Progress:** one row per agent and lesson, showing completion, required-question results and resume position.
- **Practice Tests:** one row per submitted attempt. Timed scores exclude the ten simulation items.

Stable account, lesson and attempt IDs prevent duplicate rows on retry. A missing score stays blank. Spreadsheet values are derived from authenticated saved records and the server’s original answer keys. Browser-supplied percentages are not trusted. Formula-like names are escaped before writing.

Google reporting is a secondary copy: course progress saves to the account even when the spreadsheet is temporarily unavailable. The interface distinguishes account saving from reporting status. Reports coalesce normal activity for up to two minutes, with a shorter thirty-second interval for completion/submission events. The workbook can therefore trail the account briefly.

## Migration and limits

Earlier browser-only progress has no verified account owner. It is preserved locally but is not automatically assigned to the next person who signs in. Historical spreadsheet rows stay where they are.

The login protects the course routes and progress API; externally hosted media URLs are not DRM-protected. Completion is a study record, not an official licensing result or proof of approved education hours.

The workbook’s existing sharing permissions have not been changed. At inspection it allowed access to anyone with the link; the owner has been asked whether to restrict this before agent reporting begins.

## Reporting deployment

Source: `scripts/google-sheets/Code.gs`, in the existing bound Apps Script project. It must be authorized and deployed as a new version of the existing web-app deployment, keeping its endpoint. Do not deploy a new unrelated workbook or endpoint.

Until that Google authorization/deployment is verified, `AMG_APPS_SCRIPT_URL` is deliberately set to `pending_authorization`. Account storage can operate independently. Restore the original endpoint from the existing deployment only after its GET responds with the expected AMG reporting service/version and an unauthenticated POST is rejected.

## Validation

Local checks cover authentication and role handling, account separation, stale-tab conflicts, uncertain-response retries, scoring, immutable submitted tests, reporting failures and spreadsheet upserts. Browser checks run in isolated contexts using synthetic records. Live service acceptance and final deploy details are recorded separately after completion.
