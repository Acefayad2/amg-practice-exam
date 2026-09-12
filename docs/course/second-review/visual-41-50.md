# Independent final-video visual sample review: Parts 41–50

Review date: September 13, 2026. These contact sheets were sampled freshly from final MP4 files, not original render previews.

## Actual scope and method

**10 contact sheets, all 120 displayed frames inspected.** Parts 51–60 are assigned to another reviewer and are not counted here. The source URL inventory is `docs/course/second-review/contact-sheets-41-60.json`. Confirmed URLs were opened in the isolated Playwright session `amg-second-visual`; browser viewport screenshots at 2304 × 1864 were read with `view_image`. Retained evidence: `output/playwright/second-review/visual-part41.png` through `visual-part50.png`.

Checks covered each sample's text, title/body spacing, diagram direction, arithmetic, branding, obvious scene-image face/hand distortion, and sparse versus unexplained incomplete frames. No user/root browser tabs were operated and no generation credits were spent.

## Actionable finding

**P2 — Part 44, section 5: alternatives are drawn as sequential events.** The samples at **205.72s and 235.10s** show `Accumulation death → Income-stage death → Maya · beneficiary`. Death during accumulation and death after annuitization are alternative cases, so the arrows can imply a false chronology. Individual text and narration distinguish the cases correctly. Source: `docs/course/full-course/lessons-43-44.mjs`, line 42, fifth block (index 4), `visual.type: 'flow'`.

Concrete correction: render these three items as a non-arrow comparison, keeping their text, narration and timing. Parent agreed the correction. It has now been implemented and verified in a separate final render; see `part44-graphic-repair.md`. **The 120 samples counted here remain the pre-repair audit; eight additional corrected-final samples are counted in the repair report.**

No other candidate visual defect was found in this scope. The circular AMG logo is consistently at bottom left without a black rectangle outside its circle. Long titles and row bodies fit. The two-person document-review opening image in each lesson shows no obvious face/hand deformation at sheet resolution. Reused artwork is not counted as new actors or new photographs. Partial early rows/cards complete in later samples from the same section.

| Part | Samples inspected | Final sample / MP4 duration, seconds | Specific observations |
|---|---:|---|---|
| 41 | 12 | 293.72 / 294.42 | Acceleration flow fits; the $100,000 accelerated portion of a $200,000 benefit, $90,000 net cash after the stated $10,000 discount and $100,000 remaining benefit are consistent. Personal-care cards, policy-value rows and disclosure flow fit. |
| 42 | 12 | 276.09 / 276.79 | Base insured, spouse and child coverage remain distinct. One covered child's $10,000 benefit is correctly not pooled into $30,000 for all three children. Hypothetical conversion $10,000 × 5 = $50,000 fits with its qualification. |
| 43 | 12 | 271.88 / 272.58 | $200,000 + $50,000 = $250,000; $100,000 × 3% adds $3,000 to reach $103,000. The third inflation card enters after the 136.29s sample and is complete by 163.55s. Return-of-premium distinctions and recap fit. |
| 44 | 12 | 293.18 / 293.88 | Opening, accumulation/annuitization and owner/annuitant cards fit. Section 5 has the misleading sequential arrow relationship described above. The final household-review table fits. |
| 45 | 12 | 291.34 / 292.04 | Funding and income start are separated. $100,000 less a stated 5% surrender charge yields $95,000 before tax. The hypothetical 2.5% rate falls below the 3% bailout trigger; the example's greater-of $80,000/$90,000 benefit is $90,000. |
| 46 | 12 | 291.93 / 292.62 | Life plus ten-year certainty, fixed-period-only and refund layouts remain separate. $100,000 − $30,000 = $70,000; $2,000 × 75% = $1,500; $60,000 ÷ $1,000 = 60 months and ÷ $1,500 = 40 months. The single-card entrance at 146.31s completes at 175.57s. |
| 47 | 12 | 281.14 / 281.84 | Minimum/current rates stay distinct. $50,000 less 10% is $45,000; 8% × 50% gives 4%, limited to the stated 3% cap. The early-exit flow and final comparison rows fit. |
| 48 | 12 | 269.18 / 269.88 | IRA/product layers, charitable conditions, four best-interest duties and whole-transaction replacement rows fit. The 134.94s two-row entrance becomes four rows at 161.93s. Record-retention text is readable and complete. |
| 49 | 12 | 284.89 / 285.59 | Dividend and interest amounts are separate. The policy-loan flow explains a possible progression to lapse/surrender. $55,000 − $40,000 = $15,000; $200,000 ÷ 100 = $2,000 excluded from a $2,400 payment, leaving $400 interest. Estate/probate distinctions fit. |
| 50 | 12 | 279.68 / 280.38 | Cumulative seven-pay limit $20,000 versus $22,000 premiums is $2,000 over. $70,000 − $50,000 = $20,000 gain; separate $15,000 and $25,000 withdrawal examples are not connected as successive transactions. $15,000 × 10% = $1,500 additional tax. Titles and the MEC/non-MEC loan comparison fit. |

## Limits

- These are sampled still-frame findings, not continuous-playback certification. Motion, lip synchronization, spoken quality, silent pauses and defects between sample times require separate checks.
- Part/time bars are contact-sheet review annotations below the frames, not production video branding.
- Visual clarity is not proof of a legal rule. The independent factual audit is in `content-41-60.md`.
- The original samples are preserved as pre-repair evidence. Part 44 repair and its verification are documented separately in `part44-graphic-repair.md`.
