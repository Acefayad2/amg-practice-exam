import assert from 'node:assert/strict';
import { balanceAnswers, itemPreparer, prepareRotationExtras, rng, shuffle } from '../assessment-items.mjs';
import { courseHeader, courseFooter } from '../course-ui.mjs';
import { healthQuestions } from '../../src/data/healthQuestions.js';

import additions from '../../docs/course/health/mock-exams/rotation-additions.mjs';
import regulationA from '../../docs/course/health/mock-exams/regulation-a.mjs';
import regulationB from '../../docs/course/health/mock-exams/regulation-b.mjs';
import regulationC from '../../docs/course/health/mock-exams/regulation-c.mjs';
import general from '../../docs/course/health/mock-exams/general.mjs';
import basics from '../../docs/course/health/mock-exams/health-basics.mjs';
import provisions from '../../docs/course/health/mock-exams/provisions.mjs';
import disability from '../../docs/course/health/mock-exams/disability.mjs';
import medical from '../../docs/course/health/mock-exams/medical.mjs';
import group from '../../docs/course/health/mock-exams/group.mjs';
import dental from '../../docs/course/health/mock-exams/dental.mjs';
import seniors from '../../docs/course/health/mock-exams/seniors.mjs';
import tax from '../../docs/course/health/mock-exams/tax.mjs';

const outline = 'https://www.prometric.com/files/2021-09/2024_accident_and_health_or_sickness_producer_9.21.21.pdf';
// The scored allocations are the Series 20-24 outline. AMG also includes one unscored item per domain.
const sections = [
  ['Maryland regulation', 24, {A: regulationA, B: regulationB, C: regulationC}],
  ['General insurance', 7, general], ['Health insurance basics', 9, basics],
  ['Individual health policy provisions', 6, provisions], ['Disability income', 7, disability],
  ['Medical plans', 11, medical], ['Group health insurance', 4, group], ['Dental insurance', 1, dental],
  ['Senior citizens and special needs', 7, seniors], ['Federal tax considerations', 4, tax],
];

function buildData(lessons) {
  const { prepare } = itemPreparer(lessons, healthQuestions.map(q => q.q));
  const forms = ['A', 'B', 'C'].map((id, index) => {
    const random = rng(624103 + index * 7417);
    const questions = sections.flatMap(([domain, scoredCount, bank], d) => {
      const items = bank[id];
      assert.equal(items.length, scoredCount + 1, id + ' ' + domain);
      return items.map((item, n) => prepare(item, `HM-${id}-${d+1}-${n+1}`, d, n < scoredCount, random));
    });
    assert.equal(questions.length, 90);
    assert.equal(questions.filter(q => q.scored).length, 80);
    return { id, title: 'Health Mock Exam ' + id, minutes: 0, questions: shuffle(questions, random) };
  });
  balanceAnswers(forms, 330127);
  return {
    track: 'health', version: 1, extraQuestions: prepareRotationExtras(additions,prepare,'HM-'), domains: sections.map(s => s[0]), blueprint: sections.map(s => s[1]), forms,
    lessons: lessons.map(l => ({
      id: l.id, number: l.number, title: l.title, version: l.version,
      questions: l.questions.map(q => ({
        id: q.id, lesson: l.id, domain: Number(q.topics[0].split('.')[0])-1, prompt: q.prompt,
        options: q.options, answer: q.answer, explanation: q.explanations[q.answer],
      })),
    })),
  };
}

function examPage(track) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Health Mock Exam · AMG Learning</title>
<meta name="description" content="Take the Maryland Health Mock Exam. Each attempt draws from the Accident &amp; Health question bank.">
<link rel="icon" href="/course/assets/amg-mark.webp"><link rel="stylesheet" href="/course/shared/app.css"><link rel="stylesheet" href="/course/shared/account.css">
<link rel="stylesheet" href="/course/assessments/assessment.css"><script src="/course/shared/account.js" defer></script>
<script src="assessment-data.js" defer></script><script src="/course/assessments/assessment-rotation.js" defer></script><script src="/course/assessments/assessment.js" defer></script>
</head><body class="account-loading" data-track="health"><a class="skip" href="#app">Skip to mock exam</a>${courseHeader('assessments',track)}
<main class="assessment-main"><p id="storage-status" class="storage-status" role="status"></p><div id="app"><p>Loading your Health Mock Exam…</p></div>
<noscript>Enable JavaScript to start your mock exam and save your answers.</noscript>
<details class="practice-about"><summary>About this exam</summary><p>AMG wrote these practice questions for Maryland Accident &amp; Health. Each attempt follows the subject weights in the <a href="${outline}">Maryland exam outline</a>. Your results are saved under your learner sign-in.</p><p>For immediate feedback on each answer, <a href="/practice/health/">open the untimed Health drills</a>.</p></details>${courseFooter(track)}</main>
<dialog id="submit-dialog" aria-labelledby="submit-title"><h2 id="submit-title">Submit this exam?</h2><p id="submit-detail"></p><div class="actions"><button id="confirm-submit" type="button" class="primary">Submit and see results</button><button id="cancel-submit" type="button">Keep working</button></div></dialog></body></html>\n`;
}

export function writeHealthMockExams(lessons, track, write) {
  const data = buildData(lessons), dir = 'public/course/health/assessments/';
  write(dir + 'assessment-data.js', 'window.AMG_ASSESSMENTS=' + JSON.stringify(data).replaceAll('<', '\\u003c') + ';\n');
  write(dir + 'index.html', examPage(track));
}
