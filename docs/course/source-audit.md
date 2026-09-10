# Source audit — initial findings

Source: [AMG life question bank](https://github.com/Acefayad2/amg-practice-exam/blob/main/src/data/lifeQuestions.js), reviewed September 10, 2026. This is a targeted initial review, not a completed legal or editorial audit of all 90 questions.

| Item | Finding | Production action |
|---|---|---|
| Q41 | Answer B says principal is recovered before interest, but the explanation says earnings come out first. The question also fails to specify distribution type. | Replace the entire item. For an ordinary nonperiodic withdrawal before annuitization from a modern nonqualified deferred annuity, generally allocate earnings first. Teach annuitized payments separately. |
| Q11 | The explanation says license action requires intentional or willful misconduct across the board. Maryland's statute includes inaccurate, misleading, incomplete or materially untrue information in an application without a universal intent prerequisite. | Retire the question and replace it with an item accurately tied to the applicable statutory ground. |
| Q35 | It treats co-signing a mortgage as necessarily failing to create insurable interest, despite possible exposure to financial loss. | Flag for statutory review and replace the ambiguous example. |
| Q68 | It conflates contribution eligibility with deductibility and states a year-sensitive annual dollar limit. | Specify tax year, compensation and deduction assumptions; verify current IRS limits. |
| Q7 | The explanation inserts a typical minimum interest range that is not needed to test the concept. | Teach the contractual floor without an unsupported universal range. |
| Q22/Q64 | Descriptions of variable life must consistently separate guaranteed minimum death benefits, nonguaranteed cash values, and variable universal life. | Reconcile product terminology and conditions. |
| Q76 | The explanation overgeneralizes the additional tax on MEC withdrawals. | State that the additional tax generally applies to taxable amounts and that statutory exceptions may apply. |
| Q80/Q84/Q87 | Generic timing descriptions should not be substituted for Maryland requirements or actual policy terms. | Verify each specific state rule before narrating numbers. |
| Q6 | The claim that outright underwriting denial is rare is unsupported and unnecessary. | Remove it. Teach standard, preferred, rated and declined classifications. |

Primary checks:

- [IRS Publication 575](https://www.irs.gov/publications/p575) supports the distinction between nonperiodic withdrawals and annuitized payments relevant to Q41.
- [Maryland Insurance §10–126](https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=10-126) supplies the disciplinary grounds relevant to Q11.
- [Prometric Maryland page](https://www.prometric.com/exams/mia/) links the Life Producer outline used for the proposed course structure.

The existing repository is a useful concept bank, but it does not alone demonstrate complete exam coverage. General risk vocabulary, insurer categories, agency law, license maintenance, viatical settlements, and some federal requirements need expanded teaching and questions. No source code or live course has been changed.
