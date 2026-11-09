# Maryland Accident & Health course — production plan

Drafted November 9, 2026. Status: **planning only. No generation jobs have been submitted and no credits have been used for this course.**

This mirrors the method that produced the 60-lesson Maryland Life course (see `../full-course/PRODUCTION.md`, `../production-progress.md` and the `audio-*.json` receipts). Same voice, same characters' world, same lesson shape, same gated-course website.

## Exam facts (official outline)

Source: Prometric, *Accident and Health or Sickness Producer, Series 20-24* (`2024_accident_and_health_or_sickness_producer_9.21.21.pdf`, copy in `outline/`). 80 scored questions plus 10 unscored, 1 hour 45 minutes. Prometric's current Maryland page should be re-checked before release; the file is dated 2021 and the copy here is the August 2024 archived version because Prometric blocks direct downloads.

| # | Domain | Weight | Items | Subsections |
|---|---|---|---|---|
| 1 | Insurance Regulation (Maryland) | 30% | 24 | 1.1–1.5 |
| 2 | General Insurance | 9% | 7 | 2.1–2.6 |
| 3 | Health Insurance Basics | 11% | 9 | 3.1–3.8 |
| 4 | Individual Policy General Provisions | 8% | 6 | 4.1–4.3 |
| 5 | Disability Income and Related | 9% | 7 | 5.1–5.7 |
| 6 | Medical Plans | 14% | 11 | 6.1–6.6 |
| 7 | Group Health | 5% | 4 | 7.1–7.5 |
| 8 | Dental | 1% | 1 | 8.1–8.3 |
| 9 | Senior Citizens and Special Needs | 9% | 7 | 9.1–9.5 |
| 10 | Federal Tax Considerations | 5% | 4 | 10.1–10.5 |

53 subsections. The Life outline had 48 and became 60 lessons.

## What the Life course actually cost (the basis for this projection)

| Item | Credits |
|---|---|
| Part 1 rebuild (1 reference image, one 12 s clip, 6 narration sections) | 53 |
| Part 2 rebuild (6 narration sections) | 18.7 |
| Parts 3–60, repairs, 5 scenario photographs, final QA | 1,721.4 (8,853.3 → 7,131.9) |
| **Whole 60-lesson Life course** | **≈ 1,793** |

- Narration is the only recurring cost: Seed Audio (`seed_audio`, voice "Zoe"), about **4 credits per ~100-word block**, 6 blocks per lesson, so about 24 credits of first-pass narration per lesson. Repairs and re-takes brought the real average to **≈ 30 credits per lesson**.
- Scenario photographs (`gpt_image_2`): about 6.5 credits each; the Life course used five for the whole course.
- Diagrams, titles, captions, editing/rendering, lesson pages and all questions cost **0 credits**.
- The abandoned Lesson 06 prototype (810 credits of generated video) is the method we are *not* repeating.

## Projection for the Health course

Balance checked November 9, 2026: **7,012.3 credits** (Ultra plan).

| Scope | Lessons | Narration (first pass) | With repairs (actual Life rate) | Photos | **Projected total** | Balance after |
|---|---|---|---|---|---|---|
| Lean | 48 | ≈ 1,150 | ≈ 1,440 | ≈ 40 | **≈ 1,500 (1,300–1,700)** | ≈ 5,500 |
| Parity with Life (recommended) | 60 | ≈ 1,440 | ≈ 1,800 | ≈ 40 | **≈ 1,850 (1,650–2,100)** | ≈ 5,150 |

The range covers the normal re-take rate seen on the Life build (about 25% of blocks needed a repair). Credits are only spent in step 3 below, in bounded batches of two lessons, each with a saved receipt, so spend can be stopped at any batch.

Two things could make it cheaper, neither of which is counted above: Seed Audio and GPT Image 2 are both tagged `unlim` in the current catalog, so if the Ultra plan's unlimited mode applies to them the narration would not deduct credits (the Life receipts show it *was* charged, so budget on the paid basis); and any lesson that reuses a Life narration block (sections 2.1–2.4 overlap almost word for word) costs nothing new.

## Curriculum allocation (60-lesson version)

| Chapter | Domain(s) | Lessons |
|---|---|---|
| Foundations | 2.1–2.4, 3.1–3.3 | 1–7 |
| Policies and provisions | 3.4–3.8, 4.1–4.3 | 8–17 |
| Medical plans | 6.1–6.6 | 18–27 |
| Disability income | 5.1–5.7 | 28–34 |
| Group, dental and federal rules | 7.1–7.5, 8.1–8.3, 2.5–2.6 | 35–41 |
| Seniors and special needs | 9.1–9.5 | 42–48 |
| Maryland regulation | 1.1–1.5 | 49–56 |
| Tax and mixed application | 10.1–10.5 + mixed cases | 57–60 |

Regulation is 30% of the exam, so its eight lessons plus the Maryland-specific halves of 1.4/1.5 (plan requirements, Medigap, LTC) get the most question time. Chapter order puts the Maryland rules late on purpose, after learners know the products the rules apply to; the mock forms still sample it at 24 of 80.

## Assessments

- Lesson questions: 8–12 original items per lesson, every option explained (Life: 512).
- Diagnostic: ~32 items sampling every domain.
- Three independent 90-item timed forms, 80 scored + 10 simulation, 105 minutes, scored domain counts **24 / 7 / 9 / 6 / 7 / 11 / 4 / 1 / 7 / 4**.
- The existing 90-question Health bank (`src/data/healthQuestions.js`) is a starting point only. A keyword pass puts 31 items in regulation and 21 in medical plans, with 5 on disability, 4 on Medicare/LTC, 3 dental and none on taxation, so most of the bank must be newly authored. It stays as the public practice test; course items are new.

## Pipeline (same as Life)

1. Source ledger: outline subsections → teaching groups, with Maryland Insurance Article and COMAR citations checked against current text (the outline's statute references are from 2021).
2. Authoring: six ~100-word narration blocks per lesson, one visual per block, notes, 8–12 questions. 0 credits.
3. Narration cost preflight; submit in two-lesson batches through the Higgsfield tools; save `audio-NN-NN.json` receipts with `credits_exact`. **This is the only step that spends credits.**
4. Speech alignment, native graphics, render, per-video review (script match, layout inspection, full decode, captions).
5. Lesson pages, assessments, coverage closure, browser tests.
6. Release behind the same access code, as a second track beside Maryland Life, then sync into amg-wealth.

## Release limits

Course completion is study progress, not a licence, an approved pre-licensing course or a pass guarantee. Coordinator review is a separate real-world step. No new subscription or credit purchase is assumed.
