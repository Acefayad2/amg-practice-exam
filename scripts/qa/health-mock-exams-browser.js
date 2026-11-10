async page => {
  // Start scripts/qa/serve-health-mocks.mjs, open its Health exam URL in Playwright, then run this function.
  const origin = new URL(page.url()).origin;
  if (origin !== 'http://127.0.0.1:18445') throw Error('Use the isolated assessment API fixture.');
  const browser = page.context().browser();
  const results = [], errors = [];
  const key = 'amg-health-assessments-v1';
  const check = (condition, message) => { if (!condition) throw Error(message); };
  for (const width of [390, 1366]) {
    const user = 'exam-' + width + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
    const newContext = async () => {
      const ctx = await browser.newContext({viewport:{width,height:width===390?844:900}});
      await ctx.addCookies([{name:'qa_user',value:user,url:origin}]);
      return ctx;
    };
    const waitForSaved = async (ctx, predicate) => {
      for (let i=0; i<80; i++) {
        const res=await ctx.request.get(origin+'/api/learning');
        const records=(await res.json()).records;
        if (predicate(records[key]?.value?.attempts || [])) return;
        await new Promise(done=>setTimeout(done,125));
      }
      throw Error('The real assessment API did not save the expected state.');
    };
    let ctx = await newContext();
    try {
      let p=await ctx.newPage();
      p.on('pageerror',e=>errors.push(e.message));
      await p.goto(origin+'/licensing');
      await p.getByRole('link',{name:'Open Health mock exams'}).click();
      await p.getByRole('heading',{name:'Health mock exams',exact:true}).waitFor();
      check(await p.locator('.health-mock-cards .practice-card').count()===3,'Missing exam choice');
      check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Exam chooser overflows');
      await p.screenshot({path:'output/playwright/health-mock-chooser-'+width+'.png'});
      await p.getByRole('button',{name:'Start exam B',exact:true}).click();
      await p.locator('input[name="exam-answer"]').first().waitFor();
      const data=await p.evaluate(()=>{
        const f=window.AMG_ASSESSMENTS.forms.find(f=>f.id==='B');
        return [true,false].map(scored=>{const i=f.questions.findIndex(q=>q.scored===scored);return {i,answer:f.questions[i].answer};});
      });
      for(const q of data){
        await p.locator('#question-nav button[data-index="'+q.i+'"]').click();
        await p.locator('input[name="exam-answer"]').nth(q.answer).check();
      }
      await p.getByRole('button',{name:'Mark for review',exact:true}).click();
      await waitForSaved(ctx,attempts=>attempts.some(a=>a.form==='B'&&a.flags[data[1].i]&&a.answers.filter(x=>x!==null).length===2));
      const pre=await (await ctx.request.get(origin+'/__qa/admin')).json();
      check(pre.attempts.some(a=>a.title==='Health Mock Exam B'&&a.answered===2&&a.status==='in_progress'&&a.scorePercent===null),'Admin lost unfinished answers');
      const attemptUrl=p.url();
      await ctx.close();ctx=await newContext();p=await ctx.newPage();
      p.on('pageerror',e=>errors.push(e.message));
      await p.goto(origin+'/course/health/assessments/');
      await p.getByRole('button',{name:'Resume exam B',exact:true}).click();
      await p.waitForURL(attemptUrl);
      check(await p.locator('input[name="exam-answer"]').nth(data[1].answer).isChecked(),'Resumed answer changed');
      check(await p.getByRole('button',{name:'Unmark question'}).getAttribute('aria-pressed')==='true','Resumed flag changed');
      check(await p.locator('#answered-status').innerText()==='2 of 90 answered','Incorrect resume position');
      await p.getByRole('button',{name:'Review & submit'}).click();
      await p.getByRole('button',{name:'Keep working'}).click();
      await p.getByRole('button',{name:'Review & submit'}).click();
      await p.getByRole('button',{name:'Submit and see results'}).click();
      await p.locator('.result-question').first().waitFor();
      await waitForSaved(ctx,attempts=>attempts.some(a=>a.form==='B'&&a.submittedAt));
      const report=await (await ctx.request.get(origin+'/api/learning?report=1')).json(), result=report.tracks.health.attempts[0];
      check(result.correct===1&&result.total===80&&result.unscoredCorrect===1&&result.unscoredTotal===10,'Scored and simulation items mixed');
      check(report.attempts.length===0,'Health attempt appeared in Life');
      check((await p.locator('.result-question').count())===90,'Incomplete review');
      const back=await p.locator('.result-question a').first().getAttribute('href');
      check(back.startsWith('/course/health/lesson-'),'Review links to wrong track');
      const admin=await (await ctx.request.get(origin+'/__qa/admin')).json();
      check(admin.attempts[0].status==='completed'&&admin.attempts[0].scorePercent===1.25,'Admin score incorrect');
      await p.getByRole('button',{name:'Return to dashboard',exact:true}).click();
      await p.getByRole('button',{name:'Start exam C',exact:true}).click();
      await waitForSaved(ctx,attempts=>attempts.some(a=>a.form==='C'&&!a.submittedAt));
      const records=(await (await ctx.request.get(origin+'/api/learning')).json()).records;
      const deadline=records[key].value.attempts.find(a=>a.form==='C').deadline;
      await ctx.request.post(origin+'/__qa/clock?at='+(deadline+1000));
      await p.clock.setFixedTime(new Date(deadline+1000));
      await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
      await waitForSaved(ctx,attempts=>attempts.some(a=>a.form==='C'&&a.expired&&a.submittedAt===deadline));
      await p.locator('.result-question').first().waitFor();
      await p.goto(origin+'/course/assessments/');
      await p.getByRole('button',{name:'Start Life Practice Test',exact:true}).waitFor();
      check(await p.locator('.health-mock-cards').count()===0,'Wrong cards on the Life page');
      await p.goto(origin+'/practice/health/');
      await p.getByRole('link',{name:'Open the timed Health mock exams'}).waitFor();
      results.push({width,forms:3,resumedInNewBrowserContext:true,scored:'1/80',unscored:'1/10',expiry:true,admin:true,lifeAndUntimedEntries:true});
    } finally { await ctx.close(); }
  }
  check(!errors.length,errors.join('; '));
  return results;
}
