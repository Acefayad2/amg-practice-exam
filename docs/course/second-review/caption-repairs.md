# Caption readability repairs — second review

September 13, 2026. This repair pass covers all 60 public caption files and their production-source counterparts where present.

**Repaired 22 short caption flashes across 19 lessons, changing 37 files.** Each repair joins a short cue to the immediately preceding related cue. The 44 affected original cues become 22 readable combined cues; the course total changes from 3,947 to 3,925 cues. No caption word was added, deleted, duplicated or reordered.

For Parts 03–60, both `docs/course/full-course/captions-NN.vtt` and `public/course/lesson-NN/scene-captions.vtt` were updated. Part 02's public file was updated; Part 01 had no qualifying tail and was unchanged. No shared player JavaScript, media, narration, question or build/deploy was changed by this subtask.

## Exact repairs

Cue references are the **original** cue identifiers/positions used in the audit. The earlier cue keeps its existing identifier; the merged tail identifier is removed. Other identifiers are deliberately not renumbered, preserving parent-review references and valid unique WebVTT identifiers. Timestamps below are the original outer boundaries, not estimated word times.

| Lesson | Original cues merged | Former short tail | Combined original outer timestamps | New duration | Longest authored line | Characters/second |
|---|---|---|---|---:|---:|---:|
| 02 | 19 + 20 | The key word is average. | 00:01:20.492–00:01:26.832 | 6.340s | 41 | 10.41 |
| 02 | 53 + 54 | finishing. | 00:03:13.910–00:03:17.370 | 3.460s | 41 | 23.12 |
| 04 | 3 + 4 | It can be all three. | 00:00:09.780–00:00:14.400 | 4.620s | 34 | 11.90 |
| 05 | 24 + 25 | help make a sale. | 00:01:26.488–00:01:30.848 | 4.360s | 49 | 20.87 |
| 07 | 58 + 59 | start. | 00:04:10.910–00:04:16.210 | 5.300s | 43 | 15.47 |
| 08 | 58 + 59 | answer. | 00:04:00.142–00:04:05.362 | 5.220s | 40 | 15.52 |
| 10 | 4 + 5 | of the birth month. | 00:00:11.400–00:00:16.980 | 5.580s | 43 | 14.70 |
| 11 | 60 + 61 | the law. | 00:04:09.690–00:04:15.310 | 5.620s | 46 | 14.95 |
| 19 | 62 + 63 | review. | 00:04:11.078–00:04:16.338 | 5.260s | 46 | 15.21 |
| 20 | 38 + 39 | These are different clocks. | 00:02:52.246–00:02:55.586 | 3.340s | 31 | 17.66 |
| 22 | 64 + 65 | collected. | 00:04:45.206–00:04:50.586 | 5.380s | 45 | 14.50 |
| 28 | 69 + 70 | actual conditions. | 00:04:49.510–00:04:55.690 | 6.180s | 45 | 13.43 |
| 32 | 34 + 35 | a lender as collateral. | 00:02:16.278–00:02:21.618 | 5.340s | 50 | 18.16 |
| 35 | 26 + 27 | two hundred fifty dollars. | 00:01:46.332–00:01:50.892 | 4.560s | 51 | 21.05 |
| 37 | 24 + 25 | value purchases. | 00:01:25.625–00:01:30.425 | 4.800s | 38 | 15.62 |
| 37 | 63 + 64 | a real decision. | 00:04:21.667–00:04:25.987 | 4.320s | 41 | 18.52 |
| 44 | 41 + 42 | roles are not identical. | 00:02:53.378–00:02:57.058 | 3.680s | 47 | 21.74 |
| 50 | 19 + 20 | the end of year two. | 00:01:05.134–00:01:09.134 | 4.000s | 51 | 23.00 |
| 50 | 71 + 72 | tax. | 00:04:34.946–00:04:39.006 | 4.060s | 39 | 17.98 |
| 54 | 74 + 75 | actually support. | 00:04:43.825–00:04:48.885 | 5.060s | 47 | 16.21 |
| 55 | 70 + 71 | separate decision. | 00:04:42.417–00:04:48.037 | 5.620s | 52 | 16.73 |
| 56 | 70 + 71 | view. | 00:04:44.672–00:04:48.732 | 4.060s | 40 | 19.70 |

All combined cues use two authored lines with a semantic break. The maximum authored line is **52 characters**, including spaces and punctuation, in Part 55. Combined durations range from 3.34 to 6.34 seconds, with at most 23.13 normalized characters per second. Narrow screens may naturally wrap these authored lines further in the existing caption panel.

These repairs use only the first cue's original start and the short tail's original end. No boundary between other surviving cues was moved. The related sentence pairs in Part 02 cues 19/20, Part 04 cues 3/4, and Part 20 cues 38/39 bridge their existing 1.34s, 1.10s and 0.42s uncaptioned intervals; no intervening caption or text is displaced. All other repaired pairs were contiguous.

The machine-readable before/after cue text, timings, identifiers, line lengths, readability calculations and file hashes are in [caption-repair-changes.json](caption-repair-changes.json).

## Verification performed

- Parsed all 60 WebVTT files before and after the repairs.
- Verified exact equality of the complete normalized caption-word sequence per lesson before/after; this checks every word and its order, not just aggregate word counts.
- Verified positive cue durations, monotonic nonoverlapping timing, and start/end bounds against each current media manifest.
- Verified unique identifiers where present and no duplicated `(start, end, text)` cues.
- Verified production-source/public byte equality for every Part 03–60 caption pair.
- Rechecked all 60 files: **no sub-second cue remains** after this pass.
- Confirmed Part 59's caption file was not edited; its cues 56/57 remain reserved for fresh ASR/timing review by the parent reviewer.

## Real mobile player check

Used the Playwright skill and a separate headed Chromium session, `amg-caption-review`, against the actual local course server. Tested the five longest combinations in Parts **05, 32, 35, 50 and 55** at **390×844** and **320×844**: ten cases total. In each case, the real video and WebVTT track loaded; the player was paused/seeked within the actual combined cue, and its existing mobile caption panel displayed the full exact text.

Every case passed visibility, full-text equality, page/caption horizontal bounds, no internal text clipping, and no duplicate native caption rendering. The real panel wrapped to two through four readable lines as needed. At 320px, Part 32's longer combination occupied 90px (four text lines); the remaining tested long combinations occupied 67.5px (three lines). The panel expanded without hiding text or covering the video. This is a caption-layout check, not a new full audiovisual playback certification.

Screenshots were captured in `output/playwright/caption-lesson-N-WIDTH.png`; the 320px captures for Parts 32, 35 and 55 were also visually inspected. The longest authored line fits without clipping. Reproducible check: `output/second-review/caption-mobile-check.js`.

## Deliberately left for the parent media review

The separate long native/caption gaps in Part 22 (3:01.282–3:11.842) and Part 37 (1:30.425–1:37.645) were not retimed or removed here. The relevant tail/preceding cue merges do not alter those outer gap boundaries. Any later native-video pause cut requires corresponding timestamp shifts after this repair pass.

Three existing fast cues remain outside this orphan-tail change: Part 19 cue 39 (31.78 characters/second), and Part 59 cues 56/57 (37.02 and 50.00). The latter two were explicitly reserved for fresh ASR. This report does not infer audio speed or correctness from those caption rates alone.

The original flag inventories and independent content audits were used as candidates, then rechecked against the current actual caption files. Later parent timing edits may change the hashes, exact cue rates or interval boundaries recorded here; this document records the completed readability pass before such media-specific changes.
