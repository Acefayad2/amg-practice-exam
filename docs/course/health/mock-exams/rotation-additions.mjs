// Original Health study-guide exercises; kept outside immutable legacy forms.
import { item } from '../../assessments/helpers.mjs';
const source={title:'HealthCare.gov — Glossary of Health Coverage and Medical Terms',url:'https://www.healthcare.gov/SBC-GLOSSARY/'};
export default [
  {id:'HM-lab-share',domain:5, source, ...item(19, 'An in-network lab bills $600. Its contract allows $400. Mina has $100 left on her deductible and owes 20% coinsurance after that. There is no copay, and she is below her out-of-pocket limit. What does Mina owe?',
    '$160', '$80', '$180', '$200',
    'Start with the $400 allowed amount. Mina pays the remaining $100 deductible, then 20% of the remaining $300, or $60. Her share is $160. The lab’s higher billed price is not used for this in-network claim.')},
  {id:'HM-remaining-limit',domain:5, source, ...item(19, 'Marco has met his deductible and is $70 short of his plan’s annual in-network out-of-pocket limit. His coinsurance on a covered in-network scan would normally be $140. What happens to his bill for that scan?',
    'He pays $70; the plan pays the rest of the allowed amount.', 'He pays $140 because the limit only applies to deductibles.', 'He pays nothing because he already met his deductible.', 'He pays $70 plus another $70 that counts toward next year.',
    'Only $70 remains before Marco reaches his limit. For this covered in-network service, the plan pays the rest of the allowed amount. Meeting his deductible alone would not have stopped coinsurance.')},
  // Health drill 4: apply a scheduled hospital benefit rather than recalling its definition.
  {id:'HM-drill-4',domain:2,source:{title:'CMS — Hospital indemnity coverage',url:'https://www.cms.gov/cciio/resources/fact-sheets-and-faqs/aca_implementation_faqs11'},...item(18,
    'After a covered three-day hospital stay, Eva receives a $4,800 bill. Her supplemental policy pays $150 per covered day, with no other benefit for this stay. What should she expect from that policy?',
    '$450, based on the number of covered days', '$4,800, based on the hospital bill', '$150, regardless of how long she stayed', 'The amount left over after her medical deductible',
    'The policy promises a daily dollar amount. Three covered days at $150 each pay $450. That payment does not turn the supplemental policy into coverage for the full hospital bill.')},
  // Health drill 9: distinguish the waiting period from the payment period.
  {id:'HM-drill-9',domain:4,source:{title:'Maryland Insurance Administration — Disability Insurance',url:'https://insurance.maryland.gov/Consumer/Pages/disability-insurance.aspx'},...item(29,
    'Rae compares two disability policies. Both pay the same monthly benefit for up to two years. One has a 30-day elimination period and the other has a 90-day elimination period. Which difference matters if her savings cover only six weeks?',
    'She would need to cover more time without benefits under the 90-day policy.', 'The 30-day policy stops paying after the first month.', 'The 90-day policy provides three times the monthly benefit.', 'Neither plan can begin until she has been disabled for two years.',
    'The elimination period is time Rae must get through before disability benefits can begin. A longer wait can leave her without income after her savings run out. It does not change the stated monthly amount or two-year benefit period.')},
  // Health drill 34: apply the order of payment with Medicare and employer coverage.
  {id:'HM-drill-34',domain:8,source:{title:'Medicare — How Medicare works with other insurance',url:'https://www.medicare.gov/health-drug-plans/coordination'},...item(46,
    'A clinic has confirmed that an employer plan pays first and Medicare pays second for Len’s visit. The employer plan processes the claim and leaves a balance. What should the clinic tell Len?',
    'Medicare considers the remaining charges under its own rules; he may still owe part of the bill.', 'Medicare must pay every dollar left by the employer plan.', 'The clinic must reverse the claim and bill Medicare as the primary payer.', 'Len can choose which payer is primary after he sees the bill.',
    'Coordination of benefits sets the order of payment. The second payer looks at what remains and applies its own coverage rules. A balance on the first payer’s statement is not a promise that Medicare will pay all of it.')},
];
