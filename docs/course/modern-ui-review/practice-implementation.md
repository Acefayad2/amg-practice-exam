# Practice presentation update

Updated only the assigned assessment HTML, CSS and the dashboard/study-insight presentation in assessment.js. No build, commit or publication was run by this agent.

- Four immediately usable entries:32-question untimed diagnostic and Forms A/B/C, each90 questions and105 minutes. Short visible actions retain the original accessible start/retake/resume names. Tests are explicitly optional and independent of lesson completion.
- Shared AMG header/footer, Manrope and shared color tokens. app.css loads first; home.css is removed. The real mark uses the shared circular crop.
- Compact review queue and course continuation. Attempt history, study insights, test instructions, source/context notes and review-method explanations remain available through native disclosures. Download study record remains a visible action.
- White question surface, dark sticky timer, gold selected answer, distinct answered/marked/current navigator states, keyboard focus, mobile layout and44-pixel-high mobile navigator buttons. Original question text, results, explanations and source links are unchanged.

Validation: JavaScript syntax passes. practice-preservation.json confirms only dashboard and renderEvidence changed;26 other functions (including score, start, restore, save, timers, submission, recurrence, question/result rendering and event handlers) remain byte-identical. Assessment-data SHA remains0bc2878d9ede3a8d7efe3e2fb05e5df8ef917de11c6bff79c2e6ea8adc0d516e.

Integration notes: root owns app.css/fonts and the final browser regression. Long history/readiness panels are initially collapsed, so tests needing their visible controls must open the matching summary first. The principal test CTA accessible names and all exam inputs/IDs/actions are retained. This is a presentation revision; no scoring, timing, completion, data or storage migration is intended.
