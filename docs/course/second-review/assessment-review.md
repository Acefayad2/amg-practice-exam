# Fresh assessment regression

Review date: September 13, 2026. Scope: the 32-question diagnostic, three 90-question timed forms, their 302 assessment items, saved attempts, delayed review and readiness recognition. Used the Playwright skill and isolated `amg-second-assessments` browser against the local public site on port 4186. The user's browser records were not touched. The already-passing512-question lesson walkthrough was not repeated.

## Result

**Passed: 6,410 source/data integrity assertions, 356 assessment-browser assertions 16 recovery/readiness assertions and 8 focused expiry-scroll assertions. No JavaScript runtime errors were recorded. The final expiry refinement was verified to reveal the current attempt’s result while preserving the reading position when a different background attempt expires.** A mobile navigation defect was found and fixed in `public/course/assessments/assessment.js`: intentional route changes and submission/expiry transitions now return to the top, where the prompt or result heading is visible. No shared lesson code, assessment questions/keys, media, build or deployment was changed.

## Fixed defect — P2: prompt and score hidden after mobile navigation

A fresh mobile page reproduced the issue: after scrolling the dashboard to Resume Timed Form A, the route retained `scrollY=970`; the question heading started at `y=-696`, entirely above the visible area. Submitting from that position also left the result score at `y=-583`. The controls and scoring existed, so the earlier functional assertions had not caught this presentation error. Visual inspection exposed it.

The fix resets scroll only for explicit route changes and transitions into submitted/expired results. It preserves ordinary answer updates, stored answers, timers, retake history and background storage synchronization. Added regression assertions require a scrolled mobile dashboard before Resume, then verify the viewport returns to the full question below its timer. Starting each form and entering manual/expired results are checked at the top as well.

The isolated local server's browser cache initially reused the old script. Final QA restarts the browser and disables HTTP caching for `assessment.js`, ensuring it tests the changed file. Before/after screenshots are `output/playwright/second-assessment-scroll-before.png` and `second-assessment-scroll-after.png`.

## Every assessment item checked

`scripts/qa/second-assessment-integrity.mjs` independently imports the authored modules and compares every published assessment item to the original row using its form/domain/item ID. It verifies all 302 unique IDs and prompts, correct lesson/domain/scored assignments, four distinct options, complete option-text preservation through shuffling, an in-range key identifying the exact authored correct option, and the full unchanged explanation. Every item's related lesson exists.

The script also verifies the published assessment review pool against the current 60 lesson-data files: 512 review IDs, current versions, counts, question text/options, original-index keys and correct-option explanations match. This checks the handoff between the lesson player's display shuffle and the assessment review pool without replaying the512 lesson questions.

| Form | Questions | Main-score items | AMG simulation items | Time | Scored domain allocation |
|---|---:|---:|---:|---|---|
| Diagnostic |32|32|0|Untimed|4 in each of 8 domains|
| A |90|80|10|105 minutes|24 /8 /14 /8 /11 /7 /6 /2|
| B |90|80|10|105 minutes|24 /8 /14 /8 /11 /7 /6 /2|
| C |90|80|10|105 minutes|24 /8 /14 /8 /11 /7 /6 /2|

The timed form size, duration and scored allocation are consistent with the [Prometric Maryland Life outline](https://www.prometric.com/files/mia/2027_life_producer_9.21.21.pdf) checked during the content review. The extra questions are clearly identified as original AMG simulation items after submission; they are not represented as actual Prometric questions.

Eight items mapped to foundation Parts 1/2 have empty direct `sources` arrays because those original pages keep sources in HTML. Their result still links to the related foundation lesson, whose source section is present. All other items carry direct related-lesson source references. The integrity check accounts for this existing structure rather than treating the lack of a duplicate sources panel as a grading defect.

## Actual assessment flow and scoring

Ran the forms through actual radio controls, navigation and the UI's submission path. The automatic-expiry case used an advanced test clock; no full 105-minute idle wait was needed.

| Form | Deliberate test answers | Expected and observed main score |
|---|---|---|
| Diagnostic |First answer wrong; remaining 31 correct|31 /32|
| A |Three scored answers wrong and all 10 simulation answers wrong|77 /80; separate simulation result0 /10|
| B |Five scored items unanswered at expiry; remaining scored answers correct|75 /80, automatically submitted as time expired|
| C |All scored answers correct; one answer also marked uncertain|80 /80|

For **every one of the302 result entries**, checked that the displayed question matched its data, the marked correct choice matched its key and the explanation exactly matched the authored explanation. Five scored answers were deliberately left unanswered in Form B to test that path; this is not described as answering every item correctly.

Also verified no explanations appear before submission, question marking survives forward/back navigation, clearing an answer works, the submission dialog counts unanswered items, and submitting locks the attempt. Reload retained submitted results. At question 18 of Form A, reload retained both the current answer and position and the same absolute deadline.

A retake of Form A created a separate attempt, retained the original 90-answer history, and was marked nonfresh. Leaving an open attempt showed a Resume action instead of silently creating another attempt or restarting its timer. A separate recovery case changed a saved start time to represent an attempt expiring while closed; reload submitted it immediately using its existing answers.

## Delayed review and readiness

- Incorrect assessment answers and a correct-but-uncertain answer entered the review queue.
- A missed first lesson answer entered review even after the learner's corrected retry completed the lesson.
- Due review selected another question from the same lesson, avoiding the original item when an alternative existed.
- A successful first review scheduled three days; the next successful stage scheduled seven days; a miss reset the stage and scheduled one day. Reload could not repeat an already-completed stage before its next due date.
- Valid complete states for all 60 lessons were recognized. Changing one required answer to an incorrect value reduced aggregate completion to 59, despite its saved complete flag.
- Same-day fresh forms did not meet the separate-day study target. With qualifying separate-day test timestamps and acknowledged misses/uncertain explanations, the stated target was recognized. Small-domain evidence was still labeled a small sample.
- The target remains an AMG study target, not an official passing score or a validated pass prediction. It requires the full course, at least 85% on two previously unseen timed forms on separate days and reviewed missed/uncertain explanations.

The separate-day and overdue-review cases use explicit saved-date fixtures. They test recognition and scheduling logic, not real learners studying over multiple days.

## Recovery and presentation

Two actual browser pages synchronized an answer without a repeated storage-write event loop. Malformed saved attempt records produced a recovery notice and did not block a new start. With storage writes blocked, the UI warned clearly and answer selection continued in memory. The study-record export produced the expected JSON download.

Mobile-sized viewport checks passed for the dashboard, question/navigator and submission dialog. The corrected 390×844 resume view is stored at `output/playwright/second-assessment-scroll-after.png`; the earlier inspection screenshot is retained separately. The technical regression is Chromium with viewport emulation, not physical-device Safari/Android testing.

## Evidence

- Summary: `docs/course/second-review/assessment-review-results.json`.
- All302 item-by-item source results: `docs/course/second-review/assessment-integrity-results.json`.
- Scripts: `scripts/qa/second-assessment-integrity.mjs`, `scripts/qa/second-assessments.js`, `scripts/qa/second-assessment-recovery.js`, `scripts/qa/second-assessment-expiry-scroll.js`.
- Full browser check lists: `output/playwright/second-assessments.json` and `output/playwright/second-assessment-recovery.json`, with corresponding `.log` files.
- Assessment-player SHA256: `0d08c2b976cbaef9f305a1f94cf953d6085a63bacdb065456e64574831205039`.
- Tested assessment-data SHA256: `a028e2a53612beef52875be2a356cb4768df45d44bfb3c7eecfaec487708baf0`.

This subtask verifies technical/data/key/explanation integrity and learner flows. It is not a new legal review of every 302 authored item's underlying rule, psychometric validation of difficulty, or proof of an exam outcome. Factual lesson reviews and the root media/deployment checks remain separate evidence.
