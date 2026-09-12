# Parts 27–32 browser validation

September 12, 2026. All six lessons passed the same Chromium workflow in paired runs recorded in `output/playwright/check-course-27-28.js`, `check-course-29-30.js` and `check-course-31-32.js`.

Each run checked matching media/duration, locked study and completion prerequisites, saved playback position after reload, the real native ended event opening questions, four-option feedback, a wrong-answer retry, every required correct answer, explicit completion, saved first-attempt mistakes, completion reload, loaded mobile captions, no horizontal overflow, a fitting mobile dialog and no page JavaScript errors. The completion test seeks near the end to test that event; it is not a claim of watching every video in real time. Full narration comparison, native layout frames and complete FFmpeg decoding were performed separately. Optional scene-analysis results and limitations are recorded in the media manifests.
