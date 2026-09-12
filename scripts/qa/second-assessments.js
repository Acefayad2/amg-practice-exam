async page => {
 const checks=[],errors=[],root='http://127.0.0.1:4186/course/assessments/',key='amg-life-assessments-v1';
 const check=(x,label)=>{if(!x)throw Error(label);checks.push(label);};page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assessment.js',route=>route.continue());
 await page.goto(root);await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();
 const data=await page.evaluate(()=>window.AMG_ASSESSMENTS);
 check(data.forms.length===4&&data.forms.flatMap(f=>f.questions).length===302,'Four forms contain 302 distinct assessment questions');
 for(const id of ['D','A','B','C']){
  const form=data.forms.find(f=>f.id===id);await page.goto(root);
  await page.getByRole('button',{name:id==='D'?'Start diagnostic':'Start Timed Form '+id,exact:true}).click();
  check(await page.evaluate(()=>scrollY===0),id+': starting a form resets scroll to its question heading');
  check(await page.locator('input[name="exam-answer"]').count()===4,id+': four choices');
  check(await page.locator('.result-question').count()===0,id+': no feedback before submission');
  check(await page.locator('#timer').textContent()===(id==='D'?'Untimed':'105:00'),id+': correct starting timer');
  if(id==='A'){
   await page.getByRole('button',{name:'Mark for review',exact:true}).click();
   check(await page.locator('#question-nav button').first().evaluate(b=>b.classList.contains('marked')),'Mark reflected in navigator');
   await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Previous',exact:true}).click();
   check(await page.getByRole('button',{name:'Unmark question',exact:true}).count()===1,'Mark preserved through navigation');
   await page.getByRole('button',{name:'Review & submit',exact:true}).click();
   check((await page.locator('#submit-detail').textContent()).includes('90 unanswered'),'Submission lists unanswered questions');
   await page.getByRole('button',{name:'Keep working',exact:true}).click();
  }
  let scored=0;
  for(let i=0;i<form.questions.length;i++){
   const q=form.questions[i];if(q.scored)scored++;
   const skip=id==='B'&&q.scored&&scored>75;
   const wrong=(id==='D'&&i===0)||(id==='A'&&(!q.scored||scored<=3));
   if(!skip){
    const answer=wrong?(q.answer+1)%4:q.answer;
    if(id==='A'&&i===0){await page.locator('input[name="exam-answer"][value="'+((answer+1)%4)+'"]').check();await page.getByRole('button',{name:'Clear answer',exact:true}).click();check(await page.locator('input[name="exam-answer"]:checked').count()===0,'Clear answer works');}
    await page.locator('input[name="exam-answer"][value="'+answer+'"]').check();
    if(id==='C'&&i===0)await page.getByText('I’m uncertain about this answer — include it in later review',{exact:true}).click();
    if(id==='A'&&i===17){
     const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).attempts.find(a=>a.form==='A'),key);
     await page.reload();check(await page.locator('input[name="exam-answer"]:checked').inputValue()===String(answer),'Refresh restores current answer');
     const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).attempts.find(a=>a.form==='A'),key);
     check(after.deadline===before.deadline&&after.current===17,'Refresh preserves absolute deadline and position');
    }
   }
   if(i<form.questions.length-1)await page.getByRole('button',{name:'Next',exact:true}).click();
  }
  if(id==='B'){
   await page.evaluate(k=>{const a=JSON.parse(localStorage.getItem(k)).attempts.find(a=>a.form==='B');Date.now=()=>a.deadline+50;},key);
   await page.waitForFunction(()=>document.querySelector('.score'));
   check((await page.locator('.assessment-hero').textContent()).includes('Time expired'),'Deadline automatically submits without a user click');
  }else{await page.getByRole('button',{name:'Review & submit',exact:true}).click();await page.getByRole('button',{name:'Submit and see results',exact:true}).click();}
  check(await page.evaluate(()=>scrollY===0),id+': submission or expiry reveals results from the top');
  const expected=id==='D'?'31 / 32':id==='A'?'77 / 80':id==='B'?'75 / 80':'80 / 80';
  check((await page.locator('.score').textContent()).startsWith(expected),id+': correct scored total');
  check(await page.locator('.result-question').count()===form.questions.length,id+': all explanations available');
  const rendered=await page.locator('.result-question').evaluateAll(boxes=>boxes.map(box=>({summary:box.querySelector('summary').textContent,correct:box.querySelector('ol .answer-correct').textContent,explanations:[...box.children].filter(x=>x.tagName==='P').map(x=>x.textContent)})));
  for(let i=0;i<form.questions.length;i++){const q=form.questions[i];check(rendered[i].summary.includes(q.prompt)&&rendered[i].correct===q.options[q.answer]+' — Correct'&&rendered[i].explanations.includes(q.explanation),id+': result '+q.id+' renders the keyed option and exact explanation');}
  if(id==='A')check((await page.locator('.notice').textContent()).includes('0 / 10 correct'),'Simulation misses excluded from main score');
  await page.reload();check((await page.locator('.score').textContent()).startsWith(expected),id+': submitted result survives reload');
 }
 await page.goto(root);await page.getByRole('button',{name:'Retake Timed Form A',exact:true}).click();
 let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 check(saved.attempts.filter(a=>a.form==='A').length===2&&!saved.attempts.at(-1).fresh,'Retake creates separate history and is not fresh');
 check(saved.attempts.find(a=>a.form==='A').answers.filter(x=>x!==null).length===90,'Original attempt retained');
 await page.goto(root);check(await page.getByRole('button',{name:'Resume Timed Form A',exact:true}).count()===1,'Open attempt resumes instead of silently restarting');
 saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);check(Object.keys(saved.reviews).length>=19,'Missed and uncertain questions enter delayed review');
 const qid=Object.keys(saved.reviews)[0],original=[...data.forms.flatMap(f=>f.questions),...data.lessons.flatMap(l=>l.questions)].find(q=>q.id===qid);
 await page.evaluate(({key,qid})=>{const s=JSON.parse(localStorage.getItem(key));s.reviews[qid].nextDue=Date.now()-1;localStorage.setItem(key,JSON.stringify(s));},{key,qid});
 await page.goto(root+'?review='+encodeURIComponent(qid));const prompt=await page.locator('legend').textContent();
 const q=data.lessons.find(l=>l.id===original.lesson).questions.find(q=>q.prompt===prompt);
 check(q&&q.id!==qid,'Delayed review uses another question from the related lesson');
 await page.locator('input[name="review-answer"][value="'+q.answer+'"]').check();await page.getByRole('button',{name:'Check review answer',exact:true}).click();
 saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);check(saved.reviews[qid].stage===1&&saved.reviews[qid].nextDue>Date.now()+2.9*86400000,'Successful first review schedules three-day interval');
 await page.reload();check((await page.locator('#app').textContent()).includes('next review is scheduled'),'Refresh cannot repeat a completed review stage early');
 await page.setViewportSize({width:390,height:844});await page.goto(root);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Dashboard fits mobile');
 await page.getByRole('button',{name:'Resume Timed Form A',exact:true}).scrollIntoViewIfNeeded();check(await page.evaluate(()=>scrollY>0),'Mobile resume starts from a scrolled dashboard');
 await page.getByRole('button',{name:'Resume Timed Form A',exact:true}).click();check(await page.evaluate(()=>scrollY===0&&document.querySelector('legend').getBoundingClientRect().top>=document.querySelector('.exam-bar').getBoundingClientRect().bottom),'Mobile resume reveals the complete question below the timer');
 await page.screenshot({path:'output/playwright/second-assessment-scroll-after.png'});
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Question and navigator fit mobile');
 await page.getByRole('button',{name:'Review & submit',exact:true}).click();check(await page.locator('dialog').evaluate(d=>{const r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}),'Submit dialog fits mobile');await page.getByRole('button',{name:'Keep working',exact:true}).click();
 check(errors.length===0,'No browser errors');return{checks,errors};
}
