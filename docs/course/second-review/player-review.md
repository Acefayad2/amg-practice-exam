# Second course-player regression

Review date: September 13, 2026. Tested the local public course on `http://127.0.0.1:4186/`, served with Python's directory-aware HTTP server. Used the Playwright skill and the dedicated browser session `amg-second-player`. The user's in-app-browser tabs and progress were not used or altered.

## Outcome

**All 60 lessons and all 512 required questions passed.** The complete lesson flow produced **5,924 assertions**, followed by **12 passing edge assertions**. There were **zero JavaScript page errors and zero console errors** in the six final course batches, and no runtime exceptions in the edge pass. No product-code correction was needed during this regression.

The tests exercised the revised shared player's stable answer-display shuffle. Correct answer positions across all 512 displayed questions were A142, B120, C117 and D133. Original option indices remain the grading/storage values; the display letter is not used as the answer key.

Actual native video durations for the 60 published sources total **16,490.594 seconds — 4 hours, 34 minutes, 51 seconds**. This is video runtime at normal speed, excluding questions, reading, retries, assessments, breaks and review. All individual native durations matched their lesson manifest within one second.

## What was tested in every lesson

- Read the live lesson object and its own `data.version`; checked the page identity and correct versioned storage key, including the foundation lessons and later revised versions.
- Cleared only that lesson's state inside the dedicated QA browser; confirmed questions and completion initially locked.
- Loaded native video metadata from the published media source; verified the error fallback remained hidden on success.
- Sought to 40 seconds, refreshed, and verified the saved playback position resumed.
- Played the video's final fraction of a second and waited for the **actual native `ended` event** to open the required question dialog. No synthetic `ended` event was used.
- Submitted a wrong first answer, checked the corrective feedback, verified completion stayed blocked, refreshed and restored the same original-index selection, then retried correctly.
- Answered **every required question** through its actual radio control selected by its original answer value. Verified every displayed A/B/C/D label against its underlying option, every feedback-list label against the same option/explanation, and every correct-answer result.
- Verified that all mastered answers, the initial mistake, attempt count, native-ended flag and completion timestamp survived. Re-seeded the existing saved-state shape with an earlier timestamp and confirmed completed progress and its original indices still worked after the display-order change.
- Confirmed next-lesson access appeared after successful completion and persisted after refresh.
- At390×844, checked caption controls below the video, caption text at a real cue midpoint, hidden native track mode to avoid duplicate mobile captions, hide/show controls, lack of page horizontal overflow, dialog viewport bounds, answer review and keyboard-Escape focus return.

Mobile question screenshots for Parts1,2,20,40 and60 were also visually inspected. The headings, options, selection styles and feedback were readable within the scrollable dialogs. Screenshots are in `output/playwright/second-player-mobile-NN.png`.

## Additional edge checks

The course home displayed all60 lessons as complete using their saved dynamic-version states. A separate local test page then exercised Part60's transcript alternative, error-message presentation, required-answer gate and restart. Transcript study unlocked questions but did not itself complete a lesson. Restart cleared answers, first answers and attempts while retaining the recorded transcript study.

A second test page blocked browser storage. The player displayed the unavailable-storage message and continued grading a required answer correctly in memory. The saved completed state was restored after these isolated tests and the course home again recognized all60 completed lessons.

## Evidence and reproducibility

- Test implementation: `scripts/qa/second-player-review.js`.
- Summary: `docs/course/second-review/player-review-results.json`.
- Six passing batch results/logs: `output/playwright/second-player-01-10`, `11-20`, `21-30`, `31-40`, `41-50`, `51-60` with `.json` and `.log` extensions.
- Edge implementation and results: `output/playwright/second-player-edges.js`, `.json`, `.log`.
- Tested shared-player SHA256: `6f46b0fd97b4d578a5fd3049a71e9f30572a419848d108354c25ff9752c26bdf`.

To repeat a bounded batch, navigate the isolated QA page to a lesson URL with `?qaFrom=1&qaTo=10` (adjust bounds), then run the saved script using Playwright CLI's `run-code --filename`. The script defaults to all60 if bounds are absent and refuses a nonlocal origin. A helper that runs the remaining batches is saved under `output/playwright/`.

The harness required three corrections before the final passing runs: sample caption text inside a real cue rather than an intentional gap; scope checked inputs to lesson radios because Part2 also has a checked pooling checkbox; and await the asynchronous mobile media-query update after resizing. These were test-harness issues, not fixes to the course player. The final JSON batches are the release evidence; earlier failed harness logs are not counted as successful tests.

## Practical limits

This is a Chromium desktop browser regression with a mobile-sized viewport, not physical iPhone/Android or Safari testing. Seeking to the final fraction tests media completion behavior; it does not mean the reviewer watched the full4h35m in this pass. Audio accuracy, lip motion, transitions and visual defects are covered by the separate media review. The error presentation was triggered for a UI check; this pass did not emulate every network failure or prove recovery from every outage.

The only network request failures recorded in final batches were `net::ERR_ABORTED` cancellations during navigation/reloads; no page or console error accompanied them, and the actual tested metadata/playback/caption operations succeeded. This local regression does not replace the root reviewer's final production-deployment smoke check.
