import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { lifeQuestions } from '../src/data/lifeQuestions.js';
import { sections, coverageRows, questionSubsections, heldQuestions, sources } from '../docs/course/coverage-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const revisions=JSON.parse(fs.readFileSync(path.join(root,'docs/course/audit-revisions.json'),'utf8'));
const write=(name,text)=>{const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);};
const checkIDs=new Set();
const questionAudit={};
for(const [subsection,ids] of Object.entries(questionSubsections)) for(const id of ids){
  assert(!checkIDs.has(id),`Question ${id} mapped twice`);checkIDs.add(id);
  assert(subsection==='supplemental'||coverageRows.some(r=>r.id===subsection),`Unknown subsection ${subsection}`);
  questionAudit[id]={subsection,section:subsection.split('.')[0],status:heldQuestions[id]?'held':revisions[id]?'revised':'editorial-review',
    note:heldQuestions[id]|| (revisions[id]?'Revised in this audit; coordinator approval still pending.':'Read and mapped; independent source and coordinator sign-off still required.')};
}
assert.equal(checkIDs.size,90); assert.equal(lifeQuestions.length,90);
assert.equal(coverageRows.length,48);
assert.equal(new Set(coverageRows.map(r=>r.id)).size,48);
assert.equal(sections.reduce((n,s)=>n+s.items,0),80);
assert.equal(sections.reduce((n,s)=>n+s.share,0),100);
for(const q of lifeQuestions){
  assert(checkIDs.has(q.n)); assert.equal(q.choices.length,4,`Q${q.n}`);
  assert.deepEqual(q.choices.map(c=>c[0]),['A','B','C','D']);
  assert(['A','B','C','D'].includes(q.answer));assert(q.explanation.trim());
  assert.equal(new Set(q.choices.map(c=>c.slice(3).toLowerCase())).size,4);
}
const normalized=lifeQuestions.map(q=>q.q.toLowerCase().replace(/[^a-z0-9]/g,''));
assert.equal(new Set(normalized).size,90,'Duplicate question stem');

const evidence={
 '2.1':{status:'partial',text:'Parts 1–2 explain five risk terms, hazards, pooling, large numbers and adverse selection; 16 formative questions. Risk-handling methods, insurability and reinsurance are incomplete.',links:[['Part 1','/course/lesson-01/'],['Part 2','/course/lesson-02/']]},
 '3.2':{status:'intro',text:'Part 1 introduces family income exposure. No complete needs lesson or dedicated needs assessment yet.',links:[['Part 1','/course/lesson-01/']]},
 '3.6':{status:'partial',text:'The earlier term/whole-life prototype addresses the temporary/permanent distinction only.',links:[['Prototype','/course/term-whole-life.html']]},
 '3.7':{status:'intro',text:'Part 2 distinguishes illustrative expected claims from an actual premium; no premium-construction lesson yet.',links:[['Part 2','/course/lesson-02/']]},
 '3.9':{status:'intro',text:'Part 2 introduces underwriting as a response to adverse selection; it does not teach the full underwriting workflow.',links:[['Part 2','/course/lesson-02/']]},
 '4.1':{status:'partial',text:'The term/whole-life prototype teaches basic term duration and lack of cash value, with three comparison questions. Term variants remain incomplete.',links:[['Prototype','/course/term-whole-life.html']]},
 '4.2':{status:'partial',text:'The prototype teaches traditional whole-life features. Other permanent designs are not taught.',links:[['Prototype','/course/term-whole-life.html']]}
};
const rows=coverageRows.map(r=>{
 const questionIds=questionSubsections[r.id]||[];
 return {...r,section:r.id.split('.')[0],questionIds,activeQuestionIds:questionIds.filter(id=>!heldQuestions[id]),
  evidence:evidence[r.id]||{status:'not-built',text:'No dedicated published lesson found. Question-bank references are not instructional coverage.',links:[]},
  approval:'Pending coordinator review',source:sources[1].url+'#page='+r.pages[0],
  topics:r.topics.map((title,i)=>({id:r.id+'.'+String(i+1).padStart(2,'0'),title,approval:'Pending',status:'planned'}))};
});
// Mark only subtopics with substantive current teaching; none is coordinator-approved.
for(const id of ['2.1.01','2.1.02','2.1.03','2.1.04','2.1.05','2.1.08','2.1.12','2.1.13','3.6.03','4.1.01','4.2.01']){
 const topic=rows.flatMap(r=>r.topics).find(t=>t.id===id);assert(topic,id);topic.status='draft teaching';
}
for(const s of sections){
 s.bankQuestions=lifeQuestions.filter(q=>questionAudit[q.n].section===s.id).length;
 s.activeQuestions=lifeQuestions.filter(q=>questionAudit[q.n].section===s.id&&questionAudit[q.n].status!=='held').length;
}
const report={version:1,checked:'2026-09-12',exam:{code:'2027',series:'20-27',scored:80,unscored:10,minutes:105},
 summary:{subsections:rows.length,topicGroups:rows.reduce((n,r)=>n+r.topics.length,0),approvedSubsections:0,originalBank:90,
 revised:Object.keys(revisions).length,held:Object.keys(heldQuestions).length,active:90-Object.keys(heldQuestions).length,
 emptyBankSubsections:rows.filter(r=>!r.questionIds.length).length},sections,rows,questionAudit,sources};
write('public/course/coverage/audit.json',JSON.stringify(report,null,2)+'\n');
write('src/data/lifeAudit.js','// Generated by scripts/build-course-audit.mjs; edit docs/course/coverage-source.mjs.\nexport const lifeSections = '+JSON.stringify(sections,null,2)+';\nexport const lifeQuestionAudit = '+JSON.stringify(questionAudit,null,2)+';\n');
const csvCell=s=>'"'+String(s).replaceAll('"','""')+'"';
const csv=[['Outline subsection','Topic group ID','Learning scope','Teaching evidence','Draft teaching status','Planned lesson','Bank question IDs (not approval)','Coordinator approval','Source']];
for(const r of rows) for(const t of r.topics) csv.push([r.id,t.id,t.title,r.evidence.text,t.status,r.lesson,r.questionIds.join(' '),'Pending',r.source]);
write('public/course/coverage/coverage.csv',csv.map(row=>row.map(csvCell).join(',')).join('\n')+'\n');
write('public/course/coverage/question-audit.csv',[['Question ID','Subsection','Status','Review note'],...lifeQuestions.map(q=>[q.n,questionAudit[q.n].subsection,questionAudit[q.n].status,questionAudit[q.n].note])].map(row=>row.map(csvCell).join(',')).join('\n')+'\n');
write('public/course/coverage/coordinator-review.md',fs.readFileSync(path.join(root,'docs/course/COORDINATOR-REVIEW.md'),'utf8'));
console.log(JSON.stringify({checks:'90 unique IDs, four options each, valid keys, 48 subsections, 80 scored blueprint items',...report.summary,sections},null,2));
