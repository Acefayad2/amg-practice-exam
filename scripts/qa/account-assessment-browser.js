async page => {
  // Run only in an isolated QA browser. All account requests are intercepted here;
  // no real Identity login, credentials, course records, or reporting service is used.
  const origin='http://127.0.0.1:4201',key='amg-life-assessments-v1',uid='qa-account-a',cache='amg-user:'+uid+':'+key;
  const checks=[],errors=[],requests=[],copy=x=>JSON.parse(JSON.stringify(x));
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  let records={},userId=uid,revision=0;
  const context=page.context(),peers=[];
  const mock=async route=>{
    const request=route.request();
    if(request.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:userId,name:'Isolated QA',email:'qa@example.invalid'},records,reporting:{status:'synced'}})});
    const body=request.postDataJSON();requests.push(copy(body));
    if(request.headers()['x-amg-user']!==userId)return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'account_changed'})});
    if(body.action==='sync-report')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reporting:{status:'synced'}})});
    const current=records[body.key];
    if(body.revision!==(current?.revision||0))return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'conflict',record:current})});
    const record={revision:(current?.revision||0)+1,value:copy(body.value)};records[body.key]=record;revision++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({record,reporting:{status:'synced'}})});
  };
  await context.route('**/api/learning',mock);
  await context.route('**/.netlify/identity/**',route=>route.fulfill({status:401,contentType:'application/json',body:'{"error":"QA does not log in"}'}));
  page.on('pageerror',error=>errors.push(error.message));
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),cache);
  const saved=()=>page.waitForFunction(k=>{const r=JSON.parse(localStorage.getItem(k)||'null');return r&&!r.dirty;},cache);
  const hashAssets=()=>page.evaluate(async()=>{const out={};for(const file of ['/course/shared/account.js','/course/assessments/assessment.js','/course/assessments/assessment-data.js']){const data=await(await fetch(file,{cache:'no-store'})).arrayBuffer();out[file]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('');}return out;});
  try {
    await page.goto(origin+'/course/assessments/');await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite());
    const hashes=await hashAssets();await page.evaluate(()=>localStorage.clear());records={};
    await page.reload();await page.getByRole('button',{name:'Start diagnostic',exact:true}).waitFor();await saved();
    const data=await page.evaluate(()=>window.AMG_ASSESSMENTS);
    const peer=await context.newPage();peers.push(peer);peer.on('pageerror',error=>errors.push(error.message));
    await peer.addInitScript(()=>{window.__QA_HOLD_STORAGE=true;window.addEventListener('storage',event=>{if(window.__QA_HOLD_STORAGE&&event.key?.startsWith('amg-user:'))event.stopImmediatePropagation();},true);});
    await peer.goto(origin+'/course/assessments/');await peer.getByRole('button',{name:'Start diagnostic',exact:true}).waitFor();
    await page.getByRole('button',{name:'Start diagnostic',exact:true}).click();await page.locator('input[name="exam-answer"]').first().waitFor();await saved();
    const first=(await read()).value.attempts[0];check(first.form==='D','First tab starts a real diagnostic and saves it to the mocked account');
    await peer.locator('[data-form="A"] .form-start').click();await peer.locator('#account-access-guard').waitFor();
    const after=await read();check(after.value.attempts.length===1&&after.value.attempts[0].id===first.id,'Stale tab with delayed storage events cannot erase the other tab’s saved attempt');
    check(after.rejectedValue.attempts.length===1&&after.rejectedValue.attempts[0].form==='A','Rejected stale attempt is retained separately for conflict recovery');
    check(records[key].value.attempts.length===1&&records[key].value.attempts[0].id===first.id,'The stale assessment never reaches or replaces the account record');
    await peer.close();peers.splice(peers.indexOf(peer),1);

    const q=data.lessons[0].questions[0],alternate=data.lessons[0].questions[1];
    const blank=()=>({version:data.version,attempts:[],seen:[],reviews:{},lessonImports:{}});
    const reviewState=blank();reviewState.reviews[q.id]={stage:0,nextDue:Date.now()-1000,history:[],lastMissAt:Date.now()-86400000,lastMissId:'qa-review-fixture'};
    records={[key]:{revision:10,value:reviewState}};await page.evaluate(()=>localStorage.clear());
    await page.goto(origin+'/course/assessments/?review='+encodeURIComponent(q.id));await page.locator('input[name="review-answer"]').first().waitFor();
    await page.locator('input[name="review-answer"][value="'+alternate.answer+'"]').check();await page.getByRole('button',{name:'Check review answer',exact:true}).click();await page.waitForFunction(({cache,qid})=>{const r=JSON.parse(localStorage.getItem(cache)||'null');return r&&!r.dirty&&r.value.reviews[qid]?.history.length===1;},{cache,qid:q.id});
    check(await page.locator('.review-result').isVisible(),'Delayed-review feedback remains visible after local notification and server acknowledgement');
    check((await page.locator('.review-result').textContent()).includes(alternate.explanation||alternate.explanations[alternate.answer]),'The actual correct-answer explanation is still readable after saving');
    check(records[key].value.reviews[q.id].history.length===1&&records[key].value.reviews[q.id].stage===1,'Review acknowledgement records one success without repeated scheduling');

    const f=data.forms.find(form=>form.id==='D'),now=Date.now(),answers=f.questions.map(question=>question.answer);answers[0]=(answers[0]+1)%4;
    const resultState=blank();resultState.seen=['D'];resultState.attempts=[{id:'qa-submitted-result',form:'D',startedAt:now-60000,deadline:null,submittedAt:now-1000,expired:false,fresh:true,answers,flags:answers.map(()=>false),uncertain:answers.map(()=>false),reviewed:answers.map(()=>false),current:0}];
    records={[key]:{revision:20,value:resultState}};await page.evaluate(()=>localStorage.clear());
    await page.goto(origin+'/course/assessments/?attempt=qa-submitted-result');const detail=page.locator('.result-question').first();await detail.locator(':scope > summary').click();await detail.locator('input[type="checkbox"]').check();await page.waitForFunction(cache=>{const r=JSON.parse(localStorage.getItem(cache)||'null');return r&&!r.dirty&&r.value.attempts[0]?.reviewed[0]===true;},cache);
    check(await detail.evaluate(e=>e.open),'Result explanation disclosure remains open after its acknowledgement is saved');
    check(await detail.locator('input[type="checkbox"]').isChecked(),'Acknowledgement remains visibly selected after the local echo');
    check(records[key].value.attempts[0].reviewed[0]===true,'Actual result acknowledgement reaches the mocked account');

    userId='qa-account-b';const newCache='amg-user:'+userId+':'+key;records={};
    await page.goto(origin+'/course/assessments/');await page.getByRole('button',{name:'Start diagnostic',exact:true}).waitFor();await page.waitForFunction(k=>{const r=JSON.parse(localStorage.getItem(k)||'null');return r&&!r.dirty;},newCache);
    const isolation=await page.evaluate(({oldKey,newKey})=>({old:JSON.parse(localStorage.getItem(oldKey)||'null'),fresh:JSON.parse(localStorage.getItem(newKey)||'null')}),{oldKey:cache,newKey:newCache});
    check(isolation.old.value.attempts[0].id==='qa-submitted-result'&&isolation.fresh.value.attempts.length===0,'A different authenticated account on the same browser gets no prior user attempts');
    const finalHashes=await hashAssets();check(JSON.stringify(finalHashes)===JSON.stringify(hashes),'Actual account bundle and assessment scripts stayed unchanged throughout the browser check');
    check(errors.length===0,'No uncaught browser runtime errors');
    return {reviewedAt:new Date().toISOString(),status:'passed',checks,errors,hashes,mockedProgressPosts:requests.filter(r=>r.key).length,acceptedMockWrites:revision,scope:'Actual built account SDK bundle and assessment runtime; intercepted dummy authenticated API responses, forced delayed cross-tab storage events, real review/result controls, same-browser account cache isolation. No real login/token validation, network delivery, reporting service, or physical other-device test.'};
  } finally {for(const peer of peers)if(!peer.isClosed())await peer.close();await context.unroute('**/api/learning',mock);}
}
