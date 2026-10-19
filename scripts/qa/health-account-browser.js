async page => {
  // Isolated browser fixture: every account request is intercepted and no real learner or Blob record is touched.
  const origin='http://127.0.0.1:4203',key='amg-health-assessments-v1',uid='qa-health-account',cache='amg-user:'+uid+':'+key;
  const checks=[],errors=[],requests=[],copy=value=>JSON.parse(JSON.stringify(value));
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  let records={},abortNext=false;
  const context=page.context();
  const learning=async route=>{
    const request=route.request();
    if(request.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:uid,name:'Health QA',email:'qa@example.invalid'},records,reporting:{status:'synced'}})});
    const body=request.postDataJSON();requests.push(copy(body));
    if(body.action==='sync-report')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reporting:{status:'synced'}})});
    if(abortNext){abortNext=false;return route.abort('failed');}
    const current=records[body.key];
    if(body.revision!==(current?.revision||0))return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'conflict',record:current})});
    const record={revision:(current?.revision||0)+1,value:copy(body.value)};records[body.key]=record;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({record,reporting:{status:'synced'}})});
  };
  await context.route('**/api/learning',learning);
  await context.route('**/api/access',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({stage:'ready',user:{id:uid,name:'Health QA',email:'qa@example.invalid'}})}));
  page.on('pageerror',error=>errors.push(error.message));
  const saved=()=>page.waitForFunction(cacheKey=>{const record=JSON.parse(localStorage.getItem(cacheKey)||'null');return record&&!record.dirty;},cache);
  try {
    const answers=Array(90).fill(null);
    records[key]={revision:1,value:{version:1,attempts:[
      {id:'health-result-a',rotation:17,startedAt:1000,submittedAt:2000,earlyFail:false,answers:[...answers],current:0},
      {id:'health-open-b',rotation:34,startedAt:3000,submittedAt:null,earlyFail:false,answers:[...answers],current:12},
    ]}};
    await page.goto(origin+'/course/health/');await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite());
    await page.getByRole('button',{name:'Review latest result',exact:true}).click();
    await page.evaluate(()=>{const target=[...document.querySelectorAll('button')].find(item=>item.textContent==='Resume open attempt');target.click();target.click();});
    check((await page.locator('.exam-bar small').textContent()).includes('Question 13 of 90'),'Review result A then rapid-repeat Start resumes open B without appending another attempt');
    const resumed=await page.evaluate(cacheKey=>JSON.parse(localStorage.getItem(cacheKey)||'null'),cache);
    check(resumed.value.attempts.length===2&&resumed.value.attempts[1].id==='health-open-b','Rapid repeat clicks keep exactly one open Health attempt in the reloadable cache');
    await page.evaluate(()=>localStorage.clear());records={};requests.length=0;
    await page.goto(origin+'/course/health/');await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite());
    await page.getByRole('button',{name:'Start Practice Test',exact:true}).click();await page.locator('.answer-choice').first().waitFor();await saved();
    const firstCorrect=await page.evaluate(()=>window.AMG_HEALTH_QUESTIONS[17].answer.charCodeAt(0)-65), firstWrong=(firstCorrect+1)%4;
    await page.locator('.answer-choice').nth(firstWrong).click();await saved();
    const firstScore=await page.locator('.exam-score').textContent();
    check((await page.locator('.feedback').textContent()).includes('Your first response is locked'),'First Health response immediately reveals feedback and locks scoring');
    check(await page.locator('.answer-choice').nth(firstWrong).isDisabled()&&firstScore.includes('0 correct'),'Wrong first response is disabled and scores zero');
    await page.getByRole('button',{name:'Return to Health home',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Resume Practice Test',exact:true}).click();
    check((await page.locator('.feedback').textContent()).includes('Your first response is locked')&&(await page.locator('.exam-score').textContent())===firstScore,'Reload resumes the same locked answer and stable score');
    await page.getByRole('button',{name:'Next',exact:true}).click();abortNext=true;await page.locator('.answer-choice').first().click();
    await page.waitForFunction(cacheKey=>JSON.parse(localStorage.getItem(cacheKey)||'null')?.dirty===true,cache);
    await page.waitForFunction(()=>document.getElementById('account-sync-status').textContent.includes('pending'));
    check((await page.locator('#account-sync-status').textContent()).includes('pending'),'Offline Health save is labeled pending, never saved');
    await page.evaluate(()=>window.dispatchEvent(new Event('online')));await saved();
    check(records[key].value.attempts[0].answers[1]!==null,'Online retry commits the durable pending Health answer');
    records[key]={revision:records[key].revision+1,value:copy(records[key].value)};
    await page.getByRole('button',{name:'Next',exact:true}).click();await page.locator('#account-access-guard').waitFor();
    const local=await page.evaluate(cacheKey=>JSON.parse(localStorage.getItem(cacheKey)||'null'),cache);
    check(local.conflict===true&&local.value.attempts[0].current===2&&records[key].value.attempts[0].current===1,'Revision conflict retains pending local navigation and preserves newer cloud state');
    check(errors.length===0,'No uncaught browser runtime errors');
    return {status:'passed',checks,errors,mockedProgressPosts:requests.filter(request=>request.key===key).length,scope:'Built Health and account bundles with intercepted synthetic access/learning APIs. No real credentials, learner records, reporting, or production writes.'};
  } finally {await context.unroute('**/api/learning',learning);}
}
