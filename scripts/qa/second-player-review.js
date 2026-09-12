async page => {
  // Run with Playwright CLI --session amg-second-player run-code --filename this-file.
  // Optional URL query qaFrom/qaTo bounds a batch. Default: all 60 lessons.
  const initial = page.url();
  const from = Number(initial.match(/[?&]qaFrom=(\d+)/)?.[1] || 1);
  const to = Number(initial.match(/[?&]qaTo=(\d+)/)?.[1] || 60);
  if (!initial.startsWith('http://127.0.0.1:4186/')) throw Error('QA requires the isolated local server on port 4186');
  const results = [], errors = [], consoleErrors = [], mediaFailures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', request => mediaFailures.push({url:request.url(),error:request.failure()?.errorText}));
  await page.addInitScript(() => {
    const key = sessionStorage.getItem('amg-second-review-clear');
    if (key) { localStorage.removeItem(key); sessionStorage.removeItem('amg-second-review-clear'); }
    const seed = sessionStorage.getItem('amg-second-review-seed');
    if (seed) { const value = JSON.parse(seed); localStorage.setItem(value.key,JSON.stringify(value.state)); sessionStorage.removeItem('amg-second-review-seed'); }
  });
  for (let n = from; n <= to; n++) {
    const id = String(n).padStart(2,'0'), checks = [];
    const check = (value,label) => { if (!value) throw Error('Part '+n+': '+label); checks.push(label); };
    await page.setViewportSize({width:1280,height:900});
    await page.goto('http://127.0.0.1:4186/course/lesson-'+id+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.AMG_LESSON && document.querySelector('video')?.readyState >= 1,null,{timeout:60000});
    const data = await page.evaluate(() => window.AMG_LESSON);
    const key = 'amg-life-lesson-'+data.id+'-v'+data.version;
    await page.evaluate(k => sessionStorage.setItem('amg-second-review-clear',k),key);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1,null,{timeout:60000});
    check(data.number === n && data.id === id,'Correct lesson identity and dynamic version');
    check(await page.locator('#open-check').isDisabled(),'Fresh study prerequisite enforced');
    check(await page.locator('#complete').isDisabled(),'Fresh completion prerequisite enforced');
    check(await page.locator('video').evaluate((v,d) => Math.abs(v.duration-d)<1,data.duration),'Native media duration matches manifest within 1 second');
    check(await page.locator('#video-error').isHidden(),'Video error fallback remains hidden on successful load');
    const actualDuration = await page.locator('video').evaluate(v => v.duration);
    await page.evaluate(() => { document.querySelector('video').currentTime = 40; });
    await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).position >= 39,key,{timeout:15000});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('video').currentTime >= 39,null,{timeout:60000});
    check(await page.locator('video').evaluate(v => v.currentTime < 45),'Playback position restored on refresh');
    await page.locator('video').evaluate(async v => { v.muted = true; v.currentTime = v.duration-.45; await v.play(); });
    await page.locator('dialog[open]').waitFor({timeout:60000});
    check(await page.locator('#check-heading').textContent() === 'Question 1 of '+data.questions.length,'Native ended event opens required question dialog');
    const orders = [];
    const readOrder = async q => {
      const choices = await page.locator('input[name="lesson-answer"]').evaluateAll(inputs => inputs.map(input => ({value:Number(input.value),label:input.parentElement.querySelector('span').textContent})));
      check(choices.length === q.options.length && new Set(choices.map(x=>x.value)).size === q.options.length,'Question '+q.id+' presents each original option once');
      choices.forEach((choice,index) => check(choice.label === String.fromCharCode(65+index)+'. '+q.options[choice.value],'Question '+q.id+' option '+index+' label matches original index'));
      return choices.map(x=>x.value);
    };
    const feedbackOrder = async (q,order) => {
      const items = await page.locator('#check-feedback li').allTextContents();
      check(items.length === q.options.length && items.every((text,i) => text === String.fromCharCode(65+i)+'. '+q.options[order[i]]+' '+q.explanations[order[i]]),'Question '+q.id+' explanations match displayed labels and original options');
    };
    const wrong = (data.questions[0].answer+1)%data.questions[0].options.length;
    const firstOrder = await readOrder(data.questions[0]);
    await page.locator('input[name="lesson-answer"][value="'+wrong+'"]').check();
    await page.getByRole('button',{name:'Check answer',exact:true}).click();
    check(await page.locator('#check-feedback h3').textContent() === 'Review, then try again.','Incorrect answer gets retry feedback');
    await feedbackOrder(data.questions[0],firstOrder);
    check(await page.locator('#complete').isDisabled(),'Incorrect answer cannot complete lesson');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#open-check').click();
    check(JSON.stringify(await readOrder(data.questions[0])) === JSON.stringify(firstOrder),'Display permutation remains stable across refresh');
    check(Number(await page.locator('input[name="lesson-answer"]:checked').inputValue()) === wrong,'Saved pre-shuffle original index restores the intended selected option');
    await feedbackOrder(data.questions[0],firstOrder);
    await page.getByRole('button',{name:'Try this question again',exact:true}).click();
    for (let i=0;i<data.questions.length;i++) {
      const q = data.questions[i], order = await readOrder(q); orders.push(order);
      await page.locator('input[name="lesson-answer"][value="'+q.answer+'"]').check();
      await page.getByRole('button',{name:'Check answer',exact:true}).click();
      check(await page.locator('#check-feedback h3').textContent() === 'Correct.','Question '+q.id+' original answer grades correctly');
      await feedbackOrder(q,order);
      if (i < data.questions.length-1) await page.getByRole('button',{name:'Next question',exact:true}).click();
    }
    await page.getByRole('button',{name:'Finish Part '+n,exact:true}).click();
    const completed = await page.evaluate(k => JSON.parse(localStorage.getItem(k)),key);
    check(completed.complete && !!completed.completedAt && completed.videoEnded,'Completion timestamp and native ended state saved');
    check(completed.answers.every((answer,i) => answer === data.questions[i].answer),'Every required answer stored as original index');
    check(completed.firstAnswers[0] === wrong && completed.attempts[0] === 2,'First mistake and retry count preserved');
    check(await page.locator('#next-lesson').isVisible(),'Next lesson unlocked only after mastery');
    const legacy = {...completed,completedAt:'2026-09-01T12:00:00.000Z'};
    await page.evaluate(value => sessionStorage.setItem('amg-second-review-seed',JSON.stringify(value)),{key,state:legacy});
    await page.reload({waitUntil:'domcontentloaded'});
    check(await page.locator('#complete').textContent() === 'Lesson finished','Existing completed state survives refresh and display shuffle');
    check((await page.evaluate(k => JSON.parse(localStorage.getItem(k)),key)).completedAt === legacy.completedAt,'Existing completion timestamp is retained');
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(() => document.querySelector('track')?.track.cues?.length > 0,null,{timeout:30000});
    await page.locator('#inline-captions').waitFor({state:'visible',timeout:5000});
    check(await page.locator('#inline-captions').isVisible(),'Mobile caption controls below the video');
    // Sample inside a real caption cue; some videos intentionally pause between scenes.
    await page.evaluate(() => { const cue=document.querySelector('track').track.cues[3];document.querySelector('video').currentTime=(cue.startTime+cue.endTime)/2; });
    await page.waitForFunction(() => document.querySelector('#inline-caption-text').textContent.trim().length > 0,null,{timeout:30000});
    check(await page.locator('track').evaluate(t => t.track.mode) === 'hidden','Mobile captions avoid duplicate native rendering');
    await page.locator('#toggle-inline-captions').click();
    check(await page.locator('#inline-caption-text').isHidden(),'Mobile hide captions works');
    await page.locator('#toggle-inline-captions').click();
    check(await page.locator('#inline-caption-text').isVisible(),'Mobile show captions works');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'Mobile page has no horizontal overflow');
    await page.locator('#open-check').click();
    check(await page.locator('dialog').evaluate(d => { const r=d.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1; }),'Mobile dialog fits viewport');
    check(await page.locator('#check-heading').textContent() === 'Question 1 of '+data.questions.length,'Completed-answer review starts at question 1');
    check(Number(await page.locator('input[name="lesson-answer"]:checked').inputValue()) === data.questions[0].answer,'Stored completion restores correct selection after shuffle');
    await feedbackOrder(data.questions[0],orders[0]);
    if ([1,2,20,40,60].includes(n)) await page.screenshot({path:'output/playwright/second-player-mobile-'+id+'.png'});
    await page.keyboard.press('Escape');
    check(await page.locator('#open-check').evaluate(b => document.activeElement === b),'Dialog close restores focus to opener');
    results.push({lesson:n,version:data.version,questions:data.questions.length,actualDuration,checks:checks.length,orders,allPassed:true});
  }
  if (errors.length) throw Error(errors.join('; '));
  return {from,to,lessons:results.length,questions:results.reduce((s,r)=>s+r.questions,0),checks:results.reduce((s,r)=>s+r.checks,0),results,pageErrors:errors,consoleErrors,requestFailures:mediaFailures};
}
