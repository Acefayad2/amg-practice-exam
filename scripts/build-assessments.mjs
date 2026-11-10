import fs from 'node:fs';
import { rng, shuffle, itemPreparer, balanceAnswers } from './assessment-items.mjs';
import assert from 'node:assert/strict';
import {domains,blueprint,simulation} from '../docs/course/assessments/helpers.mjs';
import diagnostic from '../docs/course/assessments/diagnostic.mjs';
import {foundationLessons} from '../docs/course/full-course/foundation-mapping.mjs';
const readLesson=id=>{const t=fs.readFileSync('public/course/lesson-'+id+'/lesson-data.js','utf8');return JSON.parse(t.slice(t.indexOf('=')+1).trim().replace(/;$/,''));};
const lessons=Array.from({length:60},(_,i)=>{const id=String(i+1).padStart(2,'0'),l=readLesson(id);return{...l,id,number:i+1,title:l.title||foundationLessons.find(f=>f.id===id).title,questions:l.questions.map((q,j)=>({...q,id:q.id||'L'+id+'-'+String(j+1).padStart(2,'0'),lesson:id,domain:Number(q.topics?.[0]?.split('.')[0]||2)-1}))};});
const {prepare,ids}=itemPreparer(lessons);
const forms=[];
for(const [k,form] of ['A','B','C'].entries()){
 const random=rng(730019+k*9137),questions=[];
 for(const [d,name]of ['regulation','general','life','policies','provisions','annuities','tax','qualified'].entries()){
  const separate=['regulation','life'].includes(name);
  const source=(await import('../docs/course/assessments/'+name+(separate?'-'+form.toLowerCase():'')+'.mjs')).default;
  const rows=separate?source:source[form];assert.equal(rows.length,blueprint[d]+simulation[d],form+' '+name);
  rows.forEach((q,i)=>questions.push(prepare(q,form+'-'+(d+1)+'-'+String(i+1).padStart(2,'0'),d,i<blueprint[d],random)));
 }
 assert.equal(questions.length,90);assert.equal(questions.filter(q=>q.scored).length,80);
 forms.push({id:form,title:'Timed Form '+form,minutes:105,questions:shuffle(questions,random)});
}
const random=rng(100901),dq=[];diagnostic.forEach((rows,d)=>{assert.equal(rows.length,4);rows.forEach((q,i)=>dq.push(prepare(q,'D-'+(d+1)+'-'+(i+1),d,true,random)));});
forms.unshift({id:'D',title:'Starting diagnostic',minutes:0,questions:shuffle(dq,random)});
balanceAnswers(forms,880111);
const data={version:1,reviewedDate:'2026-09-12',domains,blueprint,forms,lessons:lessons.map(l=>({id:l.id,number:l.number,title:l.title,version:l.version,questions:l.questions.map(q=>({...q,explanation:q.explanations[q.answer]}))}))};
fs.mkdirSync('public/course/assessments',{recursive:true});
fs.writeFileSync('public/course/assessments/assessment-data.js','window.AMG_ASSESSMENTS='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
fs.writeFileSync('docs/course/assessments/manifest.json',JSON.stringify({version:1,date:data.reviewedDate,originalItems:ids.size,forms:forms.map(f=>({id:f.id,questions:f.questions.length,scored:f.questions.filter(q=>q.scored).length,minutes:f.minutes,allocation:domains.map((title,d)=>({title,scored:f.questions.filter(q=>q.scored&&q.domain===d).length}))}))},null,2)+'\n');
console.log(JSON.stringify({originalAssessmentItems:ids.size,forms:forms.length,lessonReviewItems:lessons.reduce((n,l)=>n+l.questions.length,0)}));
