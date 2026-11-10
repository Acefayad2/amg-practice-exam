// Original teaching scenarios. Topics checked against Life-labeled material;
// no photographed question, answer choices, or personal information is reproduced.
import {lifeQuestions} from '../../../src/data/lifeQuestions.js';
import {lifeQuestionAudit} from '../../../src/data/lifeAudit.js';
import { item } from './helpers.mjs';
// Reuse AMG's previously rewritten and audited Life items, not held bank rows.
function storedLife(n, lesson, source) {
  const q=lifeQuestions.find(q=>q.n===n), audit=lifeQuestionAudit[n];
  if(!q || audit.status!=='revised') throw Error('Unreviewed Life item: '+n);
  return {id:'LM-drill-'+n,domain:Number(audit.section)-1,source,lesson,prompt:q.q,
    options:q.choices.map(text=>text.replace(/^[A-D]\)\s*/,'')),answer:'ABCD'.indexOf(q.answer),explanation:q.explanation};
}
export default [
  {id:'LM-delivery-participation',domain:0, source:{title:'Maryland Insurance §16-213 — Life policy descriptions',url:'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gin&section=16-213'},
   ...item(14, 'Leah wants to know whether her new individual life policy can pay policy dividends. Under Maryland’s first-page disclosure rule, which wording tells her whether the policy is eligible?',
    'Participating or nonparticipating', 'Level or increasing death benefit', 'Standard or rated underwriting class', 'Annual or monthly premium',
    'A participating policy can share in dividends if the insurer declares them. Maryland requires the first-page description to identify participating status. The label does not promise a dividend or a particular amount.')},
  {id:'LM-application-correction',domain:2, source:{title:'NAIC Life Insurance Buyer’s Guide — Applying for a policy',url:'https://content.naic.org/sites/default/files/publication-lig-lp-consumer-life.pdf'},
   ...item(23, 'As Daniel reviews his life application before signing, he spots the wrong year for a surgery. His producer says the insurer will see the correct date in his records. What should Daniel do now?',
    'Have the entry corrected and review the application before signing.', 'Sign it and ask the medical examiner to amend the signed application.', 'Leave the written date as it is and explain the error only if a claim is filed.', 'Ask the producer to omit the surgery because the date is uncertain.',
    'The signed application should accurately reflect Daniel’s answers. A future medical review does not correct the statement he signs today. The producer can help record the correction, but the insurer makes the underwriting decision.')},
  storedLife(17,'18',{title:'Maryland Insurance §12-201 — Insurable interest',url:'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gin&section=12-201'}),
  storedLife(51,'38',{title:'Maryland Insurance Administration — A Consumer Guide to Life Insurance',url:'https://insurance.maryland.gov/consumer/documents/publications/lifeinsurance.pdf'}),
  storedLife(80,'34',{title:'Maryland Insurance §16-202 — Grace periods',url:'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gin&section=16-202'}),
];
