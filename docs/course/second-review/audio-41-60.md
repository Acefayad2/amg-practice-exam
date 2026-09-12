# Native audio follow-up: Parts 41–60

Review date: September 13, 2026.

**One clear narration stutter was confirmed in Part 60: “a life option” is spoken twice.** The approved correction removes the first copy with a 1.125-second trim between measured quiet gaps. The parent delegated the native edit and final verification to another reviewer. This report records the source evidence and handoff, not a completed final render.

No consistent consequential omission or changed teaching meaning was established in the other targeted phrases. Two pronunciation/word-segmentation uncertainties remain explicitly recorded below; this is not a certification of perfect speech.

## Actual scope and method

Read **all 363 full-file recognition difference candidates across Parts 41–60** and assessed them against the supplied scripts/captions and complete recognized context. The parent batch's original-media report, [media-41-60.json](media-41-60.json), covers **20 videos totaling 5,754.212 seconds (95 minutes 54 seconds)**. All 20 full decodes returned zero with no logged decode errors, black intervals, or detected pauses longer than 2.5 seconds. Those whole-file technical checks are the parent batch's evidence; this subtask did not independently rerun every full decode.

Performed **27 paired short-phrase windows, four paired wider follow-ups, and one additional paired Part 60 boundary check**, each with fresh base.en and small.en recognition: **64 fresh ASR passes** in total. The first 31 paired windows are stored with both complete recognized texts in [audio-41-60-excerpts.json](audio-41-60-excerpts.json); the supplementary boundary check is recorded there as exact nearby word anchors and physical silence intervals. There were no failed/nonunique locators in this batch.

The 27 initial windows total **241.399 seconds**; the four wider windows total **119.379 seconds**; the boundary check adds **12 seconds**. These windows overlap and their 372.778-second total is not unique audio coverage. This was targeted adjudication after whole-file screening, not a claim that this subagent personally listened through all 96 minutes or reviewed every video frame.

All actual audio extraction, recognition and silence analysis ran **inside the Higgsfield sandbox**, using the original source MP4s identified by the parent report. An unrelated sandbox expiration removed the first prepared directory; only the 15 originals needed for these target phrases were restored into the new private working directory. No original media, parent report, production source, caption or shared script was changed by this subtask.

Recognition used English, int8 on CPU, one thread/worker per model, sequential execution, beam 5, temperature 0, no initial prompt, no conditioning on previous text, word timestamps and VAD disabled. Caption queries were parsed across numbered cue boundaries, matched to original full-file word anchors, and given approximately three seconds of surrounding context. Four ambiguous first results received substantially wider context. ASR word times are approximate; the repair boundary also uses actual measured quiet intervals.

## Phrase decisions

| Part | Original-media excerpt | Targeted wording | Result |
|---|---|---|---|
| 42 | 21.840–30.840s | insured term rider and eligible children | Neither short recognition repeats the rider phrase. Both spell rider as writer, a phonetic/lexical ambiguity rather than a confirmed change of taught concept. |
| 42 | 44.960–54.220s | term rider on Elena if Elena | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 44 | 48.720–58.040s | or investment provisions Rosa may fund | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 44 | 271.780–279.540s | a product guarantee does not make | Both short recognitions print product guaranteed does rather than product guarantee does. Word-boundary voicing may account for the final d; text ASR does not establish a changed concept or independently settle pronunciation. |
| 45 | 261.160–269.920s | automatically income tax free life insurance | base.en prints income-taxed free while small.en recovers income tax-free. No consistent changed tax distinction. |
| 46 | 227.810–236.350s | or insurer quotes a client who | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 47 | 185.740–194.380s | covered by its formula such designs | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 48 | 133.840–142.980s | documentation obligations obtain the consumer profile | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 48 | 160.640–169.860s | cash compensation estimate explain material product | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 49 | 151.800–160.700s | has no outstanding loan other payment | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 49 | 205.460–214.500s | later interest disappear suppose the insurer | The first small.en short recognition collapses to the insurance; it is not counted as confirming the phrase. Both wider recognitions recover choosing installments does not make all later interest disappear, without the candidate extra here. |
| 50 | 274.540–280.379s | calculating the extra tax | Both first short recognitions misrender final tax (tack/tech). Both 22.379-second wider recognitions recover extra tax. No consistently clipped/missing tax instruction established. |
| 51 | 183.800–192.100s | taxable withdrawal and no applicable | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 51 | 208.860–217.040s | to the additional tax include distributions | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 51 | 211.040–220.420s | after age fifty nine and one half | Both short recognitions explicitly preserve after age fifty-nine and one-half. |
| 53 | 129.520–137.920s | contribution eligibility and deduction eligibility | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 56 | 114.640–124.480s | contracts as the obligees | small.en recovers obligees; base.en prints oblige's. Both retain the contractual ownership identity; no confirmed different concept. |
| 56 | 151.340–160.260s | between the insurers an IRS ruling | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 56 | 266.440–273.820s | partial annuity exchanges have | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 57 | 104.080–112.140s | fully vested assume the plan's lawful | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 57 | 212.880–224.060s | reaching age fifty nine and one half removes that ordinary age based additional tax | Both short recognitions recover the full age fifty-nine and one-half clause and its separate ordinary income tax qualification. |
| 57 | 239.940–254.540s | required minimum distributions depend on the applicable age plan and retirement facts | Both short recognitions recover the entire required minimum distributions clause: applicable age, plan and retirement facts, followed by the age-73/still-working example. |
| 58 | 51.520–59.600s | a Keogh or H R ten plan | Short recognitions print Kyog/kiosk; both wider recognitions identify Keog/KEOG and HR10 and the correct self-employed retirement-plan context. Orthographic/phonetic uncertainty remains, without a consistent different program identity. |
| 58 | 124.420–133.000s | with an employee's salary reduction election | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 59 | 74.540–84.280s | the actual benefits guarantees funding | Full-file recognizer inserted grants before guarantees. Four fresh recognitions segment this differently: garan/teas, guarantee, guarantee/fees, guarantee. No consistent new concept is established; pronunciation/segmentation of guarantees is not certified perfect. |
| 59 | 175.200–183.960s | be handled properly if Marcus's health | Both fresh short recognitions preserve the intended target without the candidate extra/repeated wording. Excerpt-edge fragment differences are excluded. |
| 60 | 154.980–163.560s | a life option with a ten | Full-file recognition and both fresh short recognitions reproduce a life option twice. Additional word-boundary recognition and physical silence analysis support a 27-frame trim of the first duplicate at 157.875–159.000 seconds. Parent delegated correction to content_41_60; this report does not assert final render verification. |

The extra “regulations,” “accounts,” repeated “formula,” extra “explain,” extra “it,” “lending,” repeated “additional,” repeated “and,” extra “owners,” extra “all,” extra “being,” repeated “salary,” and extra “finally” from the full-file transcription did not persist in the target phrases in both fresh models. These candidates do not establish a need to regenerate narration.

The important apparent omissions in Part 51's age 59½ exception and Part 57's age 59½ and required minimum distribution explanations were recovered in full by both short recognitions. That includes the distinction between the age-based additional tax and ordinary income tax, and the dependence of RMDs on the applicable age, plan and retirement facts.

## Wider checks and unresolved pronunciation limits

- **Part 49, 194.000–226.000s:** the first short small.en result failed to recover the target and is disclosed, rather than counted as a pass. Both wider models recover “Choosing installments does not make all later interest disappear” and the surrounding benefit/interest calculation. Unfinished words at the wider clip's end were not treated as source-media defects.
- **Part 50, 258.000–280.379s:** both first short models printed “tack” or “tech” for the last word. Both wider models recover the complete instruction ending “before calculating the extra tax.” This does not establish a missing/clipped final instruction.
- **Part 58, 44.000–76.000s:** the first short models printed “Kyog” or “kiosk.” Both wider models recover Keog/KEOG and HR10 with the self-employed retirement-plan definition. The written final “h” in Keogh cannot be adjudicated by spelling-only ASR, and no consistently different program identity persists.
- **Part 59, 65.000–98.000s:** the original full-file recognition inserted “grants” before “guarantees.” The four fresh results variously segment the target as “garan, teas,” “guarantee,” and “guarantee, fees.” No particular extra concept is consistently reproduced. The pronunciation/segmentation of **guarantees remains uncertain**, and should be included in any coordinator listening sample. It is not labeled perfect or definitively corrected.
- **Part 44, 271.780–279.540s:** both short recognitions write “a product guaranteed does not make…” where the script says “a product guarantee does not make…”. The adjacent “does” can make word-boundary voicing ambiguous. This is not enough to establish a new concept, but exact pronunciation is **not independently settled** by these two related recognizers.

Number and currency formatting, capitalization, joined/split compound terms, and obvious sound-alike written choices were assessed separately from lost concepts. Riders/writers and obligees/oblige's can reflect recognition spelling, not an audible different teaching point. No result at the cut edge of an excerpt was used as evidence that the original complete sentence is missing or wrong.

## Confirmed Part 60 repeat and safe edit handoff

Source: `docs/course/full-course/lessons-59-60.mjs:34`, in “Read what continues when the annuitant dies.”

Intended sequence:

> Pure life pays nine hundred dollars monthly while Rosa lives and stops at her death. A life option with a ten-year certain period pays eight hundred fifty dollars monthly…

The full-file recognizer and both fresh short recognizers instead reproduce:

> …stops at her death. **A life option, a life option** with a ten-year certain period…

A separate 153.000–165.000-second boundary excerpt was recognized with word times by both models. The first “a life option” lies at approximately 158.06–158.74 seconds, followed by the second copy at approximately 158.90–159.82 seconds. ASR aligns the leading “a” partly through a physical quiet interval, so its word starts cannot be treated as exact splice limits.

Fresh -40dB silence detection gives these quieter gaps around the first copy:

| Quiet interval | Position |
|---|---|
| 157.70694–158.02556s | After “death,” before the unwanted first copy |
| 158.88419–159.16044s | Between the unwanted and retained copies |

The parent-approved **157.875–159.000s** cut lies inside those physical gaps and removes **exactly 27 frames at 24fps**, or **1.125 seconds**. It retains about **0.3285 seconds** of combined natural pause between “death” and the surviving sentence. It does not remove any word in the intended script.

Original caption cue 38 is 156.467–157.547s, “stops at her death.” Cue 39 starts at 158.047s, inside the proposed cut, and runs to 162.557s: “A life option with a ten-year certain period pays eight hundred.” Cue 40 then continues “fifty dollars monthly…”. The assigned repair reviewer must clamp/remap cue 39 at the new join and shift subsequent captions, preserving every intended caption word exactly once in both the source and public VTT files.

The handoff includes the exact native MP4, boundary WAV, word anchors and quiet intervals. Full final decoding, retained-speech recognition, caption validity and join frames belong to the subsequent repair verification. This report does not substitute for that evidence.

## Limits and data handling

The two recognizers are related Whisper models and can share errors. Agreement narrows a candidate; it does not prove flawless pronunciation, lip movement, visuals, legal accuracy, or comprehension. The content audit, native media inspection, player regression and coordinator review remain separate parts of the overall second review.

No review-report cloud upload occurred. The prior automatic approval rejection of a report upload was respected; the follow-up kept media processing in the sandbox and returned findings as tool text into these local audit files. No narration generation credits were used by this subtask.
