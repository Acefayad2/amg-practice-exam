// Original AMG planning objectives. IDs refer to Prometric outline subsections.
// A planning assignment or question-bank match is not completed instruction.
export const sections = [
  ['1','Maryland regulation',24], ['2','General insurance',8], ['3','Life foundations',14],
  ['4','Policy types',8], ['5','Provisions, options and riders',11], ['6','Annuities',7],
  ['7','Federal taxation',6], ['8','Qualified plans',2]
].map(([id,title,items])=>({id,title,items,share:items*1.25}));

const rows = [];
const add = (id,title,pages,lesson,topics,example,assessment) => rows.push({id,title,pages,lesson,topics:topics.split('|'),example,assessment});
add('1.1','Obtain and maintain the right authority',[1],'24–26; split licensing, appointments and discipline',
 'Why licensing exists; definitions|Initial eligibility, examination, application and fee|Producer, adviser, nonresident and business-entity licenses|Viatical licensing; exceptions and temporary authority|License duration, termination, renewal and CE|Address/name changes and assumed names|Criminal and other-jurisdiction reporting|Producer contract versus appointment; individual versus agency appointment|Solicitation before appointment and appointment after licensing|Appointment notice, cessation, termination and lack of active appointments|Probation, suspension, revocation, denial and nonrenewal|Cease-and-desist orders, penalties and hearing rights|Insurance fraud',
 'A new recruit changes address, receives an appointment and later faces an administrative action. Sort the separate duties and deadlines.',
 'Identify authority and required next action; use current Maryland deadlines, including criminal prosecution reporting rather than only conviction.');
add('1.2','Regulate insurers and producer conduct',[1,2],'26–28, 30–31; separate sales, money and oversight',
 'MIA powers and duties|Insurer authorization, forms and claims oversight|Acting for an unauthorized insurer|Records and permitted work by unlicensed people|Commissions, sharing, fees and compensation exceptions|Fiduciary duties, commingling and trust accounts|Advertising and misleading policy descriptions|False advertising, defamation and false financial statements|Boycott, coercion and intimidation|Inducements, rebating and unfair discrimination|Blank forms, twisting and referrals|Information and privacy protection',
 'Compare an honest policy comparison, an unlawful inducement and misuse of a premium check.',
 'Name the conduct from facts and select the lawful correction; check statutory exceptions instead of teaching blanket bans.');
add('1.3','Apply Maryland life transaction rules',[2],'10, 29–30',
 'Replacement definitions, duties and notices|Group eligibility and dependent coverage|Required group provisions and conversion|Assignment of group proceeds|Guaranty corporation purpose, eligibility, limits and advertising restrictions',
 'An employee leaves work while another client replaces an old policy. Use separate checklists for each transaction.',
 'Distinguish conversion from replacement; apply actual state provisions and identify what guaranty protection does not promise.');
add('2.1','Explain how insurance handles uncertainty',[2,3],'01–02 plus next Part 3: risk handling and insurability',
 'Risk|Exposure|Hazard|Peril|Loss|Avoidance|Retention|Sharing|Reduction|Transfer|Insurable-risk characteristics|Adverse selection|Law of large numbers|Reinsurance',
 'Daniel compares avoiding a hazard, retaining a cost and transferring financial risk; show the insurer separately transferring risk to another insurer.',
 'Classify changed scenarios; explain why pooling cannot predict an individual claim. Add missing risk-handling and reinsurance questions.');
add('2.2','Identify the insurer and distribution model',[3],'02 supplement; separate from the existing pooling video',
 'Stock and mutual-assessment organizations|Fraternal societies|Private and governmental insurers and plans|Admitted and nonadmitted status|Purchasing groups|Domestic, foreign and alien domicile|Financial ratings and operating results|Distribution systems|Guaranty corporation relationship',
 'One insurer is formed in another state and licensed in Maryland. Separate domicile, authorization and ownership.',
 'Classify the same insurer on each dimension; avoid treating a financial rating as a guarantee.');
add('2.3','Recognize agency relationships',[3],'03A: agency',
 'Captive and independent producers|Insurer as principal and producer as agent|Express authority|Implied authority|Apparent authority|Duties to applicants and insureds',
 'A producer makes a promise beyond written authority; determine who created the appearance of authority.',
 'Choose the authority type and proper producer action from plausible alternatives.');
add('2.4','Read an insurance contract correctly',[3],'03B–C: contracts and interpretation',
 'Offer and acceptance|Consideration|Capacity and lawful purpose|Adhesion|Aleatory exchange|Personal-contract concept and life-policy assignability|Unilateral and conditional promises|Ambiguity and reasonable expectations|Indemnity compared with a stated life benefit|Utmost good faith|Representations and misrepresentations|Warranties|Concealment and fraud|Waiver and estoppel',
 'Trace application, premium and insurer acceptance, then contrast an ambiguous clause with a clear exclusion.',
 'Identify the contract element or doctrine; avoid promising that expectations override every clear exclusion.');
add('2.5','Recognize federal oversight',[3,4],'31A: federal requirements',
 'Consumer reports and FCRA rights|Federal insurance fraud and false statements|Securities oversight of variable products',
 'An application requires an investigative report and the product has investment subaccounts.',
 'Match the correct disclosure and regulator; distinguish insurance licensing from securities registration.');
add('2.6','Distinguish industry organizations',[4],'31B: who makes, coordinates or administers rules',
 'NAIC role|Interstate insurance product compact and IIPRC role|NCOIL role|Industry and producer associations',
 'Route a consumer complaint, model-law question and compact product filing to different organizations.',
 'Separate state enforcement, model standards, compact review and professional associations.');
add('3.1','Establish insurable interest',[4],'05A',
 'Family and economic interest|Time the contract is made|Own-life purchases versus insurance on another',
 'Compare a spouse, a creditor with economic exposure and an unrelated stranger seeking a death payout.',
 'Select the legally relevant interest and timing, using §12–201.');
add('3.2','Connect protection to personal needs',[4],'05B',
 'Survivor support|Estate planning|Cash accumulation|Liquidity|Estate conservation|Personal mortgage debt protection',
 'A family needs immediate cash after a death and income through a child’s schooling.',
 'Identify the purpose without implying every household needs the same product.');
add('3.3','Explain life and viatical settlements',[4],'18B; dedicated settlement lesson',
 'Purpose and transaction structure|Broker authority and licensing|Consumer disclosures|General transaction rules|Settlement fraud|Chronic illness and terminal illness definitions|Fraudulent settlement acts|Broker, provider, purchaser and viator roles',
 'An owner considers selling a policy to a third party; distinguish the people and the effects on beneficiaries.',
 'Compare a settlement with surrender and accelerated benefits; verify Maryland definitions and consumer rights.');
add('3.4','Estimate protection needs',[4],'05C',
 'Human-life-value method|Needs-based method|Fact gathering|Lump-sum obligations|Income replacement|Social Security survivor benefits',
 'Use fictional income, debts, resources and time horizons in a worksheet with explicit assumptions.',
 'Calculate a stated need and identify missing facts; do not promise Social Security eligibility or benefit amounts.');
add('3.5','Match business protection to the loss',[4],'18A',
 'Buy-sell funding|Key-person protection|Executive bonus arrangements',
 'A business loses an owner versus an essential employee; follow ownership and benefit flows.',
 'Choose the arrangement, policyowner and beneficiary appropriate to the stated objective.');
add('3.6','Classify coverage before comparing products',[4],'06, 08, 10, 16 and a government-plan supplement',
 'Individual versus group|Ordinary life|Permanent versus temporary protection|Participating versus nonparticipating|Fixed versus variable life and annuity designs|Variable products and FINRA|U.S. government life programs',
 'Classify a policy on several independent dimensions rather than treating each label as a competing product.',
 'Identify which guarantees, participation features and regulatory requirements belong to the stated design.');
add('3.7','Explain premium construction',[4,5],'11 supplement: pricing',
 'Mortality assumption|Interest assumption|Expenses|Net single premium|Gross annual premium|Payment mode',
 'Build a simplified price from mortality, interest and expenses, then compare annual and monthly modes.',
 'Distinguish an illustrative expected claim cost from an actual premium.');
add('3.8','Handle application through delivery',[5],'11–12, 29 and 31; split workflow checkpoints',
 'Life and annuity advertising|Sales presentations and guaranty advertising restrictions|Illustrations|Policy summary and buyer guide|Cost and benefit disclosure|Replacement|Use of insurance information|Field underwriting|Information-practices notices and adverse decisions|Application signatures|Application corrections and incompleteness|Representations versus warranties|Initial premium and receipt conditions|Point-of-sale privacy and HIV consent|PATRIOT Act and anti-money-laundering duties|Delivery review and effective date|Premium collection and good-health statement',
 'Follow a client’s file from first conversation to delivery, pausing where a missing signature or changed health matters.',
 'Select the next required action; teach Maryland disclosure timing from current rules, not generic deadlines.');
add('3.9','Evaluate applications fairly',[5],'11B and 31',
 'Application and producer report|Attending physician statement|Investigative consumer report|MIB information|Medical examination, laboratory results and HIV|Permitted selection and unfair discrimination|Domestic-violence protections|Preferred risk|Standard risk|Substandard risk|Declined application',
 'Compare permitted information and classification decisions in several fictional files.',
 'Identify information sources and legal limits without stereotypes or unsupported denial-rate claims.');
add('4.1','Choose and distinguish term designs',[5,6],'06–07',
 'Level benefit|Annual renewal|Level premium period|Conversion|Decreasing benefit|Increasing benefit|Return-of-premium term',
 'Overlay premium and benefit timelines for level, renewable and decreasing term.',
 'Change duration or renewal facts so students cannot answer from the word term alone.');
add('4.2','Distinguish permanent designs',[6],'06 and 08A–B',
 'Ordinary and continuous-pay whole life|Limited-pay whole life|Interest-sensitive and current-assumption designs|Indexed/equity-indexed designs|Graded premiums|Single premiums|Variable whole life|Variable universal life',
 'Separate premium schedules, cash-value guarantees and investment risk on product cards.',
 'State product assumptions; do not transfer a whole-life guarantee to every variable or universal design.');
add('4.3','Explain adjustable and universal coverage',[6],'08C',
 'Adjustable life changes|Universal life funding, charges and guarantees',
 'A policyowner pays less for several months; show charges continuing and possible lapse risk.',
 'Distinguish flexible payments from guaranteed lifetime coverage without funding.');
add('4.4','Match specialized coverage',[6],'09',
 'Family protection and family plans|First-death joint coverage|Last-survivor coverage|Juvenile and student coverage',
 'Use a two-life timeline to show first and second death triggers, then add a child rider comparison.',
 'Identify who is insured and which event produces a benefit.');
add('4.5','Understand group coverage',[6],'10A–B',
 'Master contract and certificates|Employer groups|Debtor groups|Labor unions|Trust groups|Associations|Group underwriting|Benefit payment|Dependents and covered lives|Individual conversion|Contributory and noncontributory funding',
 'An employee enrolls late, adds coverage, then leaves employment.',
 'Apply eligibility and evidence rules to the stated situation instead of saying no group applicant needs evidence.');
add('4.6','Explain credit life',[6],'09 supplement',
 'Individual credit life|Group credit life',
 'Follow the remaining debt and benefit recipient when a borrower dies.',
 'Distinguish credit life from a personally owned mortgage-protection policy.');
add('5.1','Use policy rights and time limits',[6],'04, 12–14; separate state timelines',
 'Owner rights|Assignment|Entire contract|Free look|Premium payments|Grace|Reinstatement|Incontestability|Misstated age and gender|Suicide exclusion|War exclusion|Interest on proceeds|Prohibited provisions and backdating',
 'Place delivery, missed premium, lapse, reinstatement and death on separate timelines.',
 'Use the correct trigger and Maryland rule; contrast a validity challenge with a contractual exclusion.');
add('5.2','Direct benefits to the intended recipient',[6,7],'14A–B',
 'Individual and class designations|Estate beneficiary|Minor beneficiary|Trust beneficiary|Primary and contingent succession|Revocable and irrevocable designation|Annulment and divorce|Common disaster|Facility of payment',
 'An owner names a minor, later changes family status, and dies in a common accident with the primary beneficiary.',
 'Trace recipient priority under explicit policy and legal assumptions.');
add('5.3','Compare life settlement payment options',[7],'15',
 'Lump sum|Interest-only payments|Fixed period|Fixed amount|Lifetime income|Single life|Joint and survivor income',
 'A beneficiary chooses a fixed monthly amount versus a fixed payment duration.',
 'Identify what is fixed and what can vary; distinguish payment options from selling a policy.');
add('5.4','Preserve value after stopping premiums',[7],'16A',
 'Cash surrender|Extended term|Reduced paid-up coverage',
 'Use the same policy value to compare cash, temporary full coverage and smaller permanent coverage.',
 'Distinguish duration, face amount and continuing premiums.');
add('5.5','Use policy borrowing and withdrawals',[7],'16B',
 'Cash-value loan|Automatic premium loan|Partial withdrawal/surrender|Educational loans|Required automatic option referenced by the outline',
 'A policy has unpaid debt when the insured dies; separately compare taking a withdrawal.',
 'Calculate net proceeds including interest. Resolve the outline’s ambiguous automatic-option wording before teaching it as a Maryland duty.');
add('5.6','Apply dividends correctly',[7],'16C',
 'Cash dividend|Premium reduction|Interest accumulation|One-year term purchase|Paid-up additions|Paid-up insurance',
 'The same dividend is taken as cash, accumulated, or used to buy extra coverage.',
 'Separate dividend use from nonforfeiture choices; distinguish nonguaranteed dividends from contractual cash values.');
add('5.7','Keep disability-related life riders distinct',[7],'17A',
 'Premium waiver|Cost-of-insurance waiver|Disability income benefit|Juvenile payor life/disability benefit',
 'A parent paying a child’s policy becomes disabled; compare who must qualify and what payment is waived.',
 'Do not equate waived premiums with income paid to the insured. These life riders remain in life-only scope.');
add('5.8','Explain benefits paid before death',[7,8],'17B',
 'Terminal or catastrophic illness|Permanent confinement|ADL triggers|Written disclosures|Death-benefit reduction|Effects on cash value|Loans and interest|Tax treatment|Premium effects',
 'An owner considers accelerating benefits; show before-and-after values and disclosure questions.',
 'Distinguish contract triggers, payment limits and remaining coverage without universal percentages.');
add('5.9','Add insured family members',[8],'17C',
 'Spouse or other-insured term rider|Children’s term rider|Family term rider',
 'Identify the base insured and people added under different riders.',
 'Choose the rider that covers the named person and stated event.');
add('5.10','Recognize additional death-benefit riders',[8],'17C',
 'Accidental death|Guaranteed insurability|Cost-of-living adjustment|Return-of-premium rider',
 'A client wants future purchases without new health evidence; compare with inflation adjustment.',
 'Match the trigger and purpose, keeping riders separate from similarly named base policies.');
add('6.1','Explain annuity roles and phases',[8],'19',
 'Accumulation phase|Annuitization phase|Owner|Annuitant|Beneficiary|Insurance function|Suitability',
 'Different people own the contract, measure the lifetime income and receive death benefits.',
 'Identify roles and longevity protection without confusing annuities with life insurance.');
add('6.2','Compare immediate and deferred contracts',[8],'19–20',
 'Single-premium immediate income|Deferred accumulation|Premium payment choices|Nonforfeiture values|Surrender charges|Bailout provisions|Death benefits',
 'Compare money needed now with income planned ten years later; show early-exit costs.',
 'Separate insurer surrender charges from federal additional taxes.');
add('6.3','Trade income guarantees against payments',[8],'20A',
 'Life-contingent income|Pure life and guaranteed minimum payments|Single and multiple lives|Fixed-period certain|Fixed-amount certain',
 'A retiree dies shortly after income begins under pure-life and period-certain options.',
 'Determine which payments stop and which can continue under stated terms.');
add('6.4','Distinguish annuity investment designs',[8],'20B',
 'Fixed: general account, minimum/current rate and level-benefit design|Variable: separate-account investment exposure and variable benefits|Indexed crediting|Market-value-adjusted/modified-guaranteed contracts',
 'Change market returns, declared rates and surrender timing for three different products.',
 'Correct the outline’s apparent repeated fixed-account bullets under variable annuities; confirm mechanics against authoritative product sources.');
add('6.5','Assess annuity uses and suitability',[8],'20C',
 'Lump-sum funding|Qualified group/individual plans|IRAs|Tax deferral|Retirement income|Education funding|Charitable gift annuities|Suitability in transactions',
 'A client needs emergency liquidity while considering a long surrender schedule.',
 'Recognize unsuitable funding assumptions and current Maryland transaction duties; listing a use does not recommend it.');
add('7.1','Separate life-policy tax events',[8,9],'21A',
 'Owner cash values|Dividends|Policy loans|Surrenders|Beneficiary general rule and exceptions|Tax treatment of settlement payments|Estate inclusion',
 'Follow premium basis, cash surrender gain, a loan and death proceeds through distinct events.',
 'Keep income tax and estate inclusion separate; identify policy-lapse-with-loan and other exceptions.');
add('7.2','Recognize MEC consequences',[9],'21B',
 'MEC versus non-MEC status|Seven-pay test|Distribution and loan taxation',
 'Compare the same withdrawal from a MEC and a non-MEC under explicit assumptions.',
 'Allocate earnings and basis; apply additional tax only to taxable amounts when applicable.');
add('7.3','Tax nonqualified annuity distributions',[9],'22A',
 'Accumulation withdrawals|Annuitized payments and exclusion ratio|Death distributions|Corporate ownership',
 'Use separate earnings/basis buckets for a partial withdrawal, full surrender and periodic income.',
 'State issue date and distribution type so incompatible tax rules are never mixed.');
add('7.4','Compare traditional and Roth IRAs',[9],'23A',
 'Traditional contributions and deductibility|Early-distribution additional tax|Annuitization and benefit taxation|Estate and beneficiary issues|Roth contributions and limits|Roth distributions',
 'A student contributes wages while an older worker takes a distribution. Label the tax year and account type.',
 'Separate contribution eligibility, deduction eligibility and distribution treatment; use current-year IRS sources.');
add('7.5','Move retirement funds properly',[9],'23B',
 'Rollovers|Trustee transfers',
 'Compare a direct transfer with a check paid to the account owner.',
 'Identify withholding, deadlines and account-type restrictions using stated facts.');
add('7.6','Recognize permitted insurance exchanges',[9],'22B',
 'Section 1035 exchanges',
 'Draw permitted directions between life and annuity contracts and an impermissible reverse exchange.',
 'Teach exchange eligibility and transaction conditions; do not imply every cash reinvestment qualifies.');
add('8.1','Recognize qualification requirements',[9],'23C',
 'General qualified-plan requirements',
 'A proposed retirement plan favors only the owner; examine employee-benefit and qualification requirements.',
 'Identify the exclusive-benefit principle and applicable qualification conditions.');
add('8.2','Explain qualified-plan taxation',[9],'23C',
 'Employer tax advantages|Employee tax advantages|Distribution tax and age conditions',
 'Separate employer contribution treatment from employee accumulation and later distribution.',
 'Specify pre-tax versus Roth funds and relevant exceptions rather than promising all benefits are tax-free.');
add('8.3','Distinguish employer plan families',[9],'23D',
 'SEP|Keogh/HR-10|Profit sharing and 401(k)|SIMPLE|403(b)',
 'Compare retirement arrangements for a self-employed owner, small firm and eligible nonprofit employer.',
 'Match employer eligibility and plan structure without memorizing undated annual dollar limits.');

export const coverageRows = rows;
export const questionSubsections = {
 '4.2':[1,22,53,64], '4.1':[2,57,83], '6.4':[3,27], '5.1':[4,23,28,49,60,73,80,84,87,88],
 '1.2':[5,10,12,15,16,44,58,59,63,67,90], '3.9':[6,20,47,52], '4.3':[7,8,72],
 '1.3':[9,13,56,81,86], '1.1':[11,21,31,38], '6.2':[14,26], '3.1':[17,35],
 '5.10':[18], '5.3':[19,71], '7.6':[24], '6.1':[25], '4.5':[29,32], '3.8':[30,39,43,65],
 '7.1':[33,89], '8.2':[34], '2.3':[36], '5.2':[37,77], '2.4':[40,54], '7.3':[41],
 '8.1':[42], '5.7':[45,55], '4.4':[46,85], 'supplemental':[48,50], '5.5':[51,70],
 '5.8':[61], '2.5':[62], '7.5':[66], '7.4':[68], '5.4':[69,75], '3.5':[74,78], '7.2':[76], '5.6':[79], '6.3':[82]
};
export const heldQuestions = {
 '5':'Rebating example needs an explicit purchase inducement and review against current Maryland exceptions.',
 '9':'Verify Maryland group conversion conditions and correct the assertion that the new premium must always be higher.',
 '12':'Verify compensation/commission-sharing permissions and exceptions under current Maryland law.',
 '20':'Race answer is the intended distinction; explanation overstates when every other listed factor is lawful. Rewrite with precise scope.',
 '39':'Verify the first-page policy-description requirement and applicable product scope.',
 '43':'Buyer-guide and summary delivery timing is too ambiguous; check current disclosure and replacement rules.',
 '48':'Death proceeds are not necessarily paid to the policyowner; endowment detail is supplemental, not a standalone outline topic.',
 '50':'Surplus-lines item needs eligibility and life-line limitations; do not teach it as a route for ordinary life placement.',
 '54':'Reasonable-expectations explanation overstates when expectations can override contract language.',
 '59':'Rate comparison omits comparable benefits/terms; revise the unfair-discrimination scenario.',
 '67':'Blank and incomplete applications should not be conflated; clarify prohibited conduct and correction procedures.'
};
export const sources = [
 ['Prometric Maryland landing page','https://www.prometric.com/exams/mia/','Current link authority; life code 2027.'],
 ['Prometric Life outline','https://www.prometric.com/files/mia/2027_life_producer_9.21.21.pdf','Still linked on September 12, 2026; filename is older, not a 2026 revision.'],
 ['Candidate bulletin','https://www.prometric.com/files/mia/Maryland-Insurance-LIB.pdf','Exam format and candidate procedures.'],
 ['Official practice FAQ','https://www.prometric.com/insurance-practice-exam-faqs/','Practice is not a Maryland-specific bank.'],
 ['Producer discipline, §10–126','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=10-126','Q11; also reporting duties.'],
 ['Insurable interest, §12–201','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=12-201','Q17 and Q35.'],
 ['Grace period, §16–202','https://mgaleg.maryland.gov/2026RS/Statute_Web/gin/16-202.pdf','Q80; standard nonindustrial rule is not universally 31 days.'],
 ['Incontestability, §16–203','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-203','Q73.'],
 ['Reinstatement, §16–210','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-210','Q49.'],
 ['Exclusions, §16–215','https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section=16-215','Q28 and Q87; prior-policy conditions matter.'],
 ['Replacement definition','https://regs.maryland.gov/us/md/exec/comar/31.09.05.03','Current transaction scope.'],
 ['Replacement producer duties','https://regs.maryland.gov/us/md/exec/comar/31.09.05.04','Notice, signatures and sales material.'],
 ['MIA universal life advisory','https://insurance.maryland.gov/Consumer/Pages/Universal-Life-Insurance.aspx','Q7 and Q72; funding and contract guarantees.'],
 ['SEC variable life guide','https://www.investor.gov/introduction-investing/investing-basics/investment-products/variable-life','Q22 and Q64; contract-dependent benefits and investment risk.'],
 ['IRS Publication 575','https://www.irs.gov/publications/p575','Q41; periodic versus nonperiodic distributions.'],
 ['IRS Publication 590-A','https://www.irs.gov/publications/p590a','Q68 uses an expressly dated 2025 contribution example.'],
 ['IRS Form 5329 instructions','https://www.irs.gov/instructions/i5329','Additional tax on taxable early distributions and MECs.'],
 ['Prelicensing change','https://insurance.maryland.gov/Pages/Bulletins/24-19-Repealing-the-Prelicensing-Education-and-Experience-Requirements.aspx','Do not teach a mandatory approved prelicensing course after October 1, 2024.']
].map(([title,url,note])=>({title,url,note}));
