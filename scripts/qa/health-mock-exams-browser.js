async page => {
  // Run against serve-health-mocks.mjs: real website API, isolated in-memory records.
  const origin=new URL(page.url()).origin;
  if(origin!=='http://127.0.0.1:18445')throw Error('Use the isolated assessment API fixture.');
  const browser=page.context().browser(),results=[],errors=[];
  const check=(v,msg)=>{if(!v)throw Error(msg);};
  for(const width of [390,1366]){
    const uid='exam-'+width+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
    const newContext=async()=>{
      const ctx=await browser.newContext({viewport:{width,height:width===390?844:900}});
      await ctx.addCookies([{name:'qa_user',value:uid,url:origin}]);return ctx;
    };
    let ctx=await newContext();
    const newPage=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));return p;};
    const records=async()=>(await(await ctx.request.get(origin+'/api/learning')).json()).records;
    const wait=async(key,predicate)=>{
      for(let i=0;i<80;i++){const rows=(await records())[key]?.value?.attempts||[];
        if(predicate(rows))return rows;await new Promise(r=>setTimeout(r,100));}
      throw Error('Expected attempt was not saved for '+key);
    };
    try{
      let p=await newPage();
      for(const track of ['life','health']){
        const title=track==='life'?'Life Mock Exam':'Health Mock Exam',key='amg-'+track+'-assessments-v1';
        await p.goto(origin+'/licensing');
        check(await p.locator('#practice-tests .btn').count()===2,'There should be two mock exams on Licensing');
        await p.getByRole('link',{name:'Open '+title,exact:false}).click();
        await p.getByRole('heading',{name:title,exact:true}).waitFor();
        check(await p.locator('.form-start').count()===1,'Track offers more than one exam');
        check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
        await p.screenshot({path:'output/playwright/'+track+'-rotating-mock-'+width+'.png'});
        await p.getByRole('button',{name:'Start '+title,exact:true}).click();
        await p.locator('input[name="exam-answer"]').first().waitFor();
        const [first]=await wait(key,rows=>rows.length===1);
        const data=await p.evaluate(attempt=>{
          const d=window.AMG_ASSESSMENTS,b=window.AMG_ASSESSMENT_ROTATION.createMockBank(d.track,d.forms,d.extraQuestions);
          return [true,false].map(scored=>{const f=b.formFor(attempt),i=f.questions.findIndex(q=>q.scored===scored);return {i,answer:f.questions[i].answer,prompt:f.questions[i].prompt};});
        },first);
        for(const q of data){
          await p.locator('#question-nav button[data-index="'+q.i+'"]').click();
          check(await p.locator('legend').innerText()===q.prompt,'Prompt did not match stored question ID');
          await p.locator('input[name="exam-answer"]').nth(q.answer).check();
        }
        await p.getByRole('button',{name:'Mark for review',exact:true}).click();
        await wait(key,rows=>rows[0]?.flags[data[1].i] && rows[0].answers.filter(x=>x!==null).length===2);
        const admin=async()=>(await(await ctx.request.get(origin+'/__qa/admin')).json()).attempts;
        check((await admin()).some(a=>a.title===title && a.status==='in_progress'&&a.answered===2 && a.scorePercent===null),'Admin lost pending attempt');
        const attemptUrl=p.url(),home=attemptUrl.split('?')[0];
        await ctx.close();ctx=await newContext();p=await newPage();await p.goto(home);
        await p.getByRole('button',{name:'Resume '+title,exact:true}).click();await p.waitForURL(attemptUrl);
        check(await p.locator('legend').innerText()===data[1].prompt,'Resumed prompt moved');
        check(await p.locator('input[name="exam-answer"]').nth(data[1].answer).isChecked(),'Resumed answer changed');
        check(await p.getByRole('button',{name:'Unmark question'}).getAttribute('aria-pressed')==='true','Flag lost on resume');
        await p.getByRole('button',{name:'Review & submit'}).click();
        await p.getByRole('button',{name:'Submit and see results'}).click();
        await p.locator('.result-question').first().waitFor();
        const submitted=await wait(key,rows=>!!rows[0].submittedAt);
        check(first.questionIds.join()===submitted[0].questionIds.join(),'Submitted question order changed');
        const report=await(await ctx.request.get(origin+'/api/learning?report=1')).json();
        const result=(track==='life'?report:report.tracks.health).attempts[0];
        check(result.correct===1&&result.total===80&&result.unscoredCorrect===1&&result.unscoredTotal===10,'Scored/unscored mix-up');
        check((await admin()).some(a=>a.title===title && a.status==='completed' && a.scorePercent===1.25),'Admin scoring mismatch');
        check(await p.locator('.result-question').count()===90,'Incomplete explanations');
        const review=await p.locator('.result-question a').first().getAttribute('href');
        check(review.startsWith(track==='health'?'/course/health/lesson-':'/course/lesson-'),'Review links cross tracks');
        await p.getByRole('button',{name:'Return to dashboard',exact:true}).click();
        await p.getByRole('button',{name:'Retake '+title,exact:true}).click();
        const [,second]=await wait(key,rows=>rows.length===2);
        check(second.questionIds.every(id=>!first.questionIds.includes(id)),'Early question repeat');
        if(track==='health'){
          await ctx.request.post(origin+'/__qa/clock?at='+(second.deadline+1000));await p.clock.setFixedTime(new Date(second.deadline+1000));
          await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
          await wait(key,rows=>rows[1].expired&&rows[1].submittedAt===second.deadline);
          await p.locator('.result-question').first().waitFor();
        }
        results.push({width,track,oneEntry:true,resume:true,noRetakeOverlap:true,scoring:true});
      }
    }finally{await ctx.close();}
  }
  check(!errors.length,errors.join('; '));return results;
}
