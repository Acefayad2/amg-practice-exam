import {
  HEALTH_PASS_COUNT,
  HEALTH_PROGRESS_KEY,
  answerHealthAttempt,
  blankHealthProgress,
  healthQuestionOrder,
  latestOpenHealthAttempt,
  latestSubmittedHealthAttempt,
  openOrCreateHealthAttempt,
  parseHealthProgress,
  scoreHealthAttempt,
} from './health-progress.js';

(async () => {
  'use strict';
  const account = await window.AMG_ACCOUNT?.ready;
  if (!account) return;
  const questions = window.AMG_HEALTH_QUESTIONS || [], app = document.getElementById('health-app');
  let storedSnapshot = account.storage.getItem(HEALTH_PROGRESS_KEY), state = blankHealthProgress(), attempt = null, screen = 'home', storageProblem = false;
  const node = (tag,text,cls) => { const element=document.createElement(tag); if(text!==undefined)element.textContent=text; if(cls)element.className=cls; return element; };
  const button = (text,handler,cls) => { const element=node('button',text,cls); element.type='button'; element.addEventListener('click',handler); return element; };
  const link = (text,href,cls) => { const element=node('a',text,cls); element.href=href; return element; };
  const orderedQuestions = value => healthQuestionOrder(questions,value.rotation);

  function restore() {
    if (storedSnapshot === null) return;
    const saved=parseHealthProgress(storedSnapshot,questions);
    if(saved)state=saved;else storageProblem=true;
  }
  function save() {
    if (storageProblem || !account.canWrite()) return;
    try {
      const serialized=JSON.stringify(state), previous=storedSnapshot;
      if (serialized === previous) return;
      storedSnapshot=serialized;
      account.commitSnapshot(HEALTH_PROGRESS_KEY,serialized,previous).then(saved => { if (!saved && account.canWrite()) { storageProblem=true; render(); } }).catch(() => { storageProblem=true; render(); });
    } catch (_) { storageProblem=true; render(); }
  }
  function start() {
    if (storageProblem) return;
    const opened=openOrCreateHealthAttempt(state,Date.now(),crypto.randomUUID(),questions.length);
    attempt=opened.attempt; screen='exam'; if(opened.created)save(); render();
  }
  function resume(value) { attempt=value; screen='exam'; render(); }
  function review(value) { attempt=value; screen='results'; render(); }
  function home() { screen='home'; attempt=null; render(); }
  function score() { return scoreHealthAttempt(attempt,orderedQuestions(attempt)); }
  function renderProblem() {
    const panel=node('section',undefined,'result-panel');
    panel.append(node('p','PROGRESS UNAVAILABLE','eyebrow'),node('h1','Health practice is paused'),node('p','Your saved Health progress could not be restored safely. Reload the page or contact your coordinator before starting another attempt.','status-note'));
    panel.append(button('Reload saved progress',()=>location.reload(),'primary')); app.append(panel);
  }
  function renderHome() {
    const hero=node('section',undefined,'health-hero');
    hero.append(node('p','MARYLAND PRODUCER PROGRAM','eyebrow'),node('h1','Health & Sickness'),node('p','Study inside the same protected AMG Learning portal. Use the current guide and 90-question practice test while video lessons are being prepared.')); app.append(hero);
    const grid=node('div',undefined,'health-grid'), course=node('section',undefined,'health-card');
    course.append(node('span','Coming soon','coming-soon'),node('h2','Health video course'),node('p','The Health & Sickness video lessons are not published yet. No placeholder or fabricated lesson videos are shown.'));
    const practice=node('section',undefined,'health-card');
    practice.append(node('p','PRACTICE & STUDY','eyebrow'),node('h2','Health Practice Test'),node('p','Answer 90 Maryland Accident & Health questions. Your first response is locked, then the correct answer and explanation appear immediately.'));
    const links=node('div',undefined,'health-links'), open=latestOpenHealthAttempt(state), result=latestSubmittedHealthAttempt(state);
    links.append(button(open?'Resume Practice Test':'Start Practice Test',()=>open?resume(open):start(),'primary'),link('Download protected study guide','/Accident%20%26%20Health%20Study%20Guide.docx'));
    if (result) links.append(button('Review latest result',()=>review(result)));
    practice.append(links,node('p','Your attempt, first answers and results save automatically under your learner email.','fine')); grid.append(course,practice); app.append(grid);
  }
  function renderExam() {
    const ordered=orderedQuestions(attempt), q=ordered[attempt.current], selected=attempt.answers[attempt.current], answered=selected!==null;
    const bar=node('div',undefined,'exam-bar'), label=node('div'); label.append(node('strong','Health Practice Test'),node('small','Question '+(attempt.current+1)+' of '+ordered.length));
    bar.append(label,node('span',attempt.answers.filter(answer=>answer!==null).length+' answered · '+score()+' correct','exam-score')); app.append(bar);
    const layout=node('div',undefined,'exam-layout'), panel=node('section',undefined,'question-panel'); panel.append(node('p','QUESTION '+(attempt.current+1),'eyebrow'),node('h1',q.q));
    const list=node('div',undefined,'answer-list');
    q.choices.forEach(choice => {
      const letter=choice[0], isCorrect=letter===q.answer, isSelected=letter===selected;
      const choiceButton=button(choice.slice(3),()=>{ if (!answerHealthAttempt(attempt,ordered,attempt.current,letter)) return; save(); render(); },'answer-choice');
      choiceButton.disabled=answered; if(answered&&isCorrect)choiceButton.classList.add('is-correct'); if(answered&&isSelected&&!isCorrect)choiceButton.classList.add('is-incorrect'); choiceButton.prepend(node('span',letter,'answer-letter')); list.append(choiceButton);
    });
    panel.append(list);
    if (answered) {
      const correct=selected===q.answer, feedback=node('div',undefined,'feedback'+(correct?'':' is-incorrect')); feedback.setAttribute('role','status');
      feedback.append(node('h2',correct?'Correct.':'Review this answer.'),node('p','Correct answer: '+q.choices.find(choice=>choice[0]===q.answer)),node('p',q.explanation),node('p','Your first response is locked for this attempt.','fine'));
      if(attempt.earlyFail)feedback.append(node('p','It is no longer mathematically possible to reach 63 correct answers. Review this explanation, then open your results.','status-note')); panel.append(feedback);
    }
    const actions=node('div',undefined,'actions'), previous=button('Previous',()=>move(attempt.current-1)); previous.disabled=attempt.earlyFail||attempt.current===0;
    const shouldFinish=attempt.earlyFail||attempt.current===ordered.length-1, next=button(shouldFinish?'Finish & review':'Next',()=>shouldFinish?finish():move(attempt.current+1),'primary');
    actions.append(previous,next,button('Return to Health home',home)); panel.append(actions);
    const nav=node('aside',undefined,'nav-panel'); nav.append(node('h2','Question navigator'),node('p',attempt.answers.filter(answer=>answer!==null).length+' of '+ordered.length+' answered','fine'));
    const grid=node('div',undefined,'question-nav'); ordered.forEach((_,index)=>{const item=button(String(index+1),()=>move(index));item.disabled=attempt.earlyFail&&index!==attempt.current;if(attempt.answers[index]!==null)item.classList.add('answered');if(index===attempt.current)item.classList.add('current');grid.append(item);});
    nav.append(grid,node('p','Filled: answered · Outline: current','fine')); layout.append(panel,nav); app.append(layout);
  }
  function move(index) { const total=orderedQuestions(attempt).length; if(attempt.earlyFail||index<0||index>=total)return; attempt.current=index; save(); render(); window.scrollTo({top:0,behavior:'instant'}); }
  function finish() { if(attempt.submittedAt!==null)return; attempt.submittedAt=Date.now(); save(); screen='results'; render(); window.scrollTo({top:0,behavior:'instant'}); }
  function renderResults() {
    const ordered=orderedQuestions(attempt), correct=score(), percentage=Math.round(correct/ordered.length*100), passed=correct>=HEALTH_PASS_COUNT, panel=node('section',undefined,'result-panel');
    panel.append(node('p','PRACTICE RESULT','eyebrow'),node('h1','Health Practice Test'),node('p',correct+' / '+ordered.length+' correct','result-score'),node('p',(passed?'Practice passing mark reached':'Practice passing mark not reached')+' · '+percentage+'% · Practice feedback only; not an official exam result.','status-note'));
    if(attempt.earlyFail)panel.append(node('p','This attempt stopped when 63 correct answers became mathematically impossible.','status-note'));
    const open=latestOpenHealthAttempt(state), actions=node('div',undefined,'actions'); actions.append(button(open?'Resume open attempt':'Start a rotated attempt',start,'primary'),button('Return to Health home',home)); panel.append(actions);
    const list=node('div',undefined,'result-list'); ordered.forEach((q,index)=>{const selected=attempt.answers[index],correctAnswer=selected===q.answer,item=node('details',undefined,'result-item');item.append(node('summary',(index+1)+'. '+(correctAnswer?'Correct':'Review')+' · '+q.q),node('p','Your answer: '+(selected||'Unanswered')),node('p','Correct answer: '+q.choices.find(choice=>choice[0]===q.answer)),node('p',q.explanation));list.append(item);}); panel.append(list); app.append(panel);
  }
  function render() { app.replaceChildren(); if(storageProblem)renderProblem(); else if(screen==='home')renderHome(); else if(screen==='exam')renderExam(); else renderResults(); }

  restore();
  account.subscribe(event => { if(event.key===HEALTH_PROGRESS_KEY&&event.source==='external')location.reload(); });
  render();
})();
