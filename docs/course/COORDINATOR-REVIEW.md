# AMG Maryland Life — coverage audit and production plan

Reviewed September 12, 2026. Scope: Maryland Life Producer, code 2027 / Series 20-27. This is a development review, not approval of a complete course.

## Decision

Keep the scenario-led format, but finish the instruction and assessment system before positioning AMG as a complete exam-preparation course. Produce one reviewable part at a time. Spend generation credits on scenes that help explain a decision; keep questions, diagrams, terminology, calculations and changeable rules on the website.

The course currently has two interactive foundation lessons and an earlier term/whole-life prototype. There are no completed, independent, blueprint-balanced timed mocks. No section has recorded coordinator sign-off. This audit maps scope and flags content; it does not certify all remaining legal or tax statements.

## What was inspected

- The Life outline linked from [Prometric’s Maryland page](https://www.prometric.com/exams/mia/), the [candidate bulletin](https://www.prometric.com/files/mia/Maryland-Insurance-LIB.pdf), and official practice information.
- All 90 repository life questions, answer keys and explanations; Parts 1 and 2; the term/whole-life prototype; the 32-slot production brief; exam selection, answering, scoring and result-topic logic.
- Targeted Maryland statutes, replacement regulations, MIA product guidance, SEC guidance and IRS material for corrections. Sources are listed in the review dashboard.
- Earlier exam photographs are not in this audit’s inspected files. The repository bank is the available record, not proof that every photographed concept was captured. The downloadable legacy Word study guide has not received this audit and its Life download link has been replaced with current resources. The file is retained for a later document review.

## Coverage result

The checklist maps all **48 numbered subsections** into **307 AMG teaching groups**. The 307 figure is our organizational count, not Prometric’s count of exam objectives or questions. Related official bullets may be grouped, and a subject appearing in multiple sections remains visible in each applicable section. The CSV includes evidence, planned lesson allocation and approval status for each group.

Four subsections have partial substantive teaching (2.1, 3.6, 4.1, 4.2); three have an introduction only (3.2, 3.7, 3.9). Forty-one have no dedicated lesson. Introductory mentions and question-bank matches do not count as completed coverage. All require review and expansion before final release.

Twelve subsections have no primary question-bank match: **2.1, 2.2, 2.6, 3.2, 3.3, 3.4, 3.6, 3.7, 4.6, 5.9, 6.5 and 8.3**. Some are touched by items primarily mapped elsewhere, such as the temporary/permanent distinction in product questions. A primary mapping is an inventory measure, not proof of complete assessment coverage.

The 16 newer formative questions in Parts 1–2 sit outside the original 90-question bank. The prototype has three additional comparison questions. These currently use three choices; future exam-format practice uses four. They help cover foundations, but they are not independent mock-exam items.

## Exam and assessment blueprint

The currently linked [Life outline](https://www.prometric.com/files/mia/2027_life_producer_9.21.21.pdf) specifies 80 scored questions, 10 unscored and 105 minutes. Its filename is older; it is not a document newly revised in 2026. Use item counts to construct practice forms because its rounded percentages sum to 102%.

| Domain | Scored items per mock | Exact share | Existing bank items before holds |
|---|---:|---:|---:|
| Maryland regulation | 24 | 30% | 20 |
| General insurance | 8 | 10% | 4 |
| Life foundations | 14 | 17.5% | 12 |
| Policy types | 8 | 10% | 14 |
| Provisions, options and riders | 11 | 13.75% | 23 |
| Annuities | 7 | 8.75% | 6 |
| Federal tax | 6 | 7.5% | 7 |
| Qualified plans | 2 | 2.5% | 2 |

Two additional bank items are supplemental; they are not counted in those domain totals. A question has one primary domain for scoring even when it touches multiple concepts. These mappings describe our items, not confidential Prometric questions.

Build these assessment layers after content review:

1. **Diagnostic:** 32 original questions sampling all eight domains, used to route study rather than exclude students.
2. **Lesson practice:** usually 6–10 four-option questions per short lesson, including retrieval, changed scenarios and close concept comparisons. Provide a reason for every option and a link back to the relevant explanation. Every teaching group must have assessment evidence; a single question may cover related groups only when each is actually necessary to solve it.
3. **Delayed review:** revisit misses after 1, 3 and 7 days with changed people, wording and facts. Review should continue even when a learner misses many questions. Show confidence separately so lucky guesses enter review.
4. **Three independent timed forms:** 80 scored items using the table above plus 10 additional items excluded from the main score. Hide which ten are excluded until review. Those ten are AMG simulation items, not actual Prometric experimental items. Use four choices, a 105-minute timer, marking/review navigation and no feedback until submission. Preserve answers on refresh; auto-submit accurately on expiry. Forms A/B/C must not reuse stems, scenarios or lightly reworded duplicates from drills or one another.
5. **Internal readiness review:** at least 85% on two previously unseen scored forms on separate days, followed by review of all misses. Require at least 80% over a separate cumulative sample of at least 20 fresh questions per domain; one mock’s two qualified-plan questions are too small a sample to establish domain mastery. These are proposed AMG learning targets, not Prometric’s cut score and not validated pass predictors.

Plan for approximately **650–800 distinct original items**, including 270 reserved for the three forms, the diagnostic and a larger lesson/review pool. The number is a planning range: expand it if mapping shows gaps. Count genuinely distinct questions, not answer-order shuffles. Retain only reviewed legacy items and do not copy recalled live-exam questions or Prometric practice content. Prometric’s [free practice](https://www.prometric.com/insurance-practice-test/) is a supplemental format familiarization tool; it is not a Maryland law curriculum.

## Immediate corrections and app changes

**27 questions were revised:** 6, 7, 11, 17, 22, 26, 28, 29, 35, 38, 41, 45, 49, 51, 55, 61, 64, 65, 68, 72, 73, 75, 76, 80, 84, 85 and 87. Revisions include clarified assumptions and removal of unsupported generalizations, not only wrong answer keys. The before-version remains in GitHub history; exact replacements are in `audit-revisions.json`.

Priority examples:

- **Q41:** replaced the contradictory annuity item with a specified nonqualified, pre-annuitization partial withdrawal and a worked earnings-first calculation. Periodic income is taught separately.
- **Q80:** corrected the blanket 31-day statement to Maryland’s nonindustrial rule of 30 days or an insurer-selected month of at least 30 days; the industrial alternative is separate. [§16–202](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-202.pdf)
- **Q17/Q35:** clarified timing and replaced the ambiguous mortgage co-signer exception with an unrelated stranger lacking the required interest. [§12–201](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=12-201)
- **Q11:** replaced the broad intent question with an express misappropriation ground. The initial audit itself was wrong to attribute generic “inaccurate/incomplete application” wording to this Maryland statute. Section 10–126(a)(2) uses an intentional-misrepresentation standard; other grounds have different elements. The corrected audit does not treat an innocent error as automatic disqualification. [§10–126](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=10-126)
- **Q49/Q73/Q87:** separated reinstatement, contestability and the suicide-exclusion clock, including Maryland conditions. Generic state timing is insufficient.
- **Q68:** now asks a specifically dated contribution question; contribution eligibility and deductibility are different concepts.

**11 questions are held out of the life drill:** 5, 9, 12, 20, 39, 43, 48, 50, 54, 59 and 67. Their detailed reasons are in the question-audit CSV. The life drill therefore has **79 questions**. Held items remain in the source for traceability and cannot be selected by the life practice app. The remaining questions are a review edition, not a source-certified final mock bank.

The life drill now uses explicit domain mappings instead of keyword guesses, continues through missed questions, uses its actual question count, and labels results as practice. It no longer tells a student that a high score proves readiness for the real exam. The 85% label is explicitly an AMG drill target. Its fixed order, immediate feedback and untimed format remain appropriate for practice; timed mocks are still to be built. Health course content is outside this release.

## Production order and format

The old 32 lesson numbers remain source-planning references. They are not a promise that 32 short videos can fully teach this scope. Large slots must be split into short teaching units; the checklist names those splits. Parts 1 and 2 keep their existing links. The earlier Lesson 06 remains a prototype.

| Review batch | Deliverable | Completion evidence |
|---|---|---|
| Now | Coverage audit and corrected review drill | Checklist, sources, held-item log and tested app |
| Next: Part 3 | Handling risk, insurable-risk features and reinsurance | Written teaching, one useful scenario, diagram and 8–10 original questions |
| Foundation bridge | Insurer categories, agency and contract interpretation | Comparison exercises with explanation of tempting wrong answers |
| Early Maryland block | Licensing, maintenance, appointments, money handling and misconduct | Current rule ledger and transaction scenarios; regulation gets 30% of scored mock allocation |
| Life decisions | Roles, needs, policy designs, applications and underwriting | Needs worksheet, product comparisons and file workflow |
| Policy operation | Beneficiaries, time limits, values, riders, business use and settlements | Timelines, payment-flow exercises and corrected exceptions |
| Retirement and tax | Annuities, tax events, IRAs and employer plans | Explicit account/product/tax-year assumptions and worked examples |
| Final review | Remaining Maryland rules, privacy/federal topics and mixed cases | No unmapped objectives; all source and content reviews recorded |
| Release preparation | Independent mocks and pilot student results | Functional checks, item analysis and coordinator sign-off |

For each part: draft the objective, teaching and questions first; check sources and answer keys; make the web lesson; create or reuse the brief scene; inspect the entire video with sound; then publish that part for review. Keep generated dialogue short enough for reliable delivery. Inspect every visible speaker through their last syllable; use intentional reaction shots or diagrams when off-screen narration fits. Automated decoding alone is not lip-sync QA.

Continue natural Black and Hispanic/Latino representation alongside other backgrounds. Rotate clients, producers, business owners and retirees without linking ethnicity to risk, dishonesty or financial ability. Use the AMG mark in the lower-left safe area, contextual titles, readable captions and consistent audio. The present mark is a text treatment; official logo artwork is still needed for a true logo lockup.

## Review gates before calling the course complete

- Every teaching group has an explanation, an applied example, original question evidence, a source where needed and named/date-stamped approval. “Planned” never counts as covered.
- Resolve the 11 held questions and the legacy Word guide. Independently source-check the rest of the bank, especially Maryland disclosure rules, exceptions, retirement rules and product guarantees.
- Resolve outline ambiguities: the repeated fixed-account wording under variable annuities, the automatic-option loan wording, older cross-references and changed prelicensing rules. The outline controls scope; current statutes and authoritative product sources control accuracy.
- Add missing nuance to existing broad items during final item review: general-account insurer risk (Q3), contract attachments (Q23), exchange conditions (Q24), producer authority (Q36), qualification remedies (Q42), coverage-specific loan values (Q70), payout comparisons (Q82) and non-MEC versus MEC cash-value taxation (Q89). These remain editorial follow-ups, not assertions that all original explanations are legally complete.
- Check mobile and desktop navigation, all answers and explanations, completion/reset, captions, playback and keyboard access. Test the final mock timer, answer changes, resume, expiry, scoring and form separation before enabling mocks.
- Pilot with consenting agents; collect first-attempt scores, concept misses and subsequent exam outcomes with consent. Improve weak instruction and ineffective distractors. Do not invent a pass rate or promise a guaranteed result.

Coordinator review should start with the coverage gaps, correction examples, proposed Part 3 and assessment targets. No new video-generation credits were used for this audit.
