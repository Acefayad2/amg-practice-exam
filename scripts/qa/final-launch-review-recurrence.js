async page => {
 const root='http://127.0.0.1:4197/course/assessments/',key='amg-life-assessments-v1',checks=[],errors=[],cases=[];const DAY=86400000;
 page.on('pageerror',e=>errors.push(e.message));const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 await page.route('**/*',route=>route.continue());
 await page.goto(root);const data=await page.evaluate(()=>window.AMG_ASSESSMENTS),form=data.forms.find(f=>f.id==='D'),q=form.questions[0];
 for(const kind of ['wrong','uncertain','pending-miss']){
  const now=Date.now(),history=[{questionId:q.id,at:now-DAY,correct:true}],answers=form.questions.map((x,i)=>i===0&&kind!=='uncertain'?(x.answer+1)%4:x.answer),id='regression-'+kind;
  const before={version:data.version,attempts:[{id,form:'D',startedAt:now-60000,submittedAt:null,expired:false,fresh:false,answers,flags:answers.map(()=>false),uncertain:answers.map((_,i)=>kind==='uncertain'&&i===0),reviewed:answers.map(()=>false),current:0}],seen:['D'],reviews:{[q.id]:{stage:kind==='pending-miss'?2:3,nextDue:now+5*DAY,history}},lessonImports:{}};
  await page.evaluate(({key,before})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(before));},{key,before});await page.goto(root+'?attempt='+id);
  await page.getByRole('button',{name:'Review & submit',exact:true}).click();await page.locator('#confirm-submit').click();
  let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);const r=saved.reviews[q.id],a=saved.attempts[0];
  check(r.stage===0&&Math.abs(r.nextDue-a.submittedAt-DAY)<10,kind+': later event starts a one-day review');
  check(JSON.stringify(r.history)===JSON.stringify(history),kind+': prior review history preserved');
  check(a.id===id&&a.fresh===false&&JSON.stringify(a.answers)===JSON.stringify(answers),kind+': attempt identity, original answers and retake status preserved');
  check(r.lastMissId==='attempt:'+id&&r.lastMissAt===a.submittedAt,kind+': stable dated miss identity persisted');
  const snapshot=JSON.stringify(r);await page.reload();await page.goto(root);saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  check(JSON.stringify(saved.reviews[q.id])===snapshot,kind+': reload and dashboard do not reset the interval');
  cases.push({kind,review:saved.reviews[q.id],submittedAt:a.submittedAt});
 }
 const lesson=data.lessons.find(l=>l.id==='03'),lk='amg-life-lesson-'+lesson.id+'-v'+lesson.version,lq=lesson.questions[0];
 const now=Date.now(),first=lesson.questions.map((x,i)=>i===0?(x.answer+1)%4:x.answer),past=now-DAY;
 const reviewed={stage:3,nextDue:past,history:[{questionId:lq.id,at:past,correct:true}]};
 async function seedLesson(record,review=reviewed){await page.evaluate(({key,lk,record,review,lqid})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify({version:1,attempts:[],seen:[],reviews:{[lqid]:review},lessonImports:{}}));localStorage.setItem(lk,JSON.stringify(record));},{key,lk,record,review,lqid:lq.id});await page.goto(root);return await page.evaluate(({key,lqid})=>JSON.parse(localStorage.getItem(key)).reviews[lqid],{key,lqid:lq.id});}
 const legacy={videoEnded:true,complete:true,answers:lesson.questions.map(x=>x.answer),firstAnswers:first,completedAt:new Date(now).toISOString()};
 let r=await seedLesson(legacy);check(r.stage===3&&r.nextDue===reviewed.nextDue,'Legacy undated lesson reimport cannot reopen a completed schedule');
 const dated={...legacy,practiceAttemptId:'later-lesson-attempt',firstAnswerAt:first.map(()=>new Date(now).toISOString())};
 r=await seedLesson(dated);check(r.stage===0&&r.nextDue===now+DAY,'A genuinely later ISO-dated lesson first miss reopens completed review');
 check(r.lastMissId===lk+':later-lesson-attempt:0','Lesson miss identity binds stable attempt and original question');
 const due=r.nextDue;
 const numeric={...dated,firstAnswerAt:first.map(()=>now)};r=await seedLesson(numeric);check(r.stage===0&&r.nextDue===due,'Numeric first-answer timestamps remain compatible');await page.evaluate(lk=>{const s=JSON.parse(localStorage.getItem(lk));s.completedAt=new Date(Date.now()+1000).toISOString();localStorage.setItem(lk,JSON.stringify(s));},lk);await page.reload();
 r=await page.evaluate(({key,qid})=>JSON.parse(localStorage.getItem(key)).reviews[qid],{key,qid:lq.id});check(r.nextDue===due,'Completion date change for the same lesson miss does not postpone review');
 const completedAgain={...r,stage:3,nextDue:now+2000,history:[...r.history,{questionId:lq.id,at:now+2000,correct:true}]};
 r=await seedLesson(dated,completedAgain);check(r.stage===3,'Reimporting the same dated miss after completing review does not restart it');
 const older={...dated,practiceAttemptId:'earlier-lesson-attempt',firstAnswerAt:first.map(()=>past-1000)};
 r=await seedLesson(older);check(r.stage===3,'An earlier dated miss cannot replace a later successful review');
 await page.evaluate(({key,lk,legacy})=>{localStorage.clear();localStorage.setItem(lk,JSON.stringify(legacy));},{key,lk,legacy});await page.goto(root);
 r=await page.evaluate(({key,qid})=>JSON.parse(localStorage.getItem(key)).reviews[qid],{key,qid:lq.id});check(r.stage===0&&Number.isFinite(r.nextDue),'Legacy first miss still creates its initial review schedule');
 check(errors.length===0,'No runtime errors');
 return{reviewedAt:new Date().toISOString(),checks,cases,errors,scope:'New wrong/uncertain submissions use actual submit controls with explicit saved-date fixtures. Lesson-import tests use old/new dated fixtures; they do not simulate11 calendar days of human learning. Original scored/retake state and existing review history are checked unchanged.'};
}
