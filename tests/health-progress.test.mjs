import test from 'node:test';
import assert from 'node:assert/strict';
import { healthQuestions } from '../src/data/healthQuestions.js';
import {
  HEALTH_PASS_COUNT,
  answerHealthAttempt,
  blankHealthProgress,
  createHealthAttempt,
  healthQuestionOrder,
  latestOpenHealthAttempt,
  latestSubmittedHealthAttempt,
  parseHealthProgress,
  scoreHealthAttempt,
} from '../src/course/health-progress.js';
import { sanitizeReturnTo } from '../src/course/route-safety.js';

const wrongAnswer = question => question.choices.find(choice => choice[0] !== question.answer)[0];

test('Health reload resumes the same question order, current position and first-answer score', () => {
  const state=blankHealthProgress(), attempt=createHealthAttempt(state,1000,'health-attempt-1',healthQuestions.length), ordered=healthQuestionOrder(healthQuestions,attempt.rotation);
  state.attempts.push(attempt);
  assert.equal(answerHealthAttempt(attempt,ordered,0,ordered[0].answer),true);
  assert.equal(answerHealthAttempt(attempt,ordered,1,wrongAnswer(ordered[1])),true);
  attempt.current=17;
  const restored=parseHealthProgress(JSON.stringify(state),healthQuestions), resumed=latestOpenHealthAttempt(restored), restoredOrder=healthQuestionOrder(healthQuestions,resumed.rotation);
  assert.equal(resumed.id,'health-attempt-1'); assert.equal(resumed.current,17); assert.deepEqual(restoredOrder.map(q=>q.n),ordered.map(q=>q.n));
  assert.equal(scoreHealthAttempt(resumed,restoredOrder),1);
  assert.equal(answerHealthAttempt(resumed,restoredOrder,0,wrongAnswer(restoredOrder[0])),false);
  assert.equal(scoreHealthAttempt(resumed,restoredOrder),1,'feedback and reload cannot change the first-answer score');
});

test('Health restore rejects malformed or tampered local snapshots instead of overwriting cloud history', () => {
  const state=blankHealthProgress(), attempt=createHealthAttempt(state,1000,'health-attempt-1',healthQuestions.length);state.attempts.push(attempt);
  for(const mutate of [value=>value.version=2,value=>value.attempts[0].rotation=18,value=>value.attempts[0].answers[0]='Z',value=>value.attempts[0].current=90,value=>value.attempts[0].unexpected=true]){
    const changed=JSON.parse(JSON.stringify(state));mutate(changed);assert.equal(parseHealthProgress(JSON.stringify(changed),healthQuestions),null);
  }
});

test('Health Smart Stop locks after the 28th wrong answer and submitted results remain reviewable', () => {
  const state=blankHealthProgress(), attempt=createHealthAttempt(state,1000,'health-attempt-1',healthQuestions.length), ordered=healthQuestionOrder(healthQuestions,attempt.rotation);
  state.attempts.push(attempt);
  for(let index=0;index<healthQuestions.length-HEALTH_PASS_COUNT;index++){
    assert.equal(answerHealthAttempt(attempt,ordered,index,wrongAnswer(ordered[index])),true); assert.equal(attempt.earlyFail,false);
  }
  const stopIndex=healthQuestions.length-HEALTH_PASS_COUNT;
  assert.equal(answerHealthAttempt(attempt,ordered,stopIndex,wrongAnswer(ordered[stopIndex])),true); assert.equal(attempt.earlyFail,true);
  assert.equal(answerHealthAttempt(attempt,ordered,stopIndex+1,ordered[stopIndex+1].answer),false);
  attempt.submittedAt=2000;
  assert.equal(latestSubmittedHealthAttempt(JSON.parse(JSON.stringify(state))).id,attempt.id);
});

test('login return routing preserves protected Health and guide destinations without allowing redirects', () => {
  const origin='https://amg-exam-portal.netlify.app';
  assert.equal(sanitizeReturnTo('/health/',origin),'/course/health/');
  assert.equal(sanitizeReturnTo('/%68ealth/',origin),'/course/health/');
  assert.equal(sanitizeReturnTo('/practice/health/?attempt=1',origin),'/course/health/?attempt=1');
  assert.equal(sanitizeReturnTo('/Accident%20%26%20Health%20Study%20Guide.docx',origin),'/Accident%20%26%20Health%20Study%20Guide.docx');
  assert.equal(sanitizeReturnTo('/guides/life-producer.docx',origin),'/guides/life-producer.docx');
  for(const unsafe of ['https://attacker.test/course/','//attacker.test/course/','/other','/%2e%2e/course/','/course/%252e%252e/other']) assert.equal(sanitizeReturnTo(unsafe,origin),'/course/');
});
