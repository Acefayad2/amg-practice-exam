async page => {
  // Run against a locally built dist, in a dedicated Playwright session.
  const origin = new URL(page.url()).origin;
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw Error('Use an isolated local course preview.');
  const results = [], errors = [];
  for (const width of [390, 1366]) {
    const ctx = await page.context().browser().newContext({viewport:{width,height:width===390?844:900}});
    try {
      const p = await ctx.newPage(), user = {id:'health-qa-'+width,name:'Course reviewer'}, records={};
      p.on('pageerror',e=>errors.push(e.message));
      await ctx.route(origin+'/api/access',r=>r.fulfill({json:{stage:'ready',user}}));
      await ctx.route(origin+'/api/learning',async r=>{
        const reporting={status:'synced'};
        if(r.request().method()==='GET') return r.fulfill({json:{user,records,reporting}});
        const b=r.request().postDataJSON();
        if(b.action==='sync-report') return r.fulfill({json:{reporting}});
        const revision=records[b.key]?.revision||0;
        if(b.revision!==revision) return r.fulfill({status:409,json:{error:'conflict',record:records[b.key]}});
        const record=records[b.key]={revision:revision+1,value:b.value};
        return r.fulfill({json:{record,reporting}});
      });
      const ready=()=>p.waitForFunction(()=>!document.body.classList.contains('account-loading') && !document.querySelector('main')?.inert);
      await p.goto(origin+'/course/health/');await ready();
      const card=p.locator('.practice-shortcut');
      if(!(await card.innerText()).includes('Open Health mock exams')) throw Error('Missing visible Health exam link.');
      await p.screenshot({path:'output/playwright/health-'+width+'-home.png'});
      await card.click();await ready();
      await p.getByRole('button',{name:'Start exam A',exact:true}).waitFor();
      if(await p.getByRole('link',{name:'open the untimed Health practice test',includeHidden:true}).getAttribute('href')!=='/practice/health/') throw Error('Wrong exam destination.');
      await p.locator('.app-nav a').filter({hasText:/^Course$/}).click();await ready();
      await p.locator('#continue-course').click();await ready();
      const audio=p.locator('#lesson-audio'), select=p.locator('#audio-section');
      if(await audio.count()!==1)throw Error('Missing lesson audio player.');
      {
        await p.locator(".lesson-audio").scrollIntoViewIfNeeded();
        await p.screenshot({path:"output/playwright/health-"+width+"-audio.png"});
        if(await select.locator('option').count()!==6)throw Error('Incomplete lesson audio.');
        if(!await audio.evaluate(e=>e.paused))throw Error('Audio started without a user action.');
        await audio.evaluate(async e=>{await e.play();});
        await p.waitForFunction(()=>document.querySelector('#lesson-audio').currentTime>.15,null,{timeout:6500}).catch(e=>{throw Error('Audio did not start: '+e.message);});
        await audio.evaluate(e=>e.pause());await select.selectOption({index:1});
        if(!await audio.evaluate(e=>e.paused)||await p.locator('#audio-reading-link').getAttribute('href')!=='#section-1')throw Error('Section change did not preserve pause or reading position.');
        await audio.evaluate(async e=>{await e.play();e.currentTime=e.duration-.2;});
        await p.waitForFunction(()=>document.querySelector('#audio-section').selectedIndex===2 && document.querySelector('#lesson-audio').currentTime>.1,null,{timeout:6500}).catch(async()=>{throw Error('No advance: '+JSON.stringify(await audio.evaluate(e=>({time:e.currentTime,duration:e.duration,paused:e.paused,ended:e.ended,error:e.error?.code,selection:document.querySelector('#audio-section').selectedIndex,seekable:e.seekable.length && e.seekable.end(0)}))));});
        await audio.evaluate(e=>e.pause());
      }
      if(await p.locator('#open-check').isEnabled()) throw Error('Questions unlocked before reading.');
      await p.locator('#transcript-ready').click();await p.locator('#lesson-check[open]').waitFor();
      const answer=await p.evaluate(()=>window.AMG_LESSON.questions[0].answer);
      await p.locator('#check-content input[value="'+answer+'"]').check();
      await p.getByRole('button',{name:'Check answer'}).click();
      await p.getByRole('button',{name:'Next question'}).waitFor();
      await p.waitForFunction(k=>{const r=JSON.parse(localStorage.getItem(k)||'null');return r && !r.dirty && r.value?.answers?.[0]!=null;},'amg-user:'+user.id+':amg-health-lesson-01-v1');
      await p.reload();await ready();
      if(!(await p.locator('#progress-label').textContent()).startsWith('1 of ')) throw Error('The saved answer was lost on reload.');
      if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)) throw Error('Lesson layout overflows at '+width);
      await p.screenshot({path:'output/playwright/health-'+width+'-lesson.png'});
      // Confirm the last lesson is playable too, and that the host can seek into the file.
      await p.goto(origin+'/course/health/lesson-60/');await ready();
      if(await select.locator('option').count()!==6)throw Error('Missing sections in the last lesson.');
      await select.selectOption({index:5});
      await p.waitForFunction(()=>document.querySelector('#lesson-audio')?.readyState>=1);
      const src=await audio.evaluate(e=>e.currentSrc), range=await ctx.request.get(src,{headers:{Range:'bytes=0-255'}});
      if(range.status()!==206 || (await range.body()).length!==256)throw Error('Last lesson cannot seek to a byte range.');
      results.push({width,practiceLink:true,audioPlayback:true,lastLessonPlayable:true,quiz:true,progressAfterReload:true});
    } finally { await ctx.close(); }
  }
  if(errors.length)throw Error(errors.join('; '));
  return results;
}
