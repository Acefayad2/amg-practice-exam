# Modern course interface review

Reviewed September 13, 2026. The course now leads with video, followed by required questions. Optional practice tests remain available at any time. Long transcripts, explanations, objectives and sources are available in collapsed reference panels instead of filling the primary lesson view.

## Changes

- Shared AMG branding, locally hosted Manrope typography, gold accents, charcoal navigation and responsive surfaces.
- Classroom dashboard with a continue card, saved progress, eight chapters and lesson search.
- Video-first layout for all 60 lessons, a compact chapter rail and visible Watch / Answer steps.
- Required end-of-video question dialog, feedback, retry and completion controls retained.
- Four immediate-start practice options: diagnostic and timed Forms A, B and C. History and study insights are optional panels.
- Original question feedback links and old lesson anchors reveal the appropriate reference panel automatically.

Reusable templates live in `scripts/course-ui.mjs`, `scripts/course-home.mjs` and `scripts/lesson-ui.mjs`. The build also regenerates the first two lesson layouts from preserved foundation teaching fragments, preventing a later build from reverting the redesign.

## Preservation and verification

- Final production build passed and contains 215 files.
- Exact pre-change hashes match all 60 lesson data files and all 60 caption files, including video references and saved-progress versions. The 512 required questions and 302 assessment items are unchanged.
- Independent review: 298 checks covering data, navigation, search, reference links, required questions, retry, completion, restoration and responsive layouts. Actual question controls exercised 32 distinct required questions with 36 submissions, including incorrect-answer retries.
- Complete practice regression: 356 checks, exercising all 302 assessment items, scoring, timers, expiry, resume, results, retakes, review and mobile behavior.
- Native media smoke review: 30 checks across Lessons 1, 2, 3 and 60, confirming media duration, captions, native playback-end question dialogs and mobile fit.
- Desktop and 390-pixel mobile screenshots were inspected. An initial mobile chapter overflow and a singular/plural search mismatch were fixed and retested.

Evidence: `baseline.json`, `independent-review.json`, `practice-preservation.json`, `full-assessments.json` and `native-media.json`. Detailed local browser outputs and screenshots remain under ignored `output/playwright/modern-*` paths.

Tests used isolated Chromium sessions and did not change real learner progress. The core UI suite uses synthetic playback-end events; the separate native media suite plays the tail of four accepted videos. This redesign did not regenerate videos, spend video credits or constitute a new full narration/content audit.

The full assessment harness needed its scroll setup updated because the compact dashboard places Resume higher on the page; the original assertion assumed an element position from the previous layout. The corrected harness explicitly scrolls the Resume control to center before exercising the same focus/scroll regression. No assessment logic change was needed.

Manrope is self-hosted under the SIL Open Font License, retained at `public/course/assets/fonts/OFL-Manrope.txt`. Font provenance: Google Fonts, `ofl/manrope`, with its Latin variable WOFF2 served by fonts.gstatic.com. No remote font request is required at runtime.

## Publication

Application and production verification receipts are recorded in this folder after deployment. Netlify uses a manual deployment of the tested `dist` directory; a GitHub push alone does not publish this site.
