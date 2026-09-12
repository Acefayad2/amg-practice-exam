async page => {
 const root='http://127.0.0.1:4186/course/assessments/',checks=[],errors=[];
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assessment.js',route=>route.continue());
 await page.goto(root);
 const version=await page.evaluate(()=>window.AMG_ASSESSMENTS.version),key='amg-life-assessments-v'+version;
 await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Start Timed Form A',exact:true}).click();
 await page.getByRole('button',{name:'Return to dashboard',exact:true}).click();
 await page.getByRole('button',{name:'Start Timed Form B',exact:true}).click();
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)),a=s.attempts.find(a=>a.form==='A');a.startedAt=Date.now()-104*60000;a.deadline=a.startedAt+105*60000;localStorage.setItem(k,JSON.stringify(s));},key);
 await page.reload();
 await page.evaluate(k=>{window.scrollTo(0,500);const s=JSON.parse(localStorage.getItem(k)),a=s.attempts.find(a=>a.form==='A');Date.now=()=>a.deadline+50;},key);
 check(await page.evaluate(()=>scrollY>=400),'Different active form begins at a scrolled reading position');
 await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).attempts.find(a=>a.form==='A').submittedAt!==null,key);
 check((await page.locator('.exam-bar').textContent()).includes('Timed Form B'),'Background expiry retains the currently active form');
 check(await page.evaluate(()=>scrollY>=400),'Background expiry does not reset unrelated reading position');
 check(await page.locator('.score').count()===0,'The unexpired current form stays in its question view');
 await page.evaluate(k=>{const b=JSON.parse(localStorage.getItem(k)).attempts.find(a=>a.form==='B');Date.now=()=>b.deadline+50;},key);
 await page.waitForFunction(()=>document.querySelector('.score'));
 check(await page.evaluate(()=>scrollY===0),'Active-form expiry reveals the result heading from the top');
 check((await page.locator('.assessment-hero').textContent()).includes('Time expired'),'Active expiry is labeled');
 check((await page.locator('.score').textContent()).startsWith('0 / 80'),'Unanswered active-expiry score remains correct');
 check(errors.length===0,'No errors in active or unrelated expiry transitions');
 return {checks,errors};
}
