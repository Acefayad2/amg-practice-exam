async page => {
  // Isolated localhost browser only. The shared code and learner below are dummy
  // fixtures; access/learning endpoints are intercepted, never real sessions.
  const origin='http://127.0.0.1:4201',dummyCode='QA-only-shared-code',uid='a'.repeat(64);
  const checks=[],errors=[],identityRequests=[],posts=[],copy=x=>JSON.parse(JSON.stringify(x));
  let stage='code',profile=null,initialFailure=false,invalidReady=false,rateLimited=false;
  const context=page.context(),check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
  const reply=(route,status,value)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  const access=async route=>{
    const req=route.request();
    if(rateLimited)return route.fulfill({status:429,contentType:'text/html',body:'<h1>Too many requests</h1>'});
    if(req.method()==='GET'){
      if(initialFailure)return reply(route,503,{error:'access_service_unavailable'});
      if(invalidReady)return reply(route,200,{stage:'ready',user:{}});
      return reply(route,200,{stage,...(stage==='ready'?{user:{id:uid,...profile}}:{})});
    }
    const body=req.postDataJSON();posts.push(copy(body));
    if(body.action==='code'){
      if(body.code!==dummyCode)return reply(route,401,{error:'code_invalid'});
      stage='profile';profile=null;return reply(route,200,{stage});
    }
    if(body.action==='start'){
      if(stage!=='profile')return reply(route,403,{error:'gate_required'});
      profile={name:body.name,email:body.email};stage='ready';return reply(route,200,{stage,user:{id:uid,...profile}});
    }
    if(body.action==='logout'){stage='code';profile=null;return reply(route,200,{stage});}
    return reply(route,400,{error:'invalid_request'});
  };
  const learning=async route=>{
    if(stage!=='ready')return reply(route,401,{error:'authentication_required'});
    if(route.request().method()!=='GET')throw Error('Entry-only QA unexpectedly tried to save learner progress');
    return reply(route,200,{user:{id:uid,...profile},records:{},reporting:{status:'not_configured'}});
  };
  const identity=route=>{identityRequests.push(route.request().url());return reply(route,410,{error:'Identity is not part of this flow'});};
  await context.route('**/api/access',access);await context.route('**/api/learning',learning);await context.route('**/.netlify/identity/**',identity);
  page.on('pageerror',e=>errors.push(e.message));
  const assets=()=>page.evaluate(async()=>{const out={};for(const file of ['/course/shared/login.js','/course/shared/account.js','/login/index.html']){const data=await(await fetch(file,{cache:'no-store'})).arrayBuffer();out[file]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('');}return out;});
  try {
    await page.goto(origin+'/login/?next='+encodeURIComponent('/course/?from=qa#lessons'));await page.locator('#code-form').waitFor({state:'visible'});
    await page.evaluate(()=>localStorage.clear());const hashes=await assets();
    check(await page.locator('#access-code').getAttribute('type')==='password','Entry begins with a masked shared-code field');
    check(await page.locator('#profile-form').isHidden(),'Name/email step stays closed before code acceptance');
    await page.locator('#access-code').fill('wrong-qa-code');await page.locator('#code-submit').click();await page.locator('#auth-error').waitFor({state:'visible'});
    check((await page.locator('#auth-error').textContent()).includes('doesn’t match'),'Rejected code shows a useful error on the code step');
    check(await page.locator('#code-form').isVisible()&&await page.locator('#profile-form').isHidden(),'Invalid code does not advance to the tracking profile');
    rateLimited=true;await page.locator('#access-code').fill(dummyCode);await page.locator('#code-submit').click();
    await page.waitForFunction(()=>document.getElementById('auth-error').textContent.includes('Too many attempts'));
    check((await page.locator('#auth-error').textContent()).includes('Wait a moment'),'A non-JSON platform429 displays the wait-and-retry guidance');
    check(await page.locator('#code-form').isVisible()&&await page.locator('#profile-form').isHidden(),'Rate limiting does not advance or corrupt the code entry stage');
    rateLimited=false;
    await page.locator('#access-code').fill(dummyCode);await page.locator('#toggle-code').click();check(await page.locator('#access-code').getAttribute('type')==='text','Shared-code visibility toggle works');
    await page.locator('#code-submit').click();await page.locator('#profile-form').waitFor({state:'visible'});
    check(await page.locator('#access-code').inputValue()===''&&await page.locator('#access-code').getAttribute('type')==='password','Accepted code is cleared and masked again');
    check(await page.locator('#learner-name').evaluate(e=>e===document.activeElement),'Accepted code moves keyboard focus to the name field');
    await page.locator('#learner-name').fill('  Jamie   Rivera  ');await page.locator('#learner-email').fill('Jamie.Rivera@Example.Invalid');stage='code';
    await page.locator('#profile-submit').click();await page.locator('#code-form').waitFor({state:'visible'});
    check((await page.locator('#auth-error').textContent()).includes('expired'),'Expired gate returns to the code step with an explanation');
    check(stage==='code'&&page.url().includes('/login/'),'Expired gate cannot enter the course');
    await page.locator('#access-code').fill(dummyCode);await page.locator('#code-submit').click();await page.locator('#profile-form').waitFor({state:'visible'});
    await page.locator('#learner-name').fill('  Jamie   Rivera  ');await page.locator('#learner-email').fill('Jamie.Rivera@Example.Invalid');
    await page.locator('#profile-submit').click();await page.waitForURL(origin+'/course/?from=qa#lessons');await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite());
    const entered=posts.filter(body=>body.action==='start').at(-1);
    check(entered.name==='Jamie Rivera'&&entered.email==='jamie.rivera@example.invalid','Profile submission normalizes spacing and email without adding an individual password');
    check(Object.keys(entered).sort().join(',')==='action,email,name','Profile request sends exactly the server entry contract');
    check(await page.evaluate(id=>window.AMG_ACCOUNT.user.id===id,uid),'Entered course binds to the returned server learner ID');
    check(page.url()===origin+'/course/?from=qa#lessons','Safe same-origin destination, query and fragment survive entry');

    await page.goto(origin+'/login/?next='+encodeURIComponent('https://example.invalid/escape'));await page.waitForURL(origin+'/course/');await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite());
    check(page.url()===origin+'/course/','Existing ready session cannot follow an external return destination');
    stage='profile';profile=null;await page.goto(origin+'/login/');await page.locator('#profile-form').waitFor({state:'visible'});
    check(await page.locator('#code-form').isHidden(),'A still-valid gate can resume the profile step on reload');
    await page.locator('#change-code').click();await page.locator('#code-form').waitFor({state:'visible'});
    check(posts.at(-1).action==='logout'&&stage==='code','Use another code clears the mocked gate/session before returning to code entry');

    initialFailure=true;await page.reload();await page.locator('#auth-retry').waitFor({state:'visible'});
    check(await page.locator('#code-form').isHidden()&&await page.locator('#profile-form').isHidden(),'Unavailable startup service does not show an unverified entry stage');
    initialFailure=false;await page.locator('#auth-retry').click();await page.locator('#code-form').waitFor({state:'visible'});
    check(await page.locator('#auth-retry').isHidden(),'Retry restores entry after the mocked startup service recovers');
    invalidReady=true;await page.reload();await page.locator('#auth-retry').waitFor({state:'visible'});
    check(page.url().startsWith(origin+'/login/'),'Malformed ready response cannot navigate without a server learner ID');
    invalidReady=false;
    const finalHashes=await assets();check(JSON.stringify(finalHashes)===JSON.stringify(hashes),'Entry HTML and both built client bundles remained unchanged during the check');
    check(identityRequests.length===0,'No Identity SDK endpoint was contacted');check(errors.length===0,'No uncaught browser errors');
    return{reviewedAt:new Date().toISOString(),status:'passed',checks,errors,hashes,identityRequestCount:identityRequests.length,scope:'Actual built shared-code login and course client with intercepted dummy access/learning services. Tests code/profile UI, expired gate recovery, ready-session routing, startup failure/retry and no Identity requests. It does not claim real code validation, cryptographic cookies, Google reporting or hosted edge acceptance.'};
  } finally {await context.unroute('**/api/access',access);await context.unroute('**/api/learning',learning);await context.unroute('**/.netlify/identity/**',identity);}
}
