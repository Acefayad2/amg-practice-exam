async page => {
 const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 const base='https://amg-exam-portal.netlify.app';
 await page.goto(base+'/course/');
 check(await page.locator('[data-lesson]').count()===60,'60 live lesson links');
 await page.getByRole('link',{name:'Practice & review',exact:true}).click();
 await page.waitForFunction(()=>window.AMG_ASSESSMENTS);
 check(await page.getByRole('heading',{name:'Know what to study next.',exact:true}).isVisible(),'Course navigation opens published dashboard');
 check(await page.getByRole('button',{name:/^Start /}).count()===4,'Diagnostic and three timed forms available');
 await page.getByRole('button',{name:'Start diagnostic',exact:true}).click();
 check(await page.getByText('Question 1 of 32',{exact:true}).isVisible(),'Live diagnostic starts');
 check(await page.getByRole('radio').count()===4,'Live answer controls appear');
 const attemptUrl=page.url();await page.reload();
 check(page.url()===attemptUrl&&await page.getByText('Question 1 of 32',{exact:true}).isVisible(),'Attempt resumes after refresh');
 await page.setViewportSize({width:390,height:844});
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Live assessment fits mobile');
 await page.goto(base+'/course/lesson-60/');
 await page.waitForFunction(()=>window.AMG_LESSON&&document.querySelector('video').readyState>=1);
 check((await page.locator('#next-lesson a').getAttribute('href'))==='/course/assessments/','Final lesson continues to assessments');
 check(await page.evaluate(()=>document.querySelector('video').duration>=180&&document.querySelector('video').duration<=300),'Final video loads with expected duration');
 await page.goto(base+'/course/coverage/');
 await page.waitForFunction(()=>document.querySelectorAll('#rows>details').length===48);
 check(await page.locator('#rows>details').count()===48,'48 live subsection evidence records');
 check(await page.getByText(/three independent timed forms/i).count()>0,'Coordinator page reflects final practice release');
 check(errors.length===0,'No browser errors on live routes');
 return{checks,errors};
}
