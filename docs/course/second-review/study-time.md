# Learner study-time estimate — second review

Final media snapshot: September 13, 2026 (verified 2026-09-12T21:52:40Z, after the Part 60 repair). This is a workload model for the current 60-part AMG Maryland LIFE course, not a measured average from a learner pilot.

**For coordinator planning, allow about 19 active hours to work through the 60 lessons and their required questions; about 27 hours including the diagnostic, all three timed mocks and explanation review; and about 34 hours when the modeled later retention sessions are also included.** The modeled low and high-support full paths are approximately 23 and 59 active hours. The 59-hour scenario includes substantial remediation and slower review; it is not a mandatory course length. These are scenarios with explicit assumptions, not minimum/maximum completion limits or predicted exam outcomes.

## Measured course inventory

| Item | Measured quantity | Evidence |
|---|---:|---|
| Published lesson videos | 60 | Current public lesson-data objects |
| Recorded video duration at normal speed | **16,463.048 seconds = 4 hours 34 minutes 23.048 seconds** | Exact foundation manifests plus media-03.json through media-60.json |
| Average video | 4 minutes 34.384 seconds | Total divided by 60 |
| Shortest / longest video | 3:18.763 / 4:57.460 | Lessons 02 / 28 |
| Required lesson questions | **512** | Every current public lesson-data questions array |
| Supplementary written entries | 322 | Lesson 01–02 terms and lesson 03–60 notes |
| Supplementary written words | **22,319** | Entry headings, text/definitions and examples; excludes topic identifiers |
| Lesson question text and feedback | 39,325 words | 9,323 stem words, 13,552 option words, 16,450 explanation words |
| Diagnostic | **32 questions, untimed** | Assessment form D |
| Timed mock exams | **3 × 90 questions × 105-minute time allowance** | Forms A, B and C; 80 items per form count toward its main score |
| Full planned mock sittings | **315 minutes = 5 hours 15 minutes** | Reserves each entire available 105-minute sitting |
| First-exposure item encounters across this path | 814 | 512 lesson items + 32 diagnostic + 270 mock items; retries are additional |

All 60 public video URLs match their final local media manifests. Foundation durations are 256.044 and 198.763 seconds; Part 60 is 291.676 seconds after its duplicate-phrase trim. These are the final reported MP4 container durations, including small muxing differences, rather than the old durations minus nominal edit lengths. The caption inventory contains **3,926 cues**: original wording is preserved, all 58 applicable source/public copies match, and no cue is shorter than one second, exceeds 30 characters per second, overlaps another cue, or ends after its video. These mechanical checks do not prove perfect perceptual synchronization. The exact runtime snapshot changes if media is replaced again.

The per-lesson inventory and arithmetic are in [study-time-inventory.json](study-time-inventory.json). Word counts use word/digit tokens with internal apostrophes and hyphens retained; punctuation separators split tokens. The final written inventory includes the added Part 35 clarification. Source files are [part-01-manifest.json](../part-01-manifest.json), [part-02-manifest.json](../part-02-manifest.json), the `full-course/media-NN.json` series, the `public/course/lesson-NN/lesson-data.js` series, and [assessment manifest](../assessments/manifest.json). Public assessment-data also confirmed form counts and time allowances.

## Assumptions and calculated hours

“Typical” below means the middle planning scenario. It is not a statistically established average. The low scenario represents a quicker reader with fewer mistakes; the high-support scenario represents slower study and substantially more remediation. Every scenario includes all videos at 1× speed and all three full mock sittings.

| Activity and assumption | Low | Typical planning | High support |
|---|---:|---:|---:|
| Recorded videos, once | 4.57 h | 4.57 h | 4.57 h |
| Extra video pause/replay allowance: 10% / 25% / 50% of runtime | 0.46 h | 1.14 h | 2.29 h |
| Read 22,319 supplementary words at 250 / 175 / 125 words per minute | 1.49 h | 2.13 h | 2.98 h |
| First pass through 512 lesson questions: 45 / 60 / 90 seconds each, including immediate feedback | 6.40 h | 8.53 h | 12.80 h |
| One immediate retry for 10% / 20% / 35% of lesson items: 52 / 103 / 180 items, at the same per-item time | 0.65 h | 1.72 h | 4.50 h |
| Lesson navigation/finish steps: 15 / 30 / 60 seconds per lesson | 0.25 h | 0.50 h | 1.00 h |
| **60-lesson course subtotal** | **13.82 h** | **18.59 h** | **28.14 h** |
| Diagnostic first answers: 32 × 45 / 60 / 90 seconds | 0.40 h | 0.53 h | 0.80 h |
| Three mock sittings, each allocated the full 105 minutes | 5.25 h | 5.25 h | 5.25 h |
| Diagnostic/mock explanation review: 31 / 61 / 106 missed or uncertain items × 2 / 3 / 4 minutes | 1.03 h | 3.05 h | 7.07 h |
| **Course + diagnostic + three mocks + explanation review** | **20.50 h** | **27.43 h** | **41.25 h** |
| Three delayed reviews for each modeled queued item: 83 / 164 / 286 items × 3 × 30 / 45 / 75 seconds | 2.08 h | 6.15 h | 17.88 h |
| **Full study path total** | **22.58 h** | **33.58 h** | **59.13 h** |

Totals use unrounded inputs. The diagnostic takes approximately 24 / 32 / 48 minutes under these assumptions; it has no enforced time limit. Mock sitting allocations are planning reservations, not a claim that every learner uses all 105 minutes.

For company scheduling, the middle scenario has three distinct components: **18.59 hours of course learning**, **8.83 additional hours for diagnostic/mocks and their explanation review**, and **6.15 additional hours of later scheduled retention practice**. The last component is spread over later dates and need not delay a learner's initial 60-lesson completion record.

The 512 lesson questions average about 77 words when their stems, four options and all option explanations are combined. A minute per item in the middle scenario allows reading and a decision, but difficult calculations or unfamiliar legal distinctions can take longer. The model therefore adds immediate retries, video pauses/replays, and later review separately.

### How review was counted

The current assessment application queues missed lesson **first** answers, plus missed or uncertain diagnostic/mock answers. It keys the queue by original question identifier. Multiple misses in the same subject can therefore create multiple review entries.

For each scenario, the modeled lesson misses are `ceil(512 × miss rate)`, and the modeled assessment misses/uncertain answers are `ceil(302 × miss rate)`. Their sum is the modeled queue size. The middle case is 103 + 61 = 164 entries. Three later successful reviews at 45 seconds each add 492 review responses, or 6.15 hours.

The first-pass lesson timing already includes immediate explanation reading; the separate assessment review row covers post-submission explanations and a short return to the relevant distinction. The delayed-review row covers later retrieval practice. It does not count elapsed waiting days as study time. These are different activities, so they are not the same reading or answering counted twice.

The model assumes one immediate lesson retry per initially missed lesson item and three later successful scheduled reviews per queued item. A learner who misses later reviews can take longer: the application restarts that item's schedule after a miss. The high-support scenario is therefore not a maximum. The model also does not require rereading every explanation for already confident, correct diagnostic/mock answers; doing so adds time.

Full transcripts largely repeat the narrated teaching and are **not** included again as supplementary reading. A learner who uses transcript study instead of video needs a separate estimate; this report answers the video-based path. Additional legacy practice sets, personal flashcards, instructor sessions, full mock retakes, breaks, connectivity delays, licensing administration, and the actual state exam are outside these totals.

## Active hours and calendar spacing

The implemented review intervals are one day after a miss, then three days after the first successful review, then seven days after the second. With prompt successful reviews, one item's sequence is approximately **miss day → day 1 → day 4 → day 11**. These intervals are cumulative; they are not three reviews all completed by day 7. Later mistakes restart that sequence.

The application's study target also uses two previously unseen timed forms scoring at least 85% on separate local calendar days, completion of all 60 lessons, and review of missed/uncertain mock explanations. It does not require all three forms or every delayed-review stage to be finished to display that target. This report deliberately budgets the fuller three-form, three-review path. The application's 85% target is its own study target, not a validated pass predictor.

For the approximately 34-hour middle scenario, practical scheduling examples are:

| Available study time | Active-work equivalent | Suggested calendar allowance for planning |
|---|---:|---|
| About 1 hour on ordinary study days | About 34 one-hour equivalents | Roughly 5–6 weeks, with separate uninterrupted 1-hour-45-minute mock appointments |
| About 2 hours per study day | About 17 two-hour equivalents | Roughly 3–4 weeks, allowing review days after later mistakes |
| About 4 hours on intensive study days | About 9 four-hour equivalents | Roughly 2–3 weeks if the delayed-review sequence is retained |

These calendar windows are illustrative schedules, not enforced course lengths. Do not divide a timed mock into two one-hour sessions: its timer continues while the learner is away. The last new missed item can require another 11 days for all three successful delayed reviews even after the main lesson work is done. Students can do other study during those waiting days; waiting adds calendar span without automatically adding active hours.

## What the coordinator can tell agents

> The course has about 4 hours 34 minutes of video. Plan around 19 hours to work through the lessons, written teaching and required questions, and around 30–35 active study hours for a thorough first preparation cycle with the diagnostic, three practice exams and review. Some agents will need substantially more practice. Spread the work over several weeks so you can revisit material after a delay.

Use approximately **23–60 active hours** as a transparent planning envelope for the three modeled paths, with no implication that every learner fits inside it. No learner timing study or exam-outcome pilot was supplied, and these estimates do not establish mastery or guarantee an exam pass. Replace assumptions with observed, consented learner timing and outcomes when an actual pilot becomes available.
