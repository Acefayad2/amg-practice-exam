# Part 1 rebuild validation

September 12, 2026. Scope: the rebuilt Part 1 video and lesson workflow. Part 2 and the 79-question practice bank were not changed.

## Media

- Final MP4: 256.044 seconds, 1920×1080, 24fps, H.264 video and AAC audio; full-file FFmpeg decode passed.
- Cleaned opening dialogue matched the intended script in transcription. Narration sections were checked against their scripts; the only lower matching score reflected the transcription of the numeric dollar amount.
- Sampled composition frames were inspected for layout and branding. The final edit moved the policy-benefit footnote clear of the bottom-left logo.
- English WebVTT contains 69 timed cues. The complete spoken transcript is also available on the lesson page.

## Browser checks

Tested with a separate Playwright browser session, including a 390×844 mobile viewport:

- Fresh progress leaves both the questions and lesson completion locked.
- The actual final video's native ended event opens the question dialog. Ending the video alone does not complete the lesson.
- An incorrect answer displays explanations and requires another attempt. First answers and attempt counts remain separate from corrected answers.
- Completing all eight questions correctly enables explicit completion and reveals the Part 2 continuation link.
- Closing the dialog preserves progress without completing the lesson; reopening resumes unfinished questions.
- Refresh preserves answers and valid completion. Invalid JSON resets safely; a saved completion flag without correct answers is rejected.
- Reset clears answers and completion while retaining the finished-video state.
- Mobile page and dialog have no horizontal overflow; long answer explanations scroll within the dialog.
- Netlify deploy preview loaded the final 256.043-second video and all 69 caption cues, opened the end-of-video dialog, and produced no JavaScript page errors. Opening, policy-benefit and ending frames were visually checked in the actual player.

## Build and limits

`npm run build` passed. The main practice application's output bundle remains `index-VD5SXPZA.js`.

Progress is local to the learner's browser. Video-ended gating permits seeking and does not verify full watch time. This is a formative learning workflow, not account-backed certification or protection against manual browser-state edits. Licensing-coordinator review of the teaching and pacing remains the next step before rebuilding Part 2.

## Circular logo correction

- Native elliptical masks were checked on the opening, diagram and recap frames; the gold ring and dark center remain, with the surrounding rectangle removed.
- Re-rendered video remains 1920×1080 at 24fps and 256.044 seconds. Full decode passed with no diagnostics or compositor fallbacks.
- Original and corrected AAC packet hashes match: e4bf34d447bb9cfdb4d63ced64c2468f89757669542426a4dffd3d5a87fc9f51.
- The reported 3:45 issue was not reproduced as a visible fault in quarter-second source frames around 3:42–3:50 or continuous browser playback from 3:41–3:52. The browser recorded one dropped frame and a waiting event at the initial seek only; no media error. This does not establish that the user’s reported glitch is resolved.
- Zero additional generation credits. Questions, captions, narration and browser progress schema are unchanged.
