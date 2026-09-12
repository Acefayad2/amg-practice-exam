# Native audio follow-up: Parts 21–40

Review date: September 13, 2026.

**No consistent consequential speech omission, insertion or changed teaching meaning was established by this follow-up. Three long native pauses were confirmed and conservative cut intervals were handed to the parent media reviewer.** The important clauses that looked absent in whole-file recognition are present in both fresh short-excerpt recognitions.

## Actual scope and method

Read **all 228 full-file ASR difference candidates across Parts 21–40**, not just the first known flags. Reviewed the completed native batch evidence in `/home/user/amg-second-review/report-21-40.json`: all 20 whole-file decodes returned zero, with no logged decode errors or black intervals. Those decode/black results are the parent batch's evidence; this subtask did not independently rerun every full video decode.

Performed **25 successful targeted phrase checks and three long-pause checks**, each using fresh **base.en and small.en** recognition: **56 short ASR passes**. A first attempt to locate the repeated “new evidence of insurability” phrase correctly stopped as nonunique; the rerun used the unique conversion-limit wording and succeeded. The failed locator did not generate a misleading excerpt or count as a successful ASR check.

All media processing remained inside the existing Higgsfield sandbox under `/home/user/amg-excerpt21`, using the actual `final.mp4` originals. Models were already cached, with one CPU thread/one worker each, int8 and sequential inference. No model was prompted with the expected script. Caption text was parsed across cue identifiers and cue boundaries, then aligned to the full-file recognized word anchors. Phrase windows added three seconds of context on both sides of those anchors; pause windows added six seconds on either side of the detected silence. ASR word timestamps are alignment evidence, not sample-perfect ground truth.

The 25 phrase windows total **202.750 seconds** of source audio; together with the three pause windows, the targeted excerpts cover about **4 minutes 22 seconds** before accounting for overlap. This was targeted adjudication following whole-file screening, not a claim that this subagent personally listened through all 93 minutes or every video frame. No narration, source content, caption, original video, main report or shared script was changed by this subtask.

## Phrase decisions

Full paired recognitions, timings and classifications are in [audio-21-40-excerpts.json](audio-21-40-excerpts.json). The principal recovered clauses include Part 26's “particular terms,” “contract's rules” and “new evidence of insurability”; Part 28's “policy's actual return”; Part 29's “stated plan”; Part 32's entire “irrevocable designation creates an interest” clause and “deductions”; Part 34's “policyholder”; and Part 40's premium obligation.

| Part | Native excerpt window | Targeted wording | Result |
|---|---|---|---|
| 22 | 48.200–56.860s | may pay dividends but those dividends | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 22 | 130.140–139.060s | the gross price these are pricing | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 26 | 23.800–31.040s | level premium forever | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 26 | 50.580–58.700s | under these particular terms | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 26 | 132.800–142.580s | new evidence of insurability within the stated limits | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 26 | 159.360–169.320s | conversion under the contract's rules | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 28 | 184.620–191.890s | policy's actual return | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 29 | 21.540–28.500s | can lose value | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 29 | 80.060–87.140s | while investment results | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 29 | 214.340–221.680s | under the stated plan | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 31 | 31.900–39.980s | its own financial loss | Recognizer disagreement: base.en prints 'law', small.en prints 'loss'. Not a consistent meaning defect. |
| 31 | 226.480–236.560s | or FEGLI provides group term | Both recognizers print FEGI while correctly spelling out Federal Employees Group Life Insurance. Acronym spelling/pronunciation ambiguity; no program-identity or meaning defect established. |
| 32 | 51.700–59.000s | an irrevocable designation creates an interest | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 32 | 160.340–168.160s | other claims or deductions | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 32 | 228.320–235.500s | required riders and endorsements | base.en prints riders; small.en prints writers. Phonetic/lexical ambiguity, not consistent evidence of changed meaning. |
| 33 | 151.860–159.960s | a former spouse who remained | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 34 | 47.860–56.640s | provision gives the policyholder ten days | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 34 | 261.180–268.160s | governed by incontestability | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 35 | 0.000–5.100s | Marcus let an ordinary individual | Both recognizers print led instead of let before 'an'. This is a connected-speech t/d spelling ambiguity; not a confirmed change in the taught lapse concept. |
| 36 | 48.780–57.080s | with the insurer and pays | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 36 | 146.100–154.520s | with one hundred twenty thousand dollars and no interest | base.en prints 'in no interest'; small.en correctly prints 'and no interest'. No consistent omission of the no-interest assumption. |
| 37 | 151.820–160.740s | smaller permanent benefit this is different | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 38 | 130.100–139.040s | term policies term riders | Both recognizers print writers; source/context is term riders. These can sound alike in the speaker's pronunciation. Text recognition alone does not establish a spoken meaning defect. |
| 38 | 171.040–179.800s | life withdrawal mechanism identify | Both fresh models recover the intended target phrase without the full-file candidate insertion/omission. Differences at excerpt edges are not treated as defects. |
| 40 | 49.680–58.340s | waiver of premium rider waives the premiums specified | Both fresh models recover premium/premiums, with small.en preserving the plural; no omitted premium obligation. |

The first ASR's extra “options,” repeated “price,” extra “4” after “forever,” “you,” repeated “while,” extra “house,” “accessibility,” repeated “insurer,” extra “it,” and “them” did not survive fresh contextual checks. These candidates do not justify spending generation credits to rewrite audio.

Number/currency rendering (for example spelled-out amounts versus digits), capitalization, acknowledgment spelling, joined/split policyowner/nonparticipating/servicemembers, and obvious sound-alike written choices were classified separately from omitted concepts. Replacements such as waives/waves or riders/writers are not evidence on their own that the voice taught a different concept. In Part 31, the full Federal Employees Group Life Insurance name is present despite both recognizers spelling the acronym “FEGI”; the parent reviewer accepted that this does not establish a meaning defect. Loss/law remains a disagreement between models rather than consistent evidence that “loss” is absent.

Clipped words or unfinished phrases at excerpt edges are excluded from defect decisions. For example, an excerpt ending partway into a following numerical example can cause a recognizer to supply a plausible amount; it is not evidence that the complete original video says that amount. The paired results are assessed at the target phrase, with the longer full-file context available.

## Confirmed long pauses and conservative cuts

Fresh -40dB silence detection reproduced each long native gap. Both independent excerpt models agree on the adjacent spoken sentences. Proposed cuts sit inside the quiet interval and away from both models' nearby speech anchors; they retain some pause instead of joining words without breathing room.

| Part | Native detected silence | Adjacent speech | Conservative proposal | Parent-adopted inward 24fps boundaries |
|---|---|---|---|---|
| 22 | 181.361–193.153s (11.792s) | “…mortality and timing data.” → “It is not simply the face amount…” | 181.750–191.500s | **181.750–191.500s** |
| 26 | 205.31494–208.843s (3.52806s) | “…not a cash value account.” → “Suppose a teaching policy…” | 205.650–207.950s | **205.6666667–207.9166667s** |
| 37 | 90.72801–98.2467s (7.51869s) | “…that value purchases.” → “No further premiums are required…” | 91.000–97.300s | **91.000–97.2916667s** |

The adopted intervals remove approximately **18.292 seconds combined**, leaving roughly 1.2–2.0 seconds of the originally detected pause in each location. Part 26's original cue 47 spans its pause and must be remapped with the video. The parent reviewer is applying native cuts, remapping captions, checking final decoding/joins and reviewing join frames. This report records the source-audio evidence and handoff, not completion or successful verification of those later edits.

## Limits

Two related ASR models can share errors, and correct-looking recognition does not prove perfect pronunciation, edit quality, facial motion, or comprehension. This follow-up narrows the false-positive full-file differences; it does not certify 100% absence of all audio errors. The actual content audit, native media review, browser regression and coordinator review remain separate evidence.

Automatic approval review rejected the proposed external cloud upload of the excerpt report, describing it as a separate disclosure of course/transcription data. The export step was removed before execution. The analysis then completed entirely inside the existing sandbox; these local audit notes and JSON contain the reported findings. No review-report cloud upload occurred.
