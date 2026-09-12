# Independent second content review — lessons 21–40

Review date: September 13, 2026. Reviewer scope: Maryland LIFE course content and final published-caption files; this is an independent second read, not adoption of the first QA's conclusions.

**Later follow-up:** The five unavailable individual-section sources and incomplete §27-504 text recorded below were subsequently read in the official complete Insurance Article and checked against the actual lesson claims. All six support the course as written. See [source-gap closure](source-gap-closure.md) for exact pages, boundaries and the remaining MIA article-access limitation. The original retrieval history below is retained as the record of this subreview.

## Scope actually completed

- Read all 20 authoring lessons in `docs/course/full-course/lessons-21-22.mjs` through `lessons-39-40.mjs`: **120 complete narration blocks / 11,799 narration words**, **118 explanatory notes**, all **176 required questions**, all **704 answer choices**, and all **704 answer-specific explanations**. Read every authored visual label as part of those blocks.
- Loaded all corresponding `public/course/lesson-NN/lesson-data.js` files. Before the correction below, their number/version/title/subtitle/objectives/sources/blocks/notes/questions matched the authoring data exactly.
- Loaded every final `scene-captions.vtt` for lessons 21–40: **1,321 cues**. Removing timing/sequence lines and normalizing whitespace produced text identical to the complete, independently read narration in all 20 lessons. This checks text consistency, not whether the audio actually says every caption.
- Checked every caption start/end pair for overlap, ordering and positive duration. No invalid intervals or overlaps. Maximum cue length 77 characters; no cue exceeded 30 characters per second. Six subsecond tail cues and two unusually long gaps inside narration blocks are recorded below for improvement/actual-audio inspection.
- Independently recomputed the supplied arithmetic, including cross-purchase policy count, pricing probability/present value, premium modes, term-benefit schedules, account charges, index caps/spreads, loss-before-fee ordering, collateral claims, beneficiary branches, premium/loan deductions, age adjustment, settlement installments, survivor percentages and dividend/waiver examples. No arithmetic or wrong-answer-key defect found.
- Reopened the primary sources listed below for consequential legal/regulatory distinctions. Source retrieval failures are separately disclosed. No generated media, website build, deployment, purchase or voice change was performed by this review task.

Machine inventory: `content-21-40-inventory.json` (pre-correction comparison). Internal caption gaps: `content-21-40-caption-gaps.json`.

## Findings and correction

### C21-40-01 — P2 — Lesson 35 reinstated policy-loan interest needs the modern statute

**Location:** `docs/course/full-course/lessons-35-36.mjs:16`, first written note, “Reinstatement includes financial and underwriting conditions”; source list at line 6.

**Before:** The note grouped overdue premiums and other debt under a blanket contractual interest ceiling of 6% effective annually, compounded annually. That follows the text of §16-210 but omits the more specific modern policy-loan provision. Lesson 38 already teaches the modern rule, so the two notes could lead an agent to contradictory answers about reinstated loans.

**Primary evidence:** [Insurance §16-210](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-210) gives the ordinary three-year/industrial two-year reinstatement provision and its 6% interest text. [Insurance §16-208(b), (g)](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-208) expressly includes reinstatement of a policy loan for policies issued on or after July 1, 1983: fixed maximum no higher than 8%, or the statutory adjustable maximum; its policy-loan-specific rule controls the stated subject.

**Correction made in authoring source, as authorized by root:** Added §16-208 to lesson 35's sources and expanded that note to distinguish §16-210's stated 6% reinstatement text from §16-208's rules for reinstated policy loans. The new note explicitly says not to apply 6% as a universal cap on reinstated policy-loan interest.

**Preservation verified:** Comparing with the unchanged public data shows only lesson 35 `sources` and `notes[0]` differ. All six narration blocks, every question/answer/explanation, all other notes, and all lesson 36 content remain identical. Narration already says “allowed interest,” so this correction does not require new narration. Root must regenerate public data, build and publish; this task did not do that.

### C21-40-02 — P2 investigation — Two long caption gaps inside a single narration block

These are measured anomalies requiring fresh audio review, not a claim that silence is proven from caption timing alone. Both were immediately sent to the root media reviewer.

| Lesson | Gap | Measured duration | Consecutive narrated text |
|---|---|---:|---|
| 22 | 3:01.282–3:11.842 | 10.560 s | “Real life pricing uses fuller mortality and timing data.” → “It is not simply the face amount divided by a guessed…” |
| 37 | 1:30.425–1:37.645 | 7.220 s | “…value purchases.” → “No further premiums are required for that purchased period.” |

These are the only gaps of at least three seconds **inside** a narration block across these 20 final caption files. Genuine gaps between separately rendered narration blocks were excluded by matching cumulative word counts to authoring block boundaries.

**Concrete remedy if audio confirms unwanted silence:** Cut the unwanted pause from the original audio/video timeline and shift subsequent timings/captions consistently, preserving the words and lesson teaching. If the audio is continuous, repair the caption alignment instead. Neither requires changing the narrator or paying for a whole new lesson's speech. Do not mark resolved from captions alone.

### C21-40-03 — P3 — Six short caption tails can flicker

| Lesson / cue | Timing | Text | Suggested correction |
|---|---|---|---|
| 22 / 65 | 4:50.206–4:50.586 | `collected.` | Rebalance or merge with the preceding cue; a single final word appears for only 380 ms. |
| 28 / 70 | 4:54.750–4:55.690 | `actual conditions.` | Rebalance the final two cues or merge within line-length limits. |
| 32 / 35 | 2:20.778–2:21.618 | `a lender as collateral.` | Rebalance preceding words, or extend into the following verified silence. |
| 35 / 27 | 1:49.912–1:50.892 | `two hundred fifty dollars.` | Keep the amount readable using the adjacent verified silence or revised segmentation. |
| 37 / 25 | 1:29.485–1:30.425 | `value purchases.` | Coordinate with the gap investigation above; merge/rebalance instead of hiding a possible media pause. |
| 37 / 64 | 4:25.247–4:25.987 | `a real decision.` | Rebalance the final two cues or merge within line-length limits. |

No caption files were modified by this task to avoid collisions with root's media/caption work. These are reading-quality improvements; the caption words themselves correctly match the reviewed script.

### C21-40-04 — Maintenance note, no present factual error — October 1 law change

`lessons-33-34.mjs:20` and question `L33-09` at line 32 expressly date the old simultaneous-death rule to September 12, 2026. That is correct on this review date. The video separately uses an explicit contractual 30-day survival scenario and says it is not universal Maryland law.

The official [HB596/Chapter 509 status](https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/hb0596?ys=2026RS) confirms October 1, 2026 as the effective date. The [enacted chapter](https://mgaleg.maryland.gov/2026RS/Chapters_noln/CH_509_hb0596t.pdf) includes both the repealed pre-October text and the future 120-hour rule, evidentiary standard and exceptions. Therefore the course correctly treats the change as future on September 13. Before using this course for examinations on or after October 1, the coordinator should decide how the active state-law practice emphasizes the new law; keep historical questions explicitly historical. No present rewrite to pretend the new law is already effective was made.

## Complete editorial coverage by lesson

All rows include full narration, notes, questions and answer explanations, not a sample.

| Part | Questions | Main comparisons reviewed | Result |
|---|---:|---|---|
| 21 | 8 | Buy-sell agreement vs funding; cross/entity purchase; key person; executive ownership/bonus; policy count and shortfall | No content defect found. Consent/tax claims appropriately scoped. |
| 22 | 10 | Overlapping policy classifications; mortality/interest/expenses; net-single vs annual/gross; mode calculations | Arithmetic and distinctions correct. Audio gap and short final caption require review. |
| 23 | 8 | Field underwriting; corrections/signatures; representations/materiality; medical permission; AML escalation | No content defect found. FTC, FinCEN and COMAR distinctions confirmed. |
| 24 | 10 | APS vs investigative report/MIB; no-exam vs no-underwriting; preferred/standard/substandard/decline; abuse protections | No internal contradiction or keyed-answer defect. Primary §27-504 retrieval was only partial, see limits. |
| 25 | 8 | Two explicitly different receipt types; conditional/constructive delivery; changed health; modified offer acceptance | Examples state their conditions. No invented universal effective date. |
| 26 | 8 | Term duration vs benefit/premium; renewal vs conversion; decreasing/increasing formula; premium refund feature | No content defect found. Maryland term wording/renewal schedule confirmed. |
| 27 | 8 | Continuous/limited/single/graded premiums; lifetime vs payment period; cash value vs death benefit; illustration vs guarantee | No content defect found. Hypothetical amounts and product differences explicit. |
| 28 | 10 | UL funding/deductions; guarantee conditions; indexed formula vs actual index investment; net value vs credit floor | Arithmetic and explanation consistent. Short final caption noted. |
| 29 | 8 | Scheduled variable life vs flexible VUL; separate-account risk; investment loss plus charges; adjustable plan; authority | No content defect found. SEC/FINRA risk and guarantee distinctions confirmed. |
| 30 | 10 | Family riders; first/last death; juvenile owner/insured; individual/group credit life; debt limits/excess | No keyed-answer defect. COMAR death-date/net-payoff/excess rules confirmed. |
| 31 | 10 | Master policy/certificate; eligible group types; enrollment evidence; contributions; conversion/portability; federal programs | No content defect found. Association core criteria and VGLI deadlines confirmed. |
| 32 | 8 | Owner/insured/payer/beneficiary; consent; absolute/collateral assignment; release; entire-contract/correction rules | No keyed-answer defect. Beneficiary statutory mechanics confirmed. Short caption noted. |
| 33 | 10 | Priority/class/branch distribution; minor/trust/estate; revocable/irrevocable; divorce; survival; facility payment | No present factual defect found. Maryland divorce bulletin and October transition confirmed. |
| 34 | 8 | Return, grace, lifetime incontestability and different refund formulas; premium deduction | No arithmetic or keyed-answer defect. Grace/incontestability confirmed. Two other source retrievals incomplete. |
| 35 | 9 | Reinstatement; age adjustment/age limits; suicide continuity; war cause/status; backdating vs falsification | One written interest-rule correction made. Short amount caption noted. |
| 36 | 9 | Lump sum/interest/fixed period/fixed amount/life/certain/survivor; death-claim interest | No content defect found. §16-109 interest exceptions confirmed. |
| 37 | 8 | Net cash; extended-term period; reduced paid-up; default/election; reinstatement after surrender | No keyed-answer defect. §16-303 confirmed. Audio gap and two short captions require review. |
| 38 | 9 | Policy-loan debt/interest; APL election; withdrawal/surrender; educational use; fixed/adjustable rate and notices | No content defect found. §§16-207/208 confirmed; this exposed the lesson 35 note issue. |
| 39 | 9 | All six dividend-option concepts; accumulation vs insurance; paid-up addition/base status; offset vs guarantee | No content defect found. §16-206 choices/default and scope confirmed. |
| 40 | 8 | Whose event; premium vs deduction waiver vs income; juvenile payor; waiting vs benefit period | No content/key defect found. Examples correctly distinguish waived obligation from spending cash. |

## Primary sources freshly checked

These entries record what was actually obtained/read during this review; they do not assert that every linked carrier form in all 20 lessons was independently reopened.

| Primary source | Claims checked |
|---|---|
| [§16-210](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-210) and [§16-208](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-208) | Reinstatement eligibility/window; interest cross-rule; modern fixed/adjustable policy-loan rates, change frequency and notices. |
| [§16-207](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-207) | Scope exclusions, loan value/deductions, debt termination notice, six-month deferral exception and APL election. |
| [§16-205](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-205.pdf) | Age benefit adjustment and narrow lifetime three-year/30-day voidability exception. |
| [§16-215](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-215) | Permitted exclusions, terrorism-victim protection, reserve floor, scope and same-insurer suicide continuity. |
| [§16-212](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-212.pdf) | Reserved beneficiary changes, insurer acceptance, limited facility-of-payment circumstances/recipients. |
| [§16-202](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-202.pdf) | Individual 30-day/month-at-least-30 grace; industrial four weeks; later premiums; in-force and deduction. |
| [§16-203](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-203) | Two-year lifetime condition, nonpayment and supplemental-benefit scope; validity vs coverage defenses. |
| [§16-109](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-109.pdf) | Interest starts at death except paid within 30 days/late proof after 180 days, minimum rate reference. |
| [§16-303](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-303.pdf) | Sixty-day election/default; one-year paid-up eligibility vs ordinary three-year/industrial five-year cash minimum; more favorable provisions. |
| [§16-206](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-206) | Participation does not guarantee positive dividends; listed options, term exceptions, 30-day written election/default. |
| [§12-207](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/12-207.pdf) | Complete relevant statute text obtained through primary search result: representation and fraud/materiality/good-faith alternatives. |
| [§17-204](https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/17-204.pdf) | Primary search-result text: 100 members, two-year history, genuine noninsurance purpose and listed governance. |
| [COMAR 31.04.17.06](https://regs.maryland.gov/us/md/exec/comar/31.04.17.06) | Health answers knowledge/belief or representations; multi-person signature portion; changed offer. |
| [COMAR 31.04.17.09](https://regs.maryland.gov/us/md/exec/comar/31.04.17.09) | Clear term expiry, actual renewal rates, wholesale/group exception, disclosed exercise periods. |
| [COMAR 31.13.01.25](https://regs.maryland.gov/us/md/exec/comar/31.13.01.25) | Credit-life death-date claim, net payoff components, excess recipient. |
| [MIA Bulletin 26-22](https://insurance.maryland.gov/Pages/Bulletins/Bulletin-26-22.aspx) | Maryland-sitused group life, unchanged former spouse, Pennsylvania divorce rule not imported. |
| [Chapter 509](https://mgaleg.maryland.gov/2026RS/Chapters_noln/CH_509_hb0596t.pdf) and [HB596 status](https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/hb0596?ys=2026RS) | Existing statutory text reproduced as repeal; future 120-hour rule and explicit contract exceptions; October 1, 2026 effective date. |
| [FTC insurer consumer reports](https://www.ftc.gov/business-guidance/resources/consumer-reports-what-insurers-need-know) | Medical report permission, partial contribution adverse-action notice, CRA did not decide, free report 60 days/dispute. |
| [FinCEN insurance FAQ](https://www.fincen.gov/resources/statutes-regulations/guidance/anti-money-laundering-program-and-suspicious-activity) | Covered products and agent integration; no separate program solely for agency role; relevant suspicious patterns. |
| [VA VGLI](https://www.va.gov/life-insurance/options-eligibility/vgli/) | Term coverage; 1 year 120 days final application window vs 240 days no-health-evidence period. |
| [SEC Investor.gov variable life](https://www.investor.gov/introduction-investing/investing-basics/investment-products/variable-life) and [FINRA 2211](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2211) | Investment/charge/lapse risk; specific guarantee vs separate-account result; balanced description and prospectus. |

## Limits and remaining work

This subtask did **not** play every second of the final videos, inspect every rendered frame, run the browser player, or validate actual speech against audio. It must be combined with root's fresh media and interaction review. Captions matching the intended script do not prove correctly generated speech. Previously recorded QA was not used as a substitute for a fresh check.

The web tool returned cache-miss/timeout or unavailable results for several requested primary pages: §§16-105,16-219,12-206,16-304,17-307 and the MIA universal-life article. The primary §27-504 search result supplied the beginning of the statute but did not expose its complete medical-condition subsection (e); that detail is not counted as freshly source-verified here. The legal/source coverage above is extensive but explicitly incomplete for those retrievals. These limitations are not proof those lessons are wrong or the public links are broken. A coordinator/root verification can close those gaps using a working authoritative copy.

Follow-up retrieval attempt: also tried the alternative official host path pattern `https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/gin-SECTION.pdf` for §§16-105, 16-219, 12-206, 16-304, 17-307 and 27-504. All six returned unavailable/non-retryable retrieval results, so no additional statute text was obtained and no fresh verification is claimed from those attempts.

The written course has numerous intentionally simplified practice questions with clear assumptions. No answer-key or ambiguous-correct-answer error was found in this 176-question set, but a learner pilot is still needed to establish whether the difficulty and explanations produce reliable retention or exam performance. This review does not certify 100% absence of all errors or guaranteed passage.
