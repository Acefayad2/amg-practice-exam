async page => {
 const root='http://127.0.0.1:4186/course/assessments/',key='amg-life-assessments-v1',checks=[],errors=[];
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};page.on('pageerror',e=>errors.push(e.message));
 await page.goto(root);const data=await page.evaluate(()=>window.AMG_ASSESSMENTS),backup=await page.evaluate(k=>localStorage.getItem(k),key);
 await page.evaluate(({key,data})=>{
  for(const l of data.lessons)localStorage.setItem('amg-life-lesson-'+l.id+'-v'+l.version,JSON.stringify({answers:l.questions.map(q=>q.answer),firstAnswers:l.questions.map(q=>q.answer),attempts:l.questions.map(()=>1),videoEnded:true,complete:true,completedAt:new Date().toISOString()}));
  const s=JSON.parse(localStorage.getItem(key));for(const a of s.attempts)a.reviewed=a.answers.map(()=>true);localStorage.setItem(key,JSON.stringify(s));
 },{key,data});await page.reload();
 check(await page.getByRole('heading',{name:'60 of 60 course parts complete',exact:true}).count()===1,'All 60 validated lesson records aggregate');
 check(!(await page.locator('#app').textContent()).includes('The course and two-form study target are met'),'Same-day fresh forms do not satisfy separate-day target');
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)),a=s.attempts.find(x=>x.form==='C');a.submittedAt-=2*86400000;localStorage.setItem(k,JSON.stringify(s));},key);await page.reload();
 check((await page.locator('#app').textContent()).includes('The course and two-form study target are met'),'Separate-day fresh forms and reviewed misses satisfy the stated target');
 const qualified=page.locator('tr').filter({has:page.getByRole('cell',{name:'Qualified plans',exact:true})});
 check((await qualified.textContent()).includes('Small sample'),'Qualified-plan sample is not overstated as mastery');
 await page.evaluate(()=>{const k='amg-life-lesson-03-v1',s=JSON.parse(localStorage.getItem(k));s.answers[0]=(s.answers[0]+1)%4;localStorage.setItem(k,JSON.stringify(s));});await page.reload();
 check(await page.getByRole('heading',{name:'59 of 60 course parts complete',exact:true}).count()===1,'Incorrect answer invalidates aggregate completion');
 await page.evaluate(({data})=>{const l=data.lessons.find(x=>x.id==='03'),k='amg-life-lesson-03-v1',s=JSON.parse(localStorage.getItem(k));s.answers[0]=l.questions[0].answer;s.firstAnswers[0]=(l.questions[0].answer+1)%4;localStorage.setItem(k,JSON.stringify(s));},{data});await page.reload();
 let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);check(Boolean(saved.reviews['L03-01']),'Lesson first mistake enters delayed review despite a correct retry');
 const qid=Object.keys(saved.reviews)[0];
 async function answerDue(correct){
  await page.evaluate(({key,qid})=>{const s=JSON.parse(localStorage.getItem(key));s.reviews[qid].nextDue=Date.now()-1;localStorage.setItem(key,JSON.stringify(s));},{key,qid});
  await page.goto(root+'?review='+encodeURIComponent(qid));const prompt=await page.locator('legend').textContent();const q=[...data.forms.flatMap(f=>f.questions),...data.lessons.flatMap(l=>l.questions)].find(q=>q.prompt===prompt);
  await page.locator('input[name="review-answer"][value="'+(correct?q.answer:(q.answer+1)%4)+'"]').check();await page.getByRole('button',{name:'Check review answer',exact:true}).click();return await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 }
 saved=await answerDue(true);check(saved.reviews[qid].stage===2&&saved.reviews[qid].nextDue>Date.now()+6.9*86400000,'Second successful review schedules seven days');
 saved=await answerDue(false);check(saved.reviews[qid].stage===0&&saved.reviews[qid].nextDue>Date.now()+.9*86400000,'Miss resets the review interval to one day');
 await page.goto(root);const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download study record',exact:true}).click()]);check(download.suggestedFilename()==='amg-life-study-record.json','Study record export produces a JSON download');
 // Two actual pages share state; a write must settle without a storage-event loop.
 await page.getByRole('button',{name:'Resume Timed Form A',exact:true}).click();const currentUrl=page.url(),peer=await page.context().newPage();await peer.goto(currentUrl);
 await page.evaluate(()=>{window.qaStorageEvents=0;window.addEventListener('storage',()=>window.qaStorageEvents++);});
 await peer.locator('input[name="exam-answer"][value="1"]').check();await page.waitForFunction(()=>document.querySelector('input[name="exam-answer"]:checked')?.value==='1');
 check(await page.evaluate(()=>window.qaStorageEvents<=2),'Two tabs synchronize without repeated storage writes');await peer.close();
 // Reloading an expired saved attempt must submit immediately, preserving its answers.
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)),a=s.attempts.find(a=>a.form==='A'&&!a.submittedAt);a.startedAt=Date.now()-106*60000;localStorage.setItem(k,JSON.stringify(s));},key);await page.reload();
 check((await page.locator('.assessment-hero').textContent()).includes('Time expired'),'An attempt that expires while closed submits on reload');
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,attempts:[null,{id:'invalid',form:'A',answers:[]}],seen:[],reviews:{bad:{stage:9}}})),key);await page.goto(root);
 check((await page.locator('#storage-status').textContent()).includes('could not be restored'),'Malformed saved attempts recover with a notice');
 check(await page.getByRole('button',{name:'Start Timed Form A',exact:true}).count()===1,'Invalid attempts do not block a new start');
 await page.evaluate(({key,backup,data})=>{localStorage.setItem(key,backup);for(const l of data.lessons)localStorage.removeItem('amg-life-lesson-'+l.id+'-v'+l.version);},{key,backup,data});
 await page.addInitScript(()=>{Object.defineProperty(Storage.prototype,'setItem',{value(){throw new DOMException('Blocked','SecurityError');}});});await page.goto(root);
 check((await page.locator('#storage-status').textContent()).includes('unavailable'),'Blocked storage warning is explicit');
 await page.getByRole('button',{name:'Resume Timed Form A',exact:true}).click();await page.locator('input[name="exam-answer"][value="2"]').check();
 check(await page.locator('input[name="exam-answer"]:checked').inputValue()==='2','In-memory answering works with storage blocked');
 check(errors.length===0,'Recovery cases have no browser errors');return{checks,errors};
}
