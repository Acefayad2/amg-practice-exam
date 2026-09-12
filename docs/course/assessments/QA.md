# Assessment acceptance

September 12, 2026. Four original forms: 32 diagnostic items plus three 90-item timed forms (302 distinct stems). Each mock has 80 scored questions at domain counts 24/8/14/8/11/7/6/2 and 10 additional simulation items. Answer positions are shuffled and balanced. No exact stems repeat across the assessment forms or required lesson questions. Question facts and reasoning were reviewed against the course source ledger; this is editorial review, not an empirical validation of difficulty or pass prediction.

The browser completed all 302 questions across the four forms. Controlled mistakes, simulation misses and unanswered items produced the expected results: 31/32 diagnostic, 77/80 A with 0/10 simulation, 75/80 B on automatic expiry, and 80/80 C. These are synthetic QA attempts, not student outcomes.

The 44 primary checks cover answer/flag navigation, changes and clearing, no premature feedback, absolute timer and refresh recovery, manual and automatic submission, scoring, all explanations, original-versus-retake history, uncertain answers, delayed review, mobile layout and dialog fit. Sixteen further checks cover all-lesson aggregation, separate study days, limited domain samples, incorrect completion data, first-answer imports, 3- and 7-day intervals, reset after a miss, JSON export, two-tab state synchronization, expiry while closed, malformed attempts and blocked storage. No browser errors were observed.

Desktop and 390×844 mobile layouts were visually reviewed. All 60 lesson anchors and all 60 caption files were checked. Media review evidence is in ../full-course/media-*.json and the related player-qa files.

Reproduce the assessment flows with the installed Playwright CLI, using scripts/qa/assessments.js followed by scripts/qa/assessment-recovery.js in a dedicated browser session against a local Vite server at port 4174. These tests seed and alter that browser’s study records; use an isolated QA session. The recovery test intentionally blocks browser storage at the end, so close that session before other tests.

Local browser records are not authenticated central employer records. Coordinator content approval and a consenting student pilot remain separate from production acceptance.
