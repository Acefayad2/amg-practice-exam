# Part 60 duplicate narration correction

Date: September 13, 2026. Status: **corrected export confirmed; source/public media metadata and captions updated; parent coordinates final build and deployment.**

## Finding and correction

The written lesson correctly contains “A life option with a ten-year certain period…”. The original final audio instead says “A life option, a life option with a ten-year certain period…”. The full-file review and two independent short transcription checks confirmed the duplicate. The source sentence is in `docs/course/full-course/lessons-59-60.mjs`, line 34.

Removed only the first redundant phrase by cutting **157.875–159.000 seconds** from picture and sound together: **1.125 seconds, exactly 27 video frames**. The original editable archive is preserved unchanged inside the new repair archive. The new archive includes the corrected final, matching captions, exact cut report and reusable native repair script. Its README directs future rebuilds to reapply the recorded cut.

This was a **duplicate-speech correction**, not removal of a silent interval. Only the two cut endpoints lie in quiet gaps. A fresh native scan measured those gaps at 157.706917–158.025500 and 158.884172–159.158880 seconds at −40 dB, safely containing the selected boundaries. Approximately 0.327 seconds of combined pause remains between the surrounding speech. No narration was generated. FFmpeg re-encoded the final video/AAC after the matched cut, so this repair does not claim byte-identical audio.

## Verification performed

- Corrected final: **291.676 seconds** (4:51.676), 1920 × 1080, H.264 at 24 fps, AAC at 48 kHz. Frame count is 7,000 versus 7,027 originally. The container duration differs from simple decimal subtraction by 7 milliseconds because of encoded/container timing; the recorded frame-aligned cut is exactly 1.125 seconds.
- The complete corrected file decoded successfully. The full black-frame scan found no intervals with the configured 0.08-second duration, 10% pixel threshold and 98.5% picture threshold.
- Both **small.en and base.en** independently transcribed a 22-second excerpt from the corrected final. Each recognizes the preceding “stops at her death” followed by **one** complete “A life option with a ten-year certain period…” sentence and the continuing minimum-payment explanation. ASR timestamps are estimates; the independently measured quiet gaps support the physical cut.
- Inspected all six exported join-sheet samples: two from the original at 157.525 and 159.050 seconds, plus four from the corrected final at 157.525, 157.925, 158.875 and 161.875 seconds. The cut occurs inside a settled comparison layout. Titles, amounts, card bodies and the circular bottom-left AMG logo remain intact without an observed layout jump in these samples.
- All **71 caption cue IDs and the complete written-word sequence are preserved**. Cue 39 originally began inside the removed duplicate phrase; it now starts at the join (157.875) and ends at 161.432. Later caption boundaries shift earlier by 1.125 seconds. Every cue remains positive in duration, ordered, nonoverlapping and within the new runtime. Source and public VTT files match.
- Lesson version **1**, all eight required questions, explanations, lesson text and transcript remain unchanged. Only the public video URL/runtime and corresponding caption timings changed. JavaScript syntax validation passed.
- All five artifacts returned HTTP 200 from upload and were confirmed. No generation calls were made. No course build or deployment was run by this subagent.

The source metadata is `docs/course/full-course/media-60.json`; the source caption file is `docs/course/full-course/captions-60.vtt`. Matching public files are under `public/course/lesson-60/`. Full machine-readable evidence is in `part60-duplicate-native-verification.json`; a compact integration record is in `part60-repair-integration.json`. The inspected browser screenshot is `output/playwright/second-review/part60-repaired-join.png`.

## Confirmed artifacts

- [Corrected final video](https://d2ol7oe51mr4n9.cloudfront.net/user_3F3Wyc8aPIE73qdpViOJx8BolpH/91be1334-5306-4343-9bcc-b6c0d51d245c.mp4)
- [Editable repair archive preserving the original project](https://d2ol7oe51mr4n9.cloudfront.net/user_3F3Wyc8aPIE73qdpViOJx8BolpH/bac1a572-a8bb-4fa4-a71f-d85d3752cd4f.zip)
- [Before/after join sample sheet](https://d2ol7oe51mr4n9.cloudfront.net/user_3F3Wyc8aPIE73qdpViOJx8BolpH/a0d94810-0f0e-48f6-9701-6ef9a05b7c35.jpg)
- [Native verification record](https://d2ol7oe51mr4n9.cloudfront.net/user_3F3Wyc8aPIE73qdpViOJx8BolpH/045d5e03-b0d1-4c6e-bf2d-90640c413f19.json)
- [Corrected 22-second audio excerpt](https://d2ol7oe51mr4n9.cloudfront.net/user_3F3Wyc8aPIE73qdpViOJx8BolpH/af40a137-66a4-4899-83e7-7bd8026cfad2.mp3)

## Limits

The joined speech was checked through two independent recognizers plus measured quiet boundaries; this is not a claim of uninterrupted human listening to every course video. Still-frame inspection does not certify motion between samples. Parent handles integrated playback and release acceptance.
