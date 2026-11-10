import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {schema} from '../netlify/functions/_shared/learning-schema.mjs';

test('all three Health forms bind the browser questions to the correct server answers and exam weights', () => {
  const scope = {window:{}};
  vm.runInNewContext(fs.readFileSync(new URL('../public/course/health/assessments/assessment-data.js',import.meta.url),'utf8'),scope);
  const {forms,lessons,domains} = scope.window.AMG_ASSESSMENTS;
  const expected = [24,7,9,6,7,11,4,1,7,4];
  const ids = new Set(), stems = new Set();
  assert.equal(domains.length, expected.length);
  const serverForms = schema.tracks.health.forms;
  assert.deepEqual(Array.from(forms,f=>f.id),['A','B','C']);
  for(const [index,form] of Array.from(forms).entries()){
    const server = serverForms[index];
    assert.equal(form.id,server.id);
    assert.equal(form.minutes,0);
    assert.equal(form.questions.length,90);
    assert.deepEqual(expected.map((_,d)=>form.questions.filter(q=>q.domain===d && q.scored).length),expected);
    assert.equal(form.questions.filter(q=>!q.scored).length,10);
    for(const [i,q] of Array.from(form.questions).entries()){
      assert(!ids.has(q.id)); ids.add(q.id);
      assert(!stems.has(q.prompt)); stems.add(q.prompt);
      assert.deepEqual(server.questions[i],{id:q.id,answer:q.answer,options:4,scored:q.scored,domain:q.domain});
      assert(q.sources.length && q.explanation && lessons.some(l=>l.id===q.lesson));
    }
  }
  assert.equal(ids.size,270);
});
