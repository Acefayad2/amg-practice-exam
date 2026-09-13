> A subsequent launch review fixed two saved-progress defects. See the [current launch review](final-launch-review.md) for the latest deployed application and rollout conditions. This document records the preceding narration release.

# Zoe narration release — September 13, 2026

The 60-part Maryland Life course now uses the approved Zoe narration. Marcus’s original on-camera dialogue in the first 12 seconds of Part 1 remains intact. All original video pictures, frame timing and lesson runtimes are preserved. The six follow-up audio corrections are complete; the earlier Part 37 correction is also included. Caption timing was corrected in 22 lessons, covering 79 changed cues, without changing the spoken-word sequence.

The release preserves all 512 required lesson questions, answer-option indices, lesson versions and existing browser progress. All 302 diagnostic/mock assessment items and shared scoring/progress scripts remain unchanged. Previous editable archives are explicitly labeled as source archives containing the earlier narration.

## Validation

- All 60 final media exports have bound technical, transcript and candidate-review acceptance. Full decoding, runtime, audio level and unchanged-picture checks pass. Targeted paired recognition checks support the speech repairs and caption adjustments; this is not a claim of continuous human listening.
- All 60 local players and all 60 production players pass 938 checks per environment, including accepted media/captions, real playback-end events, required-question gates and six representative prior-progress states. No JavaScript errors were reported.
- Assessment validation passes 6,410 integrity assertions and 380 browser checks covering scoring, retakes, expiry and recovery.
- Independent integrated-source review and six sampled mobile/desktop visual checks found no actionable issue.
- All 212 built site assets are accounted for: 211 match production bytes exactly. The homepage has one verified extensionless-link normalization; the resulting link returns the exact intended page.

The earlier extensive review and this bounded current-source review are separate from the narration release. All 48 exam-outline subsections have teaching and question mappings. Mapping completeness and technical validation do not establish a guaranteed exam result.

## Rollout status

Technically verified for a licensing-coordinator-led pilot. Coordinator content approval and real-agent pilot outcomes have not been recorded. Keep the course’s review-edition labeling and measure comprehension and actual study time before broad rollout or effectiveness claims. Course pages are public and progress is stored in each browser; this release does not create private enrollment or centralized company transcripts.

Part 33 already identifies the upcoming October 1, 2026 Maryland survival-rule change. Its September-dated practice question remains correct as dated. Before a cohort affected by the change takes its exam, the coordinator should approve dated applied practice covering the new rule and its exceptions. [Maryland Chapter 509](https://mgaleg.maryland.gov/2026RS/Chapters_noln/CH_509_hb0596t.pdf)

Video runtime is 4h 34m 23s. Question answering, the diagnostic, three 105-minute mocks and review add study time; the course’s study-time figures are estimates, not approved education hours or observed pilot results.

## Published release

- [Course](https://amg-exam-portal.netlify.app/course/)
- [Application commit 8f8faed](https://github.com/Acefayad2/amg-practice-exam/commit/8f8faed55d8f47156eab3b3f36f50f0514e8b329)
- [Verified Netlify deploy](https://6aa5fc7306b9dd29a1b76a68--amg-exam-portal.netlify.app/course/)

Raw narration QA reports, transcripts and diagnostic excerpts remain local and excluded from Git. Public media manifests contain compact acceptance/provenance hashes; they do not include those raw report bodies.
