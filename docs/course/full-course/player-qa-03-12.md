# Lesson player verification — 2026-09-12

Chromium browser validation passed on Parts 3–10 and 12 using `output/playwright/check-course-batch.js`. These are functional checks, not proof of educational effectiveness or a substitute for content review.

Each of the nine pages passed:

- Correct lesson, playable media and manifest duration.
- Questions locked before study and completion locked before mastery.
- Playback position saved and restored after reload.
- Native video end opened the required question dialog.
- A deliberately wrong first answer showed explanations for all four choices.
- Retry and all eight required correct answers enabled completion.
- First error and attempt count remained separately recorded after mastery.
- Completion and timestamp survived reload.
- Mobile captions were placed below the video; page and dialog fit a 390 × 844 viewport.
- No page JavaScript errors were reported.

The earlier detailed Part 3 run also checked Escape, unfinished-question resume, fresh attempts, caption toggle and transcript study without falsely marking the video watched. Part 3 was allowed to play naturally to the end in the in-app browser. The batch checks seek near the end before allowing the native ended event; they do not claim nine complete human viewing sessions. Video review separately includes full decode, section transcription comparison, rendered-frame inspection and scene analysis.

The mobile caption button had insufficient contrast while hovered. Its foreground and background now remain dark-on-white, including hover. Additional checks for storage unavailability and the final course/assessment flow remain separate.

Part 11 subsequently passed the same browser checks with all ten required questions and no page errors.
