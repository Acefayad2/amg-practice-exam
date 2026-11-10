import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createMockBank} from '../netlify/functions/_shared/mock-rotation.mjs';
import {schema, assessmentSchemas, validateValue, scoreAttempt, buildReport} from '../netlify/functions/_shared/learning-core.mjs';
import {rng} from '../scripts/assessment-items.mjs';
const now=Date.now();
function bankData(track) {
 const c={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../public/course/'+(track==='health'?'health/':'')+'assessments/assessment-data.js',import.meta.url),'utf8'),c);
 return JSON.parse(JSON.stringify(c.window.AMG_ASSESSMENTS));
}
const data={life:bankData('life'),health:bankData('health')};
const banks=Object.fromEntries(Object.entries(data).map(([k,d])=>[k,createMockBank(k,d.forms,d.extraQuestions)]));
const values=attempts=>({version:1,attempts,seen:[...new Set(attempts.map(a=>a.form))],reviews:{},lessonImports:{}});
const timeBase=now-120000;
function complete(draw,bank,step) {
 const f=bank.formFor(draw),n=f.questions.length,startedAt=timeBase+step*1000;
 return {...draw,id:'attempt-'+step,startedAt,deadline:startedAt+f.minutes*60000,submittedAt:startedAt+100,expired:false,answers:f.questions.map(q=>q.answer),flags:Array(n).fill(false),uncertain:Array(n).fill(false),reviewed:Array(n).fill(false),current:0};
}
for(const track of ['life','health']) {
 const bank=banks[track], d=data[track], other=track==='life'?banks.health:banks.life;
 const key=(track==='life'?schema:schema.tracks.health).assessmentKey, assessment=assessmentSchemas.get(key);
 const authIds=new Set(bank.pool.map(q=>q.id)), otherIds=new Set(other.pool.map(q=>q.id));
 test(track+' draws by topic from its stored bank, avoids early repeats, then cycles old questions back in',()=>{
  assert.equal(bank.pool.length,275);
  assert.equal(new Set(bank.pool.map(q=>q.prompt.trim().toLowerCase())).size,bank.pool.length);
  assert(bank.pool.every(q=>!otherIds.has(q.id)));
  assert(bank.pool.every(q=>q.options.length===4 && q.explanation && d.lessons.some(l=>l.id===q.lesson)));
  for(let seed=1;seed<=12;seed++){
   const attempts=[],seen=new Set(),r=rng(seed*43567);
   for(let i=0;i<5;i++){
    const draw=bank.draw(attempts,r),q=bank.formFor(draw).questions;
    assert.equal(q.length,90);assert.equal(new Set(draw.questionIds).size,90);
    assert(q.every(item=>authIds.has(item.id)&&!otherIds.has(item.id)));
    assert.deepEqual(d.blueprint,q.reduce((a,v)=>(a[v.domain]+=Number(v.scored),a),Array(d.blueprint.length).fill(0)));
    assert.equal(draw.fresh,i<3);
    if(i<3)assert(q.every(item=>!seen.has(item.id)));
    if(i>0)assert(q.every(item=>!attempts.at(-1).questionIds.includes(item.id)));
    q.forEach(item=>seen.add(item.id));attempts.push(draw);
   }
   assert.equal(seen.size,bank.pool.length);
  }
 });
 test(track+' persists the exact question order, validates keys on the server and preserves legacy attempts',()=>{
   const old=complete({form:'B',fresh:true},bank,0);
   const drawn=bank.draw([old],rng(151));
   const originalIds=new Set(bank.formFor(old).questions.map(q=>q.id));
   assert(drawn.questionIds.every(id=>!originalIds.has(id)));
   const attempt=complete(drawn,bank,1);
   const record=values([old,attempt]);validateValue(key,record,now);
   assert.deepEqual(scoreAttempt(attempt,assessment),{correct:80,total:80,percentage:100,unscoredCorrect:10,unscoredTotal:10});
   assert.equal(scoreAttempt(old,assessment).correct,80);
   const report=buildReport({id:'learner'}, {[key]:{value:record}});
   assert.deepEqual((track==='life'?report:report.tracks.health).attempts.map(r=>r.fresh),[true,true]);
   const clone=structuredClone(record);clone.attempts[1].questionIds.reverse();
   assert.throws(()=>validateValue(key,clone,now,record),/cannot change/);
   // Even before submission the selected IDs are immutable.
   const pending=structuredClone(record);pending.attempts[1].submittedAt=null;
   const changed=structuredClone(pending);changed.attempts[1].questionIds.reverse();
   assert.throws(()=>validateValue(key,changed,now,pending),/cannot change/);
   for (const invalid of [other.pool[0].id,d.lessons[0].questions[0].id,attempt.questionIds[1]]){
    const bad=structuredClone(record);bad.attempts[1].questionIds[0]=invalid;
    assert.throws(()=>validateValue(key,bad,now),/invalid track question set/);
   }
   const imbalance=structuredClone(record),first=bank.formFor(attempt).questions[0];
   imbalance.attempts[1].questionIds[0]=bank.pool.find(q=>q.domain!==first.domain&&!attempt.questionIds.includes(q.id)).id;
   assert.throws(()=>validateValue(key,imbalance,now),/invalid track question set/);
   assert.equal(other.formFor(drawn),undefined);
 });
}
