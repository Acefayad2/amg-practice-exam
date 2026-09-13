# Final launch review — September 13, 2026

The course is technically ready for a licensing-coordinator-led pilot after two saved-progress fixes. Broad company rollout still needs recorded coordinator approval and real-agent pilot results. This review does not establish a guaranteed exam pass or that no possible glitch exists.

## Problems found and corrected

- **Completed lessons could be erased by an older open tab.** Lesson actions now apply to the latest saved attempt. Supporting browsers serialize simultaneous changes using Web Locks. An explicit Restart creates a new attempt that stale answers or completion actions cannot restore. Existing question identities, versions, original answer indices and valid saved completion are retained.
- **A later missed or uncertain answer could fail to restart review.** A distinct, dated miss now restarts the one-day review interval while retaining prior review history. Reopening an old attempt or completing the same lesson later does not repeatedly move its due date. New lesson first answers record their actual time; migration does not invent dates for legacy mistakes.
- Storage failure remains explicit. If existing disk data can be read but new writes fail, the open lesson keeps subsequent answers in memory rather than replacing them with the old disk record.

## Fresh validation

| Check | Result |
| --- | --- |
| Media availability | All 60 final video URLs responded successfully with nonempty metadata |
| Media and caption evidence | 841 grouped evidence checks passed; accepted media, captions, repair provenance and lesson question data match |
| Assessment data integrity | 6,410 assertions passed across 302 assessment items and 512 required lesson items |
| Full assessment browser regression | 356 scoring/attempt checks, 16 recovery checks and 8 expiry checks passed |
| New state regressions | 25 cross-tab/recovery checks, 24 recurring-review checks and 16 independent lesson-to-review integration checks passed |
| Mobile learner journey | 70 checks passed through Parts 1, 2 and 60, 24 required lesson answers, the full 32-question diagnostic and timed-attempt resume |
| Production build | Passed; only the two shared runtime scripts changed among the 209 public assets |

The mobile journey exercises real answer controls, wrong-answer explanations, retries, explicit Finish, native playback-end popups, the transcript alternative, refresh recovery and course-to-assessment navigation. The concurrency tests include forced-stale tabs, a held Web Lock, Restart, legacy records, readable storage with failed writes, and immediate pause followed by actual navigation. The browser runs reported no JavaScript errors. Test data lives only in isolated QA browser sessions.

The full-file media/transcript/decode work belongs to the accepted narration release. This fresh pass verifies those records and current availability; its playback-end tests seek to the video tail. It is not another continuous human watch/listen of all 4h34m23s. A stale supplemental loudness-report reference was restored from its exact preserved original; the final aggregate remains separately preserved. No video, caption or acceptance was altered by that evidence-path correction. No generation credits were used in this review.

## Conditions for wider rollout

1. Record licensing-coordinator approval and a small agent pilot, including comprehension, actual study time and issues encountered. The current mapping has all 48 outline subsections but no recorded coordinator approvals; mapping is not proof of learning effectiveness.
2. Before a cohort affected by October 1, 2026 sits its exam, approve a dated practice question applying Maryland's new general 120-hour survival rule and its exceptions. Part 33 already explains the change; its September-dated question and different-contract-period example remain correct as written. A [concrete original draft question](october-survival-practice-draft.md) is ready for coordinator review; it has not been added to live question arrays. This can be a website question without generating another video. [Enacted Maryland Chapter 509](https://mgaleg.maryland.gov/2026RS/Chapters_noln/CH_509_hb0596t.pdf)
3. Confirm that public pages and browser-local progress fit the company launch. This release does not provide private enrollment, a central completion ledger, cross-device progress, or a verified watch-time record. Physical iOS/Safari and learner pilot testing remain unrecorded.

Selected current teaching and exam facts were rechecked against primary sources, including the linked Prometric Life outline, Maryland licensing guidance and IRS retirement guidance. No newly confirmed materially incorrect current teaching or answer was found in those bounded checks. The review did not independently reread every question for every possible issue.

Web Locks coordinates supported live tabs. The fallback protects sequential stale actions but cannot promise atomic simultaneous writes across browser processes. Forced browser/OS termination can lose the latest playback checkpoint; storage-unavailable mode cannot survive reload. These are documented limits rather than a claim of centralized persistence.

Raw QA reports, transcripts and detailed diagnostic evidence remain local and excluded from Git. Reproducible focused browser harnesses are in `scripts/qa/`. The production verification receipt below records the deployed application and final live checks.


## Production verification receipt

- Application commit: [93a54bb](https://github.com/Acefayad2/amg-practice-exam/commit/93a54bb8073ba4b0300144b4b6078d4aa312a4c7), pushed to `main`.
- Netlify deploy: [6aa6063af91990c9a61a00f5](https://6aa6063af91990c9a61a00f5--amg-exam-portal.netlify.app/course/), confirmed as the published production deploy with state `ready`.
- [Live course](https://amg-exam-portal.netlify.app/course/): 70 full learner-journey checks, 25 cross-tab/recovery checks and 24 recurring-review checks passed after deployment, with zero JavaScript errors. The two production JavaScript files match the tested source hashes.
- The publishing build contains 212 canonical assets, all matching their corresponding local tested build files. Duplicate folders in a separate local generated-output directory were excluded by deploying the clean Git publishing checkout.
- Production assets: 148 match byte-for-byte. Each of the 64 affected HTML pages has the same 536-byte inert hosting comment/metadata exactly once inside its head; after removing that precisely reviewed addition, expected bytes match, with only the separately verified homepage link normalization. No executable script or visible teaching change was added. The initial strict mismatch report is preserved alongside the bounded disposition.
- All root-owned isolated QA browser sessions and the local QA server were closed after verification. No real learner records were modified.

The application publication is complete. Documentation-only commits after the application commit do not change the manual Netlify deployment. The coordinator draft remains pending review and does not alter current course questions.
