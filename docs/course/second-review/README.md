# AMG Maryland LIFE course — coordinator review summary

**Review date: September 13, 2026. Status: extensive second review and targeted repairs completed; integrated production publication is being verified. Coordinator approval is tracked separately.**

The course contains **60 lessons, 512 required lesson questions, a 32-question diagnostic and three 90-question timed mock exams**. The review found specific content, presentation and usability issues and addressed them without remaking the course or changing its narrator. Every replacement has its own verification record; final publication identifiers are recorded below after deployment.

## What was checked

| Area | Completed review and evidence |
| --- | --- |
| Teaching and questions | Independently read all 60 lessons' narration, notes, required questions, options and explanations. Compared source and learner-facing text, recomputed examples, and checked consequential Maryland, federal and exam-outline claims against authoritative material. A follow-up closed all six identified Maryland statute-access gaps. [Content 1–20](content-01-20.md), [21–40](content-21-40.md), [41–60](content-41-60.md), [source follow-up](source-gap-closure.md). |
| Media files | Decoded every original reviewed video from beginning to end; all **60** completed with zero decode errors and no black intervals detected by the scan. Audio levels and silence intervals were also scanned. These checks identified excessive pauses for targeted repair. [Media evidence 1–20](media-01-20.json), [21–40](media-21-40.json), [41–60](media-41-60.json). |
| Speech | Produced full-file `small.en` speech-recognition transcripts for all **60** videos and compared them with intended wording. The **743 difference candidates** were largely number formatting and recognition differences, not 743 confirmed video errors. Flagged phrases received contextual follow-up; a one-sentence Part 2 repair is described below. [Targeted audio review 1–20](audio-01-20.md), [21–40](audio-21-40.md), [41–60](audio-41-60.md). |
| Visual presentation | Inspected **720 freshly sampled frames: 12 per video**, including opening scenes, teaching graphics and near-end frames. Checked text fit, branding, diagrams, calculations and obvious image distortion. Part 44's misleading arrow sequence required a repair. Separate post-repair join samples are additional evidence, not part of the 720 count. [Visual reports](visual-04-20.md), [21–40](visual-21-40.md), [41–50](visual-41-50.md), [51–60](visual-51-60.md); Parts 1–3 were inspected by the lead reviewer. |
| Lesson completion | Exercised all **512** required questions across all 60 lesson players, including wrong-answer retries, correctly labeled explanations, video-ended question dialogs, refresh/resume, mobile captions and retained saved progress. **5,936 browser assertions passed.** [Player review](player-review.md). |
| Diagnostic and mocks | Checked the integrity of all **302** assessment items, answer keys and explanations, then exercised scoring, persistent timers, expiry, retakes, missed/uncertain review queues and readiness recognition. **6,410 integrity assertions and 380 browser assertions passed.** Each mock reserves 105 minutes and separates its 80 main-score items from 10 AMG simulation items. [Assessment review](assessment-review.md). |

## Corrections and current status

| Change | Status at this summary |
| --- | --- |
| **Part 9 registration clarification:** explain the relationship between the viatical broker deadline and the separate pre-activity registration requirement. | Written clarification and citation added; correct narration and question keys preserved. |
| **Part 35 reinstatement interest:** distinguish the ordinary reinstatement text from the modern rules governing reinstated policy-loan interest; remove the implication of a universal 6% loan-interest cap. | Written correction and citation added; narration and questions preserved. |
| **Predictable A–B–C–D answer cycle:** change displayed option order per question. | Implemented and tested across all 512 questions. Original saved answer indices and progress retain their meaning; labels and explanations follow the displayed order. |
| **Mobile assessment navigation:** resuming or submitting from a scrolled page could leave the question or score above the visible area. | Fixed and regression-tested. Expiry of a different background attempt preserves the current reading position. |
| **Captions:** merge 22 brief flashes across 19 lessons; realign fast/misaligned passages in Parts 19 and 59. | Repairs completed. Latest all-60 caption check reports no cue shorter than one second or faster than 30 characters per second. Matching caption shifts for all seven picture/sound cuts also passed the final checks. [Caption repairs](caption-repairs.md). |
| **Part 2 speech:** clarify the sentence whose opening “Compare” was repeatedly recognized as “Pair.” | Replaced only that sentence using the existing Gideon voice. **0.6 generation credits** recorded. Full decode passed, and the video-stream hash is unchanged: the picture was not regenerated. [Repair evidence](part-02-audio-repair.json). |
| **Excessive pauses in Parts 8, 9, 20, 22, 26 and 37.** | All six shortened with matching picture/sound cuts and caption shifts. Corrected files passed full decoding and contextual join speech checks; all **18** post-repair join frames were inspected. No generation credits used. [First batch](pause-repairs-a.json), [second batch](pause-repairs-b.json), [join review](visual-51-60.md#post-repair-visual-checks). |
| **Part 44 annuity-death diagram:** accumulation-stage death and income-stage death were shown as sequential events, although they are alternative cases. | Corrected to comparison cards. Full decode and **eight corrected-final samples** passed; audio payload, timing and caption hashes are unchanged. No generation calls. [Repair report](part44-graphic-repair.md). |
| **Part 60 repeated speech:** a repeated “A life option” phrase was confirmed. | Removed 27 frames / 1.125 seconds from the existing recording. Full decode and black scans passed; both fresh recognition models confirm one complete sentence. All six before/after comparison frames were inspected and all 71 caption cues retained with matching timing shifts. No generation credits. [Repair report](part60-duplicate-repair.md). |
| **Learner guidance:** clearer Part 2 completion heading and a course-home study-time guide. | Implemented and checked locally; included in the verified build. |

Questions, ordinary slides and written corrections were not regenerated with paid speech/video tools. The documented generation spend for the Part 2 sentence is **0.6 credits**; it is not a quote for future voice changes or a full account billing reconciliation.

## Time agents should plan

These are workload estimates, **not measured student averages or approved licensing-credit hours**. The final media inventory contains **4 hours 34 minutes 23.048 seconds of video** (16,463.048 seconds across 60 lessons).

| Study path | Middle planning estimate, cumulative |
| --- | ---: |
| All lessons, written teaching, required questions, pauses and immediate retries | **About 19 active hours** |
| Above, plus diagnostic, three full timed mocks and explanation review | **About 27 active hours** |
| Above, plus later spaced retention sessions | **About 34 active hours** |

At roughly **two hours per study day, allow three to four weeks** for the fuller path. Reserve an uninterrupted **1 hour 45 minutes per mock**; its timer continues while the learner is away. Review sessions occur on later days, so elapsed calendar time and active study hours differ. Quicker and higher-support scenarios model roughly 23–59 hours for the full path, with some learners needing more. [Assumptions and calculations](study-time.md).

## What still needs coordinator attention

**Read source verification at its actual scope.** A final check against Maryland's complete Insurance Article closed the five failed individual-section retrievals—**§§16-105, 16-219, 12-206, 16-304 and 17-307**—and the incomplete **§27-504** detail. All six support the course's actual claims; [the follow-up](source-gap-closure.md) records the text boundaries and lesson comparisons. The MIA universal-life article still could not be opened, but the relevant notice rule was verified in the statute and the general funding concept corroborated with NAIC material. No unresolved teaching discrepancy was identified from these access issues. Some federal Code text used Cornell with IRS corroboration after official-host errors; this review did not independently approve every carrier filing or product guarantee.

**Account for dated law.** Part 33 explicitly distinguishes the law effective during this September review from the Maryland simultaneous-death change effective **October 1, 2026**. Before assigning the course for examinations on or after that date, review how the active practice treats the new rule and keep historical questions explicitly dated. [Primary-source discussion](content-21-40.md#c21-40-04--maintenance-note-no-present-factual-error--october-1-law-change).

**Do not treat automated checks as continuous human viewing.** Whole-file decoding and full speech recognition cover the files, but the visual review samples frames and speech recognition can miss or invent words. Neither proves perfect motion, lip synchronization, every spoken syllable or absence of a brief glitch between samples. All nine replacement files in this revision received their own recorded checks. This review does not claim that someone watched and listened to every second continuously.

**Validate with real learners.** No exam-outcome pilot, measured learner timing study or licensing-coordinator approval has been supplied. The application's readiness target is a study aid, not a validated pass predictor; completion cannot guarantee passage. Progress is stored in the learner's browser, so it should not be treated as a central company attendance or compliance record. Use a coordinator pilot to assess difficult concepts, timing and results before making outcome claims.

## Release record — pending lead verification

- All nine replacement videos passed their documented final-file checks. The integrated repaired-media/caption player check passed **152 local browser assertions across 11 affected lessons**, with zero page errors. [Ten-lesson result](local-repaired-media-results.json), [Part 60 result](local-part60-results.json).
- Final runtime: **16,463.048 seconds / 4h 34m 23.048s**. All **3,926 caption cues** passed final timing, reading-speed, exact wording preservation and source/public parity checks. [Final captions](final-caption-verification.json).
- Integrated build, GitHub revision and Netlify deployment verification: **not yet recorded here**.
- Licensing-coordinator approval and learner pilot: **not claimed**.

The lead reviewer will update this record with verified replacement status, measured runtime and release identifiers. Earlier detailed reports retain the scope and timestamps of their own checks; a report describing a pre-repair file must not be read as approval of a later replacement.
