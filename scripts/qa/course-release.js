async page => {
 const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 await page.goto('http://127.0.0.1:4174/course/index.html');
 check(await page.locator('[data-lesson]').count()===60,'All 60 lesson links present');
 check(await page.evaluate(()=>[...document.querySelectorAll('[data-lesson]')].every(x=>x.dataset.answers.split(',').length>=6)),'All completion keys available');
 await page.evaluate(()=>localStorage.setItem('amg-life-lesson-03-v1',JSON.stringify({complete:true,answers:[]})));
 await page.reload();check(!await page.locator('[data-lesson="03"]').evaluate(x=>x.classList.contains('is-complete')),'Corrupt completion cannot mark a lesson finished');
 await page.goto('http://127.0.0.1:4174/course/coverage/index.html');
 await page.waitForFunction(()=>document.querySelectorAll('#rows>details').length===48);
 check(await page.locator('#rows .badge').evaluateAll(xs=>xs.every(x=>x.textContent==='Published · approval pending')),'All subsection evidence shows published teaching, with approval pending');
 await page.locator('#search').fill('vesting');check(await page.locator('#rows>details').count()>0,'Coverage search works');
 await page.locator('#clear').click();check(await page.locator('#rows>details').count()===48,'Coverage filter reset works');
 await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Coverage fits mobile');
 await page.goto('http://127.0.0.1:4174/course/lesson-03/index.html');
 await page.waitForFunction(()=>window.AMG_LESSON);
 await page.evaluate(()=>{document.querySelector('#scenario-video').dispatchEvent(new Event('error'));});
 check(await page.locator('#video-error').isVisible(),'Video error offers recovery');
 await page.getByText('Read the full transcript',{exact:true}).click();await page.locator('#transcript-ready').click();
 check(await page.locator('dialog[open]').count()===1,'Transcript alternative unlocks required questions');
 check(await page.locator('#complete').isDisabled(),'Transcript alone does not complete lesson');
 await page.keyboard.press('Escape');
 await page.addInitScript(()=>{Object.defineProperty(Storage.prototype,'setItem',{value(){throw new DOMException('Blocked','SecurityError');}});});
 await page.goto('http://127.0.0.1:4174/course/lesson-60/index.html');
 check((await page.locator('#save-status').textContent()).includes('unavailable'),'Blocked storage gives a clear warning');
 await page.getByText('Read the full transcript',{exact:true}).click();await page.locator('#transcript-ready').click();
 check(await page.locator('dialog[open]').count()===1,'Questions remain usable with storage blocked');
 check(errors.length===0,'No browser errors');return{checks,errors};
}
