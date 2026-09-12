import fs from 'node:fs';
import assert from 'node:assert/strict';
import {domains,blueprint,simulation} from '../../docs/course/assessments/helpers.mjs';
import diagnostic from '../../docs/course/assessments/diagnostic.mjs';

const readData = path => JSON.parse(fs.readFileSync(path,'utf8').replace(/^window\.\w+\s*=\s*/,'').replace(/;\s*$/,''));
const data=readData('public/course/assessments/assessment-data.js');
const names=['regulation','general','life','policies','provisions','annuities','tax','qualified'];
const raw=new Map();
for(const form of ['A','B','C']) for(const [domain,name] of names.entries()) {
  const separate=['regulation','life'].includes(name);
  const source=(await import('../../docs/course/assessments/'+name+(separate?'-'+form.toLowerCase():'')+'.mjs')).default;
  const items=separate?source:source[form];
  assert.equal(items.length,blueprint[domain]+simulation[domain]);
  items.forEach((q,i)=>raw.set(form+'-'+(domain+1)+'-'+String(i+1).padStart(2,'0'),{...q,domain,scored:i<blueprint[domain]}));
}
diagnostic.forEach((items,domain)=>items.forEach((q,i)=>raw.set('D-'+(domain+1)+'-'+(i+1),{...q,domain,scored:true})));
assert.deepEqual(data.domains,domains);
assert.deepEqual(data.blueprint,blueprint);
assert.equal(raw.size,302);
assert.equal(data.forms.length,4);
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const ids=new Set(),stems=new Set(),itemResults=[],formResults=[];
let assertions=0;
function check(ok,message){assert(ok,message);assertions++;}
for(const form of data.forms) {
  const allocation=domains.map((_,domain)=>form.questions.filter(q=>q.scored&&q.domain===domain).length);
  check(form.questions.length===(form.id==='D'?32:90),form.id+' item count');
  check(form.minutes===(form.id==='D'?0:105),form.id+' timer');
  check(JSON.stringify(allocation)===JSON.stringify(form.id==='D'?Array(8).fill(4):blueprint),form.id+' scored blueprint');
  for(const q of form.questions) {
    const source=raw.get(q.id);
    check(Boolean(source),q.id+' source exists');
    check(!ids.has(q.id),q.id+' unique ID');ids.add(q.id);
    check(!stems.has(normalize(q.prompt)),q.id+' unique prompt');stems.add(normalize(q.prompt));
    check(q.prompt===source.prompt,q.id+' source prompt preserved');
    check(q.lesson===source.lesson,q.id+' source lesson preserved');
    check(q.domain===source.domain,q.id+' source domain preserved');
    check(q.scored===source.scored,q.id+' scoring flag preserved');
    check(q.options.length===4&&new Set(q.options.map(normalize)).size===4,q.id+' four distinct choices');
    check(JSON.stringify(q.options.toSorted())===JSON.stringify(source.options.toSorted()),q.id+' option text preserved after shuffle');
    check(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,q.id+' key in range');
    check(q.options[q.answer]===source.options[source.answer],q.id+' shuffled key identifies authored correct option');
    check(typeof q.explanation==='string'&&q.explanation.length>45&&q.explanation===source.explanation,q.id+' full explanation preserved');
    check(data.lessons.some(l=>l.id===q.lesson),q.id+' related lesson exists');
    const foundationSourcesInLesson=['01','02'].includes(q.lesson)&&fs.readFileSync('public/course/lesson-'+q.lesson+'/index.html','utf8').includes('https://www.prometric.com/files/mia/2027_life_producer_9.21.21.pdf');
    check(Array.isArray(q.sources)&&(q.sources.length>0||foundationSourcesInLesson)&&q.sources.every(s=>s.title&&/^https:\/\//.test(s.url)),q.id+' source references available directly or through foundation lesson');
    itemResults.push({id:q.id,lesson:q.lesson,domain:q.domain,scored:q.scored,key:q.answer,correctOption:q.options[q.answer],sourceAndPublicMatch:true,sourceLocation:q.sources.length?'assessment-and-related-lesson':'related-foundation-lesson'});
  }
  formResults.push({id:form.id,items:form.questions.length,scored:form.questions.filter(q=>q.scored).length,simulation:form.questions.filter(q=>!q.scored).length,minutes:form.minutes,allocation});
}
check(ids.size===302,'All302 authored assessment IDs represented');
const currentLessonIds=new Set();
for(const lesson of data.lessons) {
  const current=readData('public/course/lesson-'+lesson.id+'/lesson-data.js');
  check(lesson.version===current.version,'Part'+lesson.id+' review data uses current version');
  check(lesson.questions.length===current.questions.length,'Part'+lesson.id+' review count matches course');
  for(const [i,q] of lesson.questions.entries()) {
    const source=current.questions[i];
    check(!ids.has(q.id)&&!currentLessonIds.has(q.id),q.id+' distinct lesson-review ID');currentLessonIds.add(q.id);
    check(q.prompt===source.prompt&&q.answer===source.answer&&JSON.stringify(q.options)===JSON.stringify(source.options),q.id+' related review key and options match current course');
    check(q.explanation===source.explanations[source.answer],q.id+' related review explanation matches correct option');
    check(!stems.has(normalize(q.prompt)),q.id+' assessment stem independent of lesson question');
  }
}
check(currentLessonIds.size===512,'All512 existing lesson-review references intact without replaying course');
const result={reviewDate:'2026-09-13',assessmentItems:ids.size,relatedLessonReviewItems:currentLessonIds.size,assertions,forms:formResults,items:itemResults};
fs.writeFileSync('docs/course/second-review/assessment-integrity-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({assessmentItems:ids.size,relatedLessonReviewItems:currentLessonIds.size,assertions,forms:formResults}));
