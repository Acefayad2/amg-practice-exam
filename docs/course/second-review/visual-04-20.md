# Independent final-video visual sample review: Parts 04–20

Review date: September 13, 2026. This review inspects fresh contact sheets sampled from the final MP4 files, not original render previews or prior QA reports.

## Scope and method

Parts 04–20 completed: **17 contact sheets, all 204 displayed samples read**. Parts 15–20 were inspected after confirmation that their uploads had completed.

Source URLs are recorded in `docs/course/second-review/contact-sheets-01-20.json`. An isolated Playwright browser session, `amg-second-visual`, opened each confirmed image URL and captured a 2304 × 1864 viewport. Screenshots are in `output/playwright/second-review/visual-partNN.png`. The images were displayed using `view_image` and each of the twelve numbered/time-labeled frames was inspected. This is browser screenshot inspection; no remote video or image was downloaded through an alternate media-fetch mechanism.

CUA in-app browser access was unavailable to this subagent (`browsers: []`, then `Browser is not available: iab` and `No browser is available`). The independent Playwright session resolved that obstacle without interacting with root's or the user's browser tabs. The Playwright skill was read and used.

The review looked for title/body collisions, clipped or illegible text, wrong displayed arithmetic or diagram relationships, missing/cropped branding, faces with visible distortions, unexpected blank fields and incomplete layouts persisting into later samples. No credit-consuming operation was performed.

## Results

**No candidate defect was identified in the 204 inspected samples.** The circular black-and-gold AMG mark appears at the bottom left of every inspected frame, with the surrounding area matching the slide background; no black rectangular background extends outside the circle. Headers, card bodies and arrows remain separated in the sampled images. The opening samples of Parts 19 and 20 each show two people reviewing documents; all four visible faces and the visible hands were checked, with no obvious deformation identified at the contact-sheet resolution. These are scene images, not evidence of moving presenter lip synchronization.

Some early samples contain only the first card/row, or two cards. These are consistent with staged entrances: the same section's later sample shows the complete layout. These partial entrance frames were inspected rather than silently omitted. No all-black or wholly blank sampled frame was seen.

| Part | Samples read | Final sample / MP4 duration, seconds | Actual observed visual checks |
|---|---:|---|---|
| 04 | 12 | 271.22 / 271.92 | Three independent insurer classifications are shown separately; ownership, domicile and authorization cards remain clear. Permission/financial-review/guaranty arrows and four-row recap fit. |
| 05 | 12 | 218.05 / 218.75 | Insurer–producer–applicant flow and express/implied/apparent authority layouts fit. The three-line “Necessary incidental act” title remains separate from its body. |
| 06 | 12 | 244.84 / 245.54 | Offer/acceptance/coverage flow, consideration/capacity/purpose, two-card contract distinctions and four-row recap remain legible. The single recap row at 196.44s becomes the complete recap later. |
| 07 | 12 | 256.84 / 257.54 | Contract-reading diagram, representation/warranty distinction and waiver/estoppel cards fit. Two materiality cards at 77.26s become three at 103.02s. |
| 08 | 12 | 246.22 / 246.92 | Regulatory layers, adverse-action diagram, securities cards and compact table fit. The partly faded first recap row at 197.53s is complete at 222.23s. |
| 09 | 12 | 278.72 / 279.42 | Individual/entity/insurer relationships, eligibility and exemption cards fit; temporary-authority table is fully readable. Two cards at 83.83s become three at 111.77s. |
| 10 | 12 | 250.05 / 250.75 | Renewal/education flow, CE numbers, reinstatement windows, reporting clocks and compliance recap fit without clipping. These sampled labels were read; legal-source verification belongs to the content audit. |
| 11 | 12 | 256.30 / 257.00 | Application-exception flow, appointment records and termination tables fit. The long “Consequences and the right response” section and displayed penalty range remain readable. |
| 12 | 12 | 247.59 / 248.29 | Premium-funds flow and account/compensation cards fit. Displayed $1,000 × 15% = $150 example is arithmetically correct. The final one-card entrance at 198.63s completes at 223.46s. |
| 13 | 12 | 282.72 / 283.42 | Misrepresentation/twisting, rebate/materials/purchase-condition and fair-treatment cards fit. Pressure-flow first card at 198.39s becomes a complete three-card diagram at 226.74s. |
| 14 | 12 | 253.18 / 253.88 | Guarantees/assumptions/premium obligations, illustration workflow, guide/summary/illustration and privacy-purpose table fit. No overlap or clipped third card in the final exceptions section. |
| 15 | 12 | 268.09 / 268.79 | Replacement/financing relationships, producer-documentation rows, new-insurer duties, refund distinctions and outcome recap fit. The two partially entered rows at 80.64s become four full rows at 107.52s. |
| 16 | 12 | 268.97 / 269.67 | Master-policy flow, contributions/dependents, conversion process, group-policy termination and assignment recap fit. Displayed $80,000 − $30,000 = $50,000 conversion example is arithmetically correct. |
| 17 | 12 | 282.13 / 282.83 | Claim process, unfair-practice distinctions, interest timing, insolvency flow and separate guaranty-limit cards fit. The $300,000 / $100,000 / $250,000 labels are distinct and readable; no sum is incorrectly implied. |
| 18 | 12 | 261.72 / 262.42 | Four role rows, own-life/family/economic-interest cards, timing diagram and consent recap fit. Two family-interest cards at 78.73s become three at 104.97s. |
| 19 | 12 | 257.30 / 258.00 | Opening family scene has no obvious face/hand deformation or title collision. Needs calculations read correctly: $3,000 × 12 × 10 = $360,000; + $220,000 = $580,000; − $180,000 = $400,000. Resource/estate/government-benefit cards and rows fit. |
| 20 | 12 | 278.34 / 279.04 | Opening document-review scene has no obvious face/hand deformation; left title/context/logo remain separated. Surrender/acceleration/settlement cards, viator/broker/provider flow, illness distinctions, disclosure recap and payment-clock diagram fit. |

## Limits

- Twelve still samples per video do not establish that every frame is correct. They cannot reveal transient defects between timestamps, frozen motion, speech repeats, silence, audio/video synchronization or transition pacing.
- The contact-sheet timestamp bars are review annotations beneath each sample, not course-video lower thirds. They are not counted as a branding defect.
- Full narration, caption timing and consequential legal facts require their separate content/audio reviews. The visual pass does not convert readable wording into independently verified legal advice.
- The four faces observed are in only two sampled scene images. This does not establish facial consistency or lip synchronization across a video, or resolve possible defects between sampled times.
- No production asset was changed on the basis of these still samples because no actionable defect was identified.
