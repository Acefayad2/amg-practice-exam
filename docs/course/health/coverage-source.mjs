// AMG planning objectives for the Maryland Accident & Health course.
// IDs are Prometric outline subsections (Series 20-24, outline/). A planning
// assignment is not completed instruction; the build maps actual teaching
// blocks and questions to each topic group before anything counts as covered.
export const sections = [
  ['1','Maryland regulation',24], ['2','General insurance',7], ['3','Health insurance basics',9],
  ['4','Individual policy provisions',6], ['5','Disability income',7], ['6','Medical plans',11],
  ['7','Group health',4], ['8','Dental',1], ['9','Seniors and special needs',7], ['10','Federal taxation',4]
].map(([id,title,items])=>({id,title,items,share:items*1.25}));

const rows = [];
const add = (id,title,pages,lesson,topics,example,assessment) => rows.push({id,title,pages,lesson,topics:topics.split('|'),example,assessment});

add('1.1','Obtain and maintain the right authority',[1],'49–52; licensing, maintenance, appointments, discipline',
 'Why licensing exists; general provisions and definitions|Initial qualifications, examination, application and fee|Producers, advisers, nonresidents and business entities|Exceptions to licensing|Duration, termination and renewal of a license|Address and name changes; assumed names|Reporting criminal prosecutions and other states’ actions|Continuing education|Producer contract versus appointment; individual versus agency appointment|Solicitation before appointment; appointment after licensing|Appointment acknowledgment, cessation and termination notices|Probation, suspension, revocation and refusal to issue or renew|Cease-and-desist orders, penalties and hearings|Insurance fraud and the Fraud Division',
 'Theo passes the exam, joins AMG, moves apartments, is appointed by a carrier and later receives a notice of hearing. Sort each duty and deadline.',
 'Identify the authority or duty in play and the required next action, using current Maryland deadlines rather than another state’s.');
add('1.2','Regulate insurers and producer conduct',[1,2],'53–55; MIA powers, money, conduct, privacy',
 'MIA general duties and powers|Acting for an unauthorized insurer|Record retention|Activities permitted to unlicensed individuals|Payment and sharing of commissions|Charging fees; illegal compensation and its exceptions|Fiduciary capacity and trust accounts|Misrepresentation and false advertising|Defamation and false statements or entries|Notice of adverse underwriting decisions|Rebating and twisting|Referrals|Insurance information and privacy protection',
 'Compare an honest plan comparison, an unlawful inducement, a shared commission with an unlicensed friend and a premium check spent on rent.',
 'Name the conduct from the facts and pick the lawful correction; check statutory exceptions before teaching a blanket ban.');
add('1.3','Know the Maryland provider types',[2],'3; insurers, nonprofit plans and HMOs',
 'Insurers as defined in the Insurance Article|Nonprofit health service plans|Health maintenance organizations under Health-General Title 19',
 'The same employer receives quotes from an insurer, a nonprofit health service plan and an HMO. Explain what each one is.',
 'Distinguish the three Maryland provider types by legal form and regulator, not by brand names.');
add('1.4','Apply Maryland plan requirements',[2],'39, 41, 56; dependents, mandates, small employer, Exchange',
 'Dependent child age limit|Coverage for adopted children and newborns|Medical child support orders|Dependents with intellectual or physical disabilities|Mandated or required offers|Mandated or required benefits|Other Maryland policy requirements|Small employer health insurance|Medicare supplement purpose, definitions and minimum standards|Medicare supplement eligibility, disclosure and marketing|Maryland Health Benefit Exchange: SHOP versus Individual Exchange|Open enrollment and special enrollment|Employer choice options in SHOP; mandated referrals',
 'Marcus’s new baby, Priya’s 14-employee bakery and a court order to cover a child each test a different Maryland requirement.',
 'Apply the actual Maryland rule (for example 31-day newborn notice when a premium is charged) and distinguish it from the federal ACA rule.');
add('1.5','Protect seniors and special-needs buyers in Maryland',[2,3],'45, 48; Medigap and LTC regulation',
 'LTC marketing standards and advertising|LTC consumer guide and outline of coverage|LTC suitability and the personal worksheet|LTC right to return, replacement and renewal|LTC continuation, disclosure and incontestability|LTC inflation protection, unintentional lapse and pre-existing conditions|LTC nonforfeiture and benefit triggers|State income tax treatment of LTC premiums|Medigap marketing standards and advertising|Medigap appropriateness and excessive insurance|Medigap buyer’s guide, outline of coverage and right to return|Medigap replacement and prohibited provisions|Medigap minimum benefit standards and disclosures|Medigap pre-existing conditions and permitted compensation|Medigap guaranteed issue, continuation and conversion|Medicare SELECT',
 'Gloria, 66, is shown an LTC policy and a Medigap replacement in the same visit. List the Maryland protections that apply to each.',
 'Separate Maryland’s LTC rules from its Medigap rules; use the 30-day return right, the 6-month windows and the annual birthday window correctly.');

add('2.1','Explain how insurance handles uncertainty',[3],'1–2; risk, methods, insurability',
 'Risk|Exposure|Hazard|Peril|Loss|Avoidance|Retention|Sharing|Reduction|Transfer|Elements of insurable risks|Adverse selection|Law of large numbers|Reinsurance',
 'Marcus weighs skipping a motorcycle, keeping an emergency fund and buying a medical plan; the insurer buys reinsurance behind him.',
 'Classify the action by what changes (exposure, likelihood, who pays), and keep reinsurance as a transfer between insurers.');
add('2.2','Describe insurers and how they reach the market',[3,4],'3; insurer types and distribution',
 'Stock, mutual and fraternal insurers|Self-insurers|Private versus government insurers|Admitted versus nonadmitted insurers|Domestic, foreign and alien insurers|Financial ratings and operating results|Marketing and distribution systems',
 'Three carriers quote Priya: a Delaware stock company, a Maryland mutual and a self-funded trust. Sort the labels.',
 'Use the legal definitions, including the state-of-incorporation meaning of domestic, foreign and alien.');
add('2.3','Apply agency law to producers',[4],'4; authority and duties',
 'Captive and independent producers|Insurer as principal|Producer as agent of the insurer|Express authority|Implied authority|Apparent authority|Responsibilities to the applicant and insured',
 'Theo tells a client the plan covers a procedure the contract excludes. Whose statement binds whom?',
 'Identify the type of authority from the facts and whose knowledge is imputed to the insurer.');
add('2.4','Build and interpret the insurance contract',[4],'5; elements, characteristics, interpretation',
 'Offer, acceptance, consideration, competent parties and legal purpose|Adhesion and aleatory contracts|Personal, unilateral and conditional contracts|Ambiguity and reasonable expectations|Indemnity and utmost good faith|Representations, misrepresentations and warranties|Concealment and fraud|Waiver and estoppel',
 'An application answer is wrong, a premium is late and the insurer keeps accepting payments. Which doctrine decides each result?',
 'Match the facts to the correct contract characteristic or legal doctrine; do not treat every misstatement as fraud.');
add('2.5','Apply federal rules to health business',[4],'7; FCRA, fraud, ERISA, COBRA, ACA reforms',
 'Fair Credit Reporting Act|Fraud and false statements (18 USC 1033, 1034)|ERISA applicability|ERISA fiduciary responsibilities|ERISA reporting and disclosure|COBRA continuation|ACA market reforms: individual coverage definitions and dependent coverage|ACA market reforms: lifetime and annual limits, premium rating and essential health benefits|ACA market reforms: waiting periods',
 'Priya’s bakery grows past 20 employees and a departing worker asks about continuation. Which federal law now applies and for how long?',
 'Distinguish COBRA from Maryland continuation and ERISA from state insurance regulation; use the correct employee counts and months.');
add('2.6','Know the industry organizations',[5],'7; NAIC',
 'National Association of Insurance Commissioners and model laws',
 'A producer says NAIC approved a policy form. Explain what the NAIC does and does not do.',
 'Recognize the NAIC as a standard-setting body of state regulators, not a licensing authority.');

add('3.1','Define the health perils',[5],'1; accident and sickness',
 'Accidental injury|Sickness|Accidental means versus accidental results',
 'Marcus slips on ice; his daughter develops strep throat. Which peril is each, and why does the wording matter?',
 'Tell accidental injury from sickness and recognize the modern results-based definition.');
add('3.2','Recognize the principal losses and benefits',[5],'6; losses and benefits',
 'Loss of income from disability|Medical expense|Dental expense|Long-term care expense|Vision and prescription benefits|Accidental death and dismemberment|Specified disease',
 'One family has six different coverage needs. Match each need to the benefit type that addresses it.',
 'Identify the benefit type from the loss described, not from the product name.');
add('3.3','Classify health insurance policies',[5],'6; classes of policies',
 'Individual versus group|Private versus government|Limited versus comprehensive',
 'Rosa buys her own plan, Priya’s staff have a group plan and Dennis is on Medicare. Classify each.',
 'Classify a policy on all three axes and know which rules follow from each class.');
add('3.4','Explain limited policies',[5],'8; limited perils and amounts',
 'Limited perils and amounts|Required notice to the insured|Accident-only and specified (dread) disease|Hospital indemnity (income)|Credit disability|Blanket insurance|Prescription drug and vision care|Critical illness|Short-term medical',
 'A hospital-indemnity ad promises “$200 a day.” Explain what the policy pays, what it does not and the notice it must carry.',
 'Recognize a limited policy from its benefit trigger and state why it is not comprehensive medical coverage.');
add('3.5','Apply the common exclusions',[5],'9; exclusions',
 'Pre-existing conditions|Intentionally self-inflicted injuries|War or act of war|Elective cosmetic surgery|Conditions covered by workers compensation|Government plans|Participation in a felony or illegal occupation',
 'Four claims arrive: a workplace injury, reconstructive surgery after an accident, a cosmetic procedure and an injury during a burglary. Which are excluded?',
 'Apply each exclusion to facts and distinguish elective cosmetic surgery from reconstructive care.');
add('3.6','Meet producer responsibilities in individual health',[5],'10–11; marketing, field underwriting, delivery',
 'Advertising requirements|Prohibited advertising of life and health insurance|Maryland Life and Health Insurance Guaranty Corporation|Sales presentations|Nature and purpose of field underwriting|Application procedures|Requirements at delivery of the policy|Errors and omissions|Notification of Medicare eligibility',
 'Theo helps Rosa apply: he must collect accurate answers, deliver the policy and never promise a guaranty-corporation backstop in his sales talk.',
 'Describe the producer’s duties at each stage and the limits on what may be said about the guaranty corporation.');
add('3.7','Explain insurer underwriting',[5,6],'12–13; information, discrimination, classification',
 'Underwriting criteria|Application and producer report|Attending physician statement|Investigative consumer (inspection) report|Medical Information Bureau|Medical examinations, lab tests and HIV consent|Unfair discrimination|Discrimination against victims of domestic violence|Genetic information privacy|Preferred, standard, substandard and declined classes',
 'An underwriter requests an APS, an MIB report and an inspection report on Rosa, then rates her substandard. Explain each step and its limits.',
 'Identify the information source and the lawful use of each; recognize unlawful discrimination categories under Maryland law.');
add('3.8','Replace health insurance responsibly',[6],'14; replacement considerations',
 'Pre-existing conditions and new exclusion periods|Benefits, limitations and exclusions comparison|Underwriting requirements on replacement',
 'Rosa is offered a cheaper plan. Compare waiting periods, exclusions and underwriting before she drops the old one.',
 'Weigh the replacement by what the client could lose, not only by premium.');

add('4.1','Apply the uniform required provisions',[6],'15–16; required provisions',
 'Entire contract and changes|Time limit on certain defenses|Grace period|Reinstatement|Notice of claim|Claim forms|Proofs of loss|Time of payment of claims|Payment of claims|Physical examinations and autopsy|Legal actions|Change of beneficiary|Cancellation by the insured',
 'Marcus misses a premium, is injured, then files late. Walk the grace, reinstatement, notice, proof and payment clocks in order.',
 'Apply the correct day count to the correct provision; keep the 2-year defenses limit separate from the claim clocks.');
add('4.2','Apply the uniform optional provisions',[6],'17; optional provisions',
 'Change of occupation|Misstatement of age|Other insurance in this company|Insurance with other companies: expense-incurred basis and other benefits|Relation of earnings to insurance|Unpaid premium|Cancellation by the company|Conformity with state statutes|Illegal occupation|Intoxicants and narcotics',
 'Rosa changes to a riskier trade and understates her age. Show how each optional provision adjusts the benefit.',
 'Compute the adjusted benefit for occupation and age misstatements and recognize when a claim may be denied.');
add('4.3','Read the other general provisions',[6,7],'17; free look, clauses, renewability',
 'Right to examine (free look)|Insuring clause and consideration clause|Noncancelable|Guaranteed renewable|Conditionally renewable|Renewable at the option of the insurer|Nonrenewable (cancelable, term)|Interest on claim proceeds|Military suspension provision',
 'Five renewability clauses: tell which lets the insurer raise rates, which lets it cancel and which locks both.',
 'Rank the renewability clauses by insured protection and identify premium and cancellation rights under each.');

add('5.1','Qualify for disability benefits',[7],'28; definitions of disability',
 'Own occupation|Any occupation|Pure loss of income (income replacement)|Presumptive disability|Requirement to be under physician care',
 'Rosa the electrician can no longer climb but could work a desk. Which definition pays and for how long?',
 'Apply the policy’s definition to the facts and recognize presumptive-disability triggers.');
add('5.2','Design individual disability income coverage',[7],'29–31; benefits, periods, riders',
 'Monthly indemnity benefit|Elimination and benefit periods|Waiver of premium|Partial disability benefits|Additional monthly benefit and social insurance supplement|Occupational versus nonoccupational coverage|Residual disability benefit|COLA and future increase option riders|Annual renewable term rider; relation of earnings; change of occupation|AD&D, rehabilitation and medical reimbursement benefits|Return of premium and cash value refund provisions|Exclusions',
 'Rosa chooses a 90-day elimination period, benefits to 65, a residual rider and a FIO rider. Explain how each works when she is hurt.',
 'Compute when benefits start and how long they last; match each rider to the need it meets.');
add('5.3','Underwrite disability income',[7],'32; unique aspects',
 'Occupational considerations|Benefit limits (income replacement ratio)|Policy issuance alternatives (rating, exclusion riders, modified benefits)',
 'An underwriter offers Rosa a policy with a back-injury exclusion rider instead of declining. Why?',
 'Explain why occupation and income drive DI underwriting and recognize issuance alternatives.');
add('5.4','Compare group disability plans',[7],'33; STD and LTD',
 'Group versus individual disability plans|Short-term disability|Long-term disability',
 'Priya’s bakery adds STD and LTD. Show the benefit percentages, waiting periods and how they coordinate.',
 'Distinguish STD from LTD and group from individual features such as portability and definitions.');
add('5.5','Protect the business from disability',[7],'33; business policies',
 'Key employee disability income|Business overhead expense policy|Business disability buyout policy',
 'Priya’s head baker is disabled. Which policy keeps the rent paid, which replaces the baker and which buys out a partner?',
 'Match each business disability policy to the need it funds and who owns and receives the benefit.');
add('5.6','Explain Social Security disability',[8],'34; Social Security',
 'Qualification for Social Security disability|Definition of disability|Waiting period|Disability income benefits',
 'Rosa applies for Social Security disability. Explain the strict definition and the 5-month wait.',
 'State the federal definition and waiting period and distinguish them from private DI terms.');
add('5.7','Explain workers compensation',[8],'34; workers compensation',
 'Eligibility for workers compensation|Workers compensation benefits',
 'Rosa is hurt on a job site. Which program pays first, and what does her DI policy do?',
 'Recognize workers compensation as the primary payer for occupational injuries and its benefit categories.');

add('6.1','Explain medical plan concepts',[8],'18; concepts',
 'Fee-for-service versus prepaid basis|Specified coverages versus comprehensive care|Benefit schedule versus usual, reasonable and customary charges|Any provider versus limited choice of providers|Insureds versus subscribers and participants',
 'Two quotes for Marcus: one reimburses UCR charges from any provider, the other prepays a network. Translate the jargon.',
 'Pair each concept with its opposite and identify which plan type uses which.');
add('6.2','Compare the types of plans and providers',[8,9],'19–22; major medical, service plans, HMO, PPO, POS, TRICARE',
 'Major medical characteristics, limitations and exclusions|Deductibles|Coinsurance|Stop-loss and maximum benefits|Fixed indemnity plans|Health service plan definitions and plans offered|Health service plan providers, panels, disclosure and subscribers|HMO: combined delivery and financing; service area|HMO: gatekeeper, copayments, prepaid basis|HMO: preventive, primary versus referral, emergency and hospital services|PPO general characteristics; open versus closed panel|POS plans: out-of-network access, PCP referral, indemnity features|TRICARE',
 'Marcus has a $3,000 deductible, 80/20 coinsurance and a $6,000 stop-loss; a $20,000 bill arrives. Compute what he pays, then compare an HMO and a PPO.',
 'Compute cost sharing correctly and distinguish HMO, PPO and POS by network, referral and payment rules.');
add('6.3','Contain costs and coordinate benefits',[9],'23; cost containment and COB',
 'Preventive care, outpatient and alternatives to hospital services|Prospective and concurrent utilization review|Coordination of benefits',
 'Both spouses have group coverage and a child is hospitalized. Decide primary and secondary payers and the review steps.',
 'Apply the birthday rule and explain why utilization review happens before and during care.');
add('6.4','Apply HIPAA requirements',[9],'24; HIPAA',
 'HIPAA eligibility|Guaranteed issue|Pre-existing conditions and creditable coverage|Renewability',
 'A worker leaves a group plan and buys individual coverage. Which HIPAA protections travel with her?',
 'State what HIPAA guarantees and what the ACA later changed about pre-existing conditions.');
add('6.5','Use HSAs and HRAs',[9],'25; HSA and HRA',
 'HSA definition and eligibility|HSA contribution limits|HRA definition and funding',
 'Rosa pairs an HDHP with an HSA. Check eligibility and the current contribution limits.',
 'Apply the current-year limits and eligibility tests; distinguish HSA ownership from HRA funding.');
add('6.6','Apply the Affordable Care Act',[9],'26–27; ACA',
 'Coverage of children to age 26|Preventive care without cost sharing|Pre-existing conditions and rescissions|Lifetime and annual limits|Grandfathered versus non-grandfathered plans|Essential health benefits|Metal levels|SHOP payment and billing|Internal appeal and external review|Subsidies and premium tax credits|Penalties and fines',
 'Marcus’s 24-year-old stays on his plan, picks a silver plan and appeals a denial. Trace each ACA rule.',
 'Apply the ACA rule that governs each fact and compare actuarial values of metal levels.');

add('7.1','Describe group insurance',[9],'35; characteristics',
 'Group contract and master policy|Certificate of coverage|Experience rating versus community rating',
 'Priya holds the master policy; her staff hold certificates. Explain who owns what and how the premium is set.',
 'Distinguish the contract holder from certificate holders and experience from community rating.');
add('7.2','Identify eligible groups',[9],'35; defined groups',
 'Employer groups|Creditor groups|Labor unions|Multiple employer trusts|Associations|Credit unions',
 'Six organizations want group coverage. Which are eligible groups, and what makes them eligible?',
 'Recognize each defined group and the eligibility concern it raises.');
add('7.3','Market group plans correctly',[9,10],'36; marketing',
 'Group advertising|Regulatory jurisdiction and place of delivery',
 'A master policy is delivered in Delaware for a Maryland employer. Whose law governs the certificates?',
 'Apply the place-of-delivery rule and the advertising standards to group sales.');
add('7.4','Underwrite and administer employer groups',[10],'36–38; eligibility, COB, change of carriers, continuation',
 'Insurer underwriting of the group: characteristics, plan design, persistency, administration|Annual open enrollment|Employee and dependent eligibility|Coordination of benefits|Coinsurance and deductible carryover|No-loss no-gain|Events that terminate coverage|Reinstatement for military personnel and notification of Medicare eligibility|Extension of benefits|COBRA and Maryland continuation rules|Conversion privilege|Special enrollment periods|Minimizing adverse selection',
 'Priya switches carriers in July, a worker is called to duty and another leaves. Apply carryover, no-loss no-gain, continuation and conversion.',
 'Apply each group provision to the event that triggers it and distinguish federal COBRA from Maryland’s 18-month rules.');
add('7.5','Serve small employers',[10],'39; small employer plans',
 'Definition of small employer|Availability of coverage (guaranteed issue)|Disclosure of coverage provisions|Enrollment eligibility|Renewability',
 'Priya’s bakery has 14 full-time and 6 part-time workers. Is it a small employer, and what must a carrier offer?',
 'Count employees the Maryland way and apply guaranteed availability and renewability.');

add('8.1','Know the types of dental treatment',[10],'40; treatment types',
 'Diagnostic and preventive|Restorative|Oral surgery|Endodontics and periodontics|Prosthodontics and orthodontics',
 'A dental claim lists a cleaning, a filling, a root canal and braces. Classify each service.',
 'Classify dental services into the categories plans use for cost sharing.');
add('8.2','Explain dental indemnity plans',[10],'40; indemnity plans',
 'Choice of providers|Scheduled versus nonscheduled plans|Benefit categories: preventive, basic and major|Deductibles, coinsurance and combination plans|Exclusions and limitations|Predetermination of benefits',
 'A plan pays 100/80/50 across categories with a $50 deductible. Compute the cost of a crown and explain predetermination.',
 'Compute dental cost sharing by category and explain why predetermination is requested.');
add('8.3','Design employer group dental',[10,11],'40; group dental',
 'Integrated versus stand-alone deductibles|Minimizing adverse selection in dental',
 'Priya adds dental. Compare an integrated deductible with a stand-alone plan and the waiting periods that control selection.',
 'Explain how plan design limits adverse selection in voluntary dental benefits.');

add('9.1','Explain Medicare',[11],'42–43; Parts A–D',
 'Nature, financing and administration of Medicare|Part A eligibility and enrollment|Part A coverages and cost sharing|Part B eligibility and enrollment|Part B coverages, cost sharing and exclusions|Claims terminology: assignment, approved amount, excess charges|Part C Medicare Advantage|Part D prescription drug coverage',
 'Dennis turns 65 in March. Map his enrollment windows, what A and B cover and the Part D cap.',
 'Apply the enrollment periods and cost-sharing structure; treat dollar amounts as annually indexed.');
add('9.2','Explain Medicare supplement insurance',[11],'44; Medigap',
 'Purpose of Medicare supplement insurance|Open enrollment|Attained-age, issue-age and community rating|Standardized plans: core benefits|Standardized plans: additional benefits|High-deductible plans',
 'Dennis compares Plan G quotes rated three ways. Which price pattern will he see over time?',
 'Explain standardized plans and rating methods and apply the open-enrollment protection.');
add('9.3','Compare other options with Medicare',[11],'46; employer plans and Medicaid',
 'Employer group plans and Medicare: disabled employees|Employer group plans and Medicare: kidney failure|Employer group plans and Medicare: age 65 and older|Medicaid eligibility|Medicaid benefits',
 'Dennis keeps working at a 60-employee firm. Who pays first, and when would Medicaid ever apply?',
 'Determine primary and secondary payer by employer size and reason for Medicare eligibility.');
add('9.4','Explain long-term care policies',[11,12],'47; LTC',
 'LTC compared with Medicare and Medicaid|Eligibility for benefits (ADLs and cognitive impairment)|Levels of care: skilled, intermediate, custodial|Home health, adult day and respite care|Benefit periods and benefit amounts|Inflation protection, nonforfeiture, guarantee of insurability and return of premium|Qualified and nonqualified policies|Exclusions and underwriting considerations|Partnership policies',
 'Gloria needs help with bathing and dressing. Which trigger applies, which care level fits and what a Partnership policy protects.',
 'Apply benefit triggers and levels of care; distinguish tax-qualified features and Partnership asset protection.');
add('9.5','Coordinate LTC with other coverage',[12],'46; interaction',
 'LTC and Medicare|LTC and Medicaid|LTC and medical insurance',
 'Gloria assumes Medicare will pay for a nursing home. Correct the assumption and show what each program covers.',
 'State what Medicare, Medicaid and medical insurance each pay toward long-term care.');

add('10.1','Tax personally owned health coverage',[12],'57; personal coverage',
 'Disability income: premiums and benefits|Medical expense: premiums and benefits|Long-term care: premiums and benefits',
 'Rosa pays her own DI and medical premiums. Which are deductible, and are the benefits taxable?',
 'Apply the premium-deduction and benefit-taxation rules for individually owned coverage.');
add('10.2','Tax employer group health coverage',[12],'58; employer plans',
 'Group disability income: STD and LTD|Group medical and dental expense|Group long-term care|Group accidental death and dismemberment',
 'Priya pays the LTD premium for staff. Why are their benefits taxable when hers are not?',
 'Trace who paid the premium to decide whether a benefit is taxable.');
add('10.3','Tax sole proprietors and partners',[12],'58; self-employed medical',
 'Medical expense coverage for sole proprietors and partners',
 'Rosa, self-employed, deducts her health premiums. Where and how?',
 'Apply the self-employed health insurance deduction and its limits.');
add('10.4','Tax business disability insurance',[12],'58; business DI',
 'Key person disability income taxation|Business overhead expense taxation|Business disability buyout taxation',
 'Priya’s bakery owns three business disability policies. Which premiums are deductible and which benefits are taxable?',
 'Apply the premium and benefit tax rules to each business disability policy.');
add('10.5','Tax HSAs, HRAs and FSAs',[12],'57; accounts',
 'Health savings accounts|Health reimbursement arrangements|Flexible spending accounts|High-deductible health plans',
 'Marcus has an FSA at work; Rosa has an HSA. Compare contributions, ownership, rollover and taxation.',
 'Distinguish the three accounts by owner, funding source and tax treatment.');

export const coverageRows = rows;

// Verified source references used across the Health course (checked November 9, 2026).
export const sources = [
 ['Prometric outline, Accident and Health or Sickness Producer, Series 20-24','https://www.prometric.com/sites/default/files/2021-09/2024_accident_and_health_or_sickness_producer_9.21.21.pdf','Archived copy in outline/; prometric.com blocks direct download.'],
 ['Newborn and adopted child coverage, §15–401','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-401','From birth or date of adoption; 31-day notice applies only when a premium is charged.'],
 ['Dependent children after a spouse’s death, §15–404','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-404','Add within 6 months, no evidence of insurability.'],
 ['Medical child support orders, §15–405','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-405','Carrier acts within 20 business days of a medical support notice.'],
 ['Continuation after death of the insured, §15–407','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-407','45-day election, 18 months, 3-month prior coverage.'],
 ['Continuation after divorce, §15–408','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-408','Ends on remarriage or other coverage; termination statement.'],
 ['Continuation after loss of employment, §15–409','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-409','Not for cause; 45-day election; 18 months.'],
 ['Child dependent coverage to age 25, §15–418','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-418','Unmarried, under 25; ACA requires 26 for plans it governs.'],
 ['Alzheimer’s and elderly care option, §15–801','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-801','Mandated offer in group expense-incurred policies.'],
 ['Mental health and substance use parity, §15–802','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-802','Mandated benefit; partial hospitalization at least 60 days.'],
 ['Off-label drug use, §15–804','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-804','Mandated benefit.'],
 ['In vitro fertilization, §15–810','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-810','Three attempts per live birth, $100,000 lifetime; religious organization exception.'],
 ['Hearing aids for minors, §15–838','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-838','$1,400 per ear every 36 months.'],
 ['Morbid obesity surgery, §15–839','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-839','BMI 40, or 35 with comorbidity.'],
 ['Tobacco cessation drugs, §15–841','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-841','Two 90-day NRT courses per policy year.'],
 ['Medicare supplement minimum standards, §15–906','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-906','Benefits track Medicare changes; Medicaid suspension up to 24 months.'],
 ['Medicare supplement guaranteed issue and birthday window, §15–909','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-909','6-month windows; Plans A and D under 65; 30-day birthday window since July 1, 2023.'],
 ['Medicare supplement 30-day right to return, §15–910','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-910','Notice on first page.'],
 ['Small employer rating, §15–1205','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-1205','No denial for health status; age up to 3:1, tobacco 1.5:1 since 2014.'],
 ['Prompt payment of claims, §15–1005','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=15-1005','30 days; interest 1.5%, 2%, 2.5% per month.'],
 ['LTC application questions, §18–104','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=18-104','Clear health questions; listed medications limit rescission.'],
 ['LTC applicants 80 and older, §18–105','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=18-105','Exam, functional assessment or records before issue.'],
 ['Small employer definition, §31–101','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=31-101','Average of not more than 50 employees; FTE hours divided by 120.'],
 ['Maryland LTC income tax credit, Tax-General §10–718','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gtg&section=10-718','Up to $500 per insured per year; not if claimed before or covered before July 1, 2000.'],
 ['Continuing education, §10–116','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=10-116','CE completed at least 15 days before expiration.'],
 ['Appointments, §10–118','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=10-118','Insurer register; 30-day duties.'],
 ['Discipline and reporting, §10–126','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=10-126','Criminal reporting runs from initial appearance.'],
 ['Prelicensing change, Bulletin 24-19','https://insurance.maryland.gov/Pages/Bulletins/24-19-Repealing-the-Prelicensing-Education-and-Experience-Requirements.aspx','No mandatory approved prelicensing course after October 1, 2024.'],
 ['IRS Rev. Proc. 2025-19 (2026 HSA and HDHP amounts)','https://www.irs.gov/pub/irs-drop/rp-25-19.pdf','$4,400 / $8,750; HDHP $1,700 / $3,400; OOP $8,500 / $17,000; catch-up $1,000.'],
 ['Medicare costs (annually indexed)','https://www.medicare.gov/basics/costs/medicare-costs','2026: Part B $202.90 and $283 deductible; Part A $1,736; Part D cap $2,100. Teach structure, not fixed numbers.'],
 ['COMAR 31.14.01 Long-Term Care Insurance','https://regulations.justia.com/states/maryland/title-31/subtitle-14/chapter-31-14-01/','Suitability worksheet (.25), existing coverage inquiry (.16–.17), contestability (.33).']
].map(([title,url,note])=>({title,url,note}));
