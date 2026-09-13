import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Shared-code replacement of the earlier unexecuted account-login harness.
// Intentionally no tracing, screenshots, console forwarding, request bodies, cookies,
// storageState files, or CLI-embedded passwords. Only synthetic accounts may be used.
delete process.env.DEBUG;
delete process.env.PWDEBUG;
const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const credentialPath=option('--credentials')||'/tmp/amg-learner-live-qa.json';
const outputPath=option('--output')||'output/qa/learner-live-entry.json';
const modulePath=option('--playwright-module');
const checks=[],runtimeErrors=[],contexts=[],reportingStatuses=new Set();
let stage='configuration',browser=null,origin=null,progressPosts=0,finishedState=null,finishedRevision=null;
const check=(condition,label)=>{assert.ok(condition,label);checks.push(label);};
const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const safeFailure=error=>({stage,errorClass:typeof error?.name==='string'?error.name:'Error'});
const save=result=>{fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n',{mode:0o600});};
async function main(){
 let config;
 try {
  const info=fs.lstatSync(credentialPath);
  assert.ok(info.isFile()&&!info.isSymbolicLink()&&(info.mode&0o777)===0o600,'Credential file must be a regular0600 file.');
  config=JSON.parse(fs.readFileSync(credentialPath,'utf8'));
  assert.equal(config.reportingDisabled,true,'Root must explicitly disable reporting before this test.');
  const target=new URL(config.previewUrl);
  assert.ok(target.protocol==='https:'&&target.hostname.endsWith('--amg-exam-portal.netlify.app')&&!target.username&&!target.password,'Only the supplied AMG Netlify preview is allowed.');
  origin=target.origin;
  for(const label of ['A','B']){const a=config.learners?.[label];assert.ok(a&&typeof a.name==='string'&&a.name.trim()&&typeof a.email==='string'&&a.email.includes('@'),'Both synthetic learner profiles are required.');}
  assert.ok(typeof config.sharedCode==='string'&&config.sharedCode.length>=3,'The approved shared code is required.');assert.notEqual(config.learners.A.email,config.learners.B.email);
  assert.ok(modulePath&&path.isAbsolute(modulePath),'An installed Playwright module path is required.');
  const fixtureText=fs.readFileSync('public/course/lesson-01/lesson-data.js','utf8');
  const fixture=JSON.parse(fixtureText.replace(/^window\.LESSON01\s*=\s*/,'').replace(/;\s*$/,''));
  assert.equal(fixture.questions.length,8);assert.ok(fixture.questions.every(q=>Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length));
  const key='amg-life-lesson-01-v'+fixture.version;
  stage='browser-launch';
  const {chromium}=await import(pathToFileURL(modulePath).href);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const createPage=async()=>{
   const context=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(context);
   // Transcript study needs no remote video bodies. Auth and learning APIs are real.
   await context.route('**/*',route=>route.request().resourceType()==='media'?route.abort():route.continue());
   const page=await context.newPage();page.setDefaultTimeout(30000);
   page.on('pageerror',()=>runtimeErrors.push({stage}));
   page.on('request',request=>{if(request.method()==='POST'&&request.url()===origin+'/api/learning')progressPosts++;});
   return page;
  };
  const accountRecord=async(page,expected)=>{
   const response=await page.request.get(origin+'/api/learning',{failOnStatusCode:false});
   check(response.status()===200,stage+': verified learning API allows the authenticated account');
   const body=await response.json();
   check(typeof body.user?.id==='string'&&(!expected.id||body.user.id===expected.id)&&body.user?.email?.toLowerCase()===expected.email.toLowerCase(),stage+': server identity matches the intended synthetic account');
   reportingStatuses.add(body.reporting?.status||'missing');
   check(body.reporting?.status==='not_configured',stage+': coordinator reporting remains disabled');
   return body;
  };
  const login=async(page,learner,next='/course/')=>{
   await page.goto(origin+'/login/?next='+encodeURIComponent(next),{waitUntil:'domcontentloaded'});
   await page.locator('#code-form').waitFor({state:'visible'});
   assert.equal(await page.locator('#access-code').getAttribute('type'),'password');
   await page.locator('#access-code').fill(config.sharedCode);
   await page.locator('#code-submit').click();
   await page.locator('#profile-form').waitFor({state:'visible'});
   check(await page.locator('#access-code').inputValue()==='',stage+': shared code clears after the accepted code step');
   await page.locator('#learner-name').fill(learner.name);
   await page.locator('#learner-email').fill(learner.email);
   await page.locator('#profile-submit').click();
   await page.waitForURL(url=>url.origin===origin&&url.pathname===next,{timeout:60000});
   await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite(),{},{timeout:60000});
   check(true,stage+': shared code and learner profile succeed through the real entry forms');
  };
  const signOut=async page=>{
   await page.getByRole('button',{name:'Leave course',exact:true}).click();
   await page.waitForURL(url=>url.origin===origin&&url.pathname==='/login/',{timeout:30000});
   await page.locator('#code-form').waitFor({state:'visible'});
   check(await page.locator('#access-code').inputValue()==='',stage+': signout returns to an empty masked shared-code field');
   const response=await page.request.get(origin+'/api/learning',{failOnStatusCode:false});
   check(response.status()===401,stage+': signed-out learning API rejects the cleared session');
  };
  const page=await createPage();
  stage='anonymous-access';
  await page.goto(origin+'/course/lesson-01/',{waitUntil:'domcontentloaded'});
  await page.waitForURL(url=>url.origin===origin&&url.pathname==='/login/');
  check(true,'Anonymous direct lesson access is redirected to login');
  stage='account-A-login';await login(page,config.learners.A);
  const first=await accountRecord(page,config.learners.A);config.learners.A.id=first.user.id;
  check(!first.records?.[key],'Synthetic account A starts without existing Lesson1 progress');
  stage='account-A-lesson';
  await page.goto(origin+'/course/lesson-01/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.AMG_ACCOUNT?.canWrite());
  check(await page.locator('#open-check').isDisabled()&&await page.locator('#complete').isDisabled(),'Account A cannot finish or open questions before studying');
  await page.locator('#transcript-disclosure > summary').click();
  check((await page.locator('#transcript').textContent()).trim().length>0,'The actual Lesson1 transcript is available');
  await page.locator('#transcript-ready').click();await page.locator('#lesson-check').waitFor({state:'visible'});
  for(let i=0;i<fixture.questions.length;i++){
   stage='account-A-required-question-'+(i+1);
   await page.locator('input[name="lesson-answer"][value="'+fixture.questions[i].answer+'"]').check();
   await page.getByRole('button',{name:'Check answer',exact:true}).click();
   await page.locator('#check-feedback').waitFor({state:'visible'});
   if(i<fixture.questions.length-1)await page.getByRole('button',{name:'Next question',exact:true}).click();
   else await page.getByRole('button',{name:'Finish Part 1',exact:true}).click();
  }
  stage='account-A-save';
  await page.waitForFunction(({id,key})=>{const r=JSON.parse(localStorage.getItem('amg-user:'+encodeURIComponent(id)+':'+key)||'null');return r&&!r.dirty&&r.value.complete;},{id:config.learners.A.id,key},{timeout:60000});
  const saved=await accountRecord(page,config.learners.A),record=saved.records?.[key];
  check(record?.value?.complete===true&&record.value.transcriptRead===true,'Explicit lesson completion and transcript study reach the real account store');
  check(record.value.answers.every((answer,i)=>answer===fixture.questions[i].answer)&&record.value.answers.length===8,'All eight required original answer indices reach the server unchanged');
  check(record.value.firstAnswers.every((answer,i)=>answer===fixture.questions[i].answer)&&record.value.attempts.every(n=>n===1)&&record.value.firstAnswerAt.every(at=>Number.isFinite(Date.parse(at))),'Original first answers, attempt counts and first-answer dates are retained');
  check(typeof record.value.practiceAttemptId==='string'&&record.value.practiceAttemptId&&Number.isFinite(Date.parse(record.value.completedAt)),'The saved lesson has a stable attempt identity and completion time');
  finishedState=record.value;finishedRevision=record.revision;
  stage='account-A-signout';await signOut(page);
  stage='account-B-login';await login(page,config.learners.B);
  const other=await accountRecord(page,config.learners.B);config.learners.B.id=other.user.id;check(config.learners.A.id!==config.learners.B.id,'Different learner emails have different server identities');
  check(Object.keys(other.records||{}).length===0,'Account B inherits none of account A’s server progress');
  check((await page.locator('#course-progress').textContent()).startsWith('0 of 60'),'Account B sees zero completed lessons in the same browser');
  check(await page.evaluate(key=>window.AMG_ACCOUNT.storage.getItem(key)===null,key),'The account B cache exposes no account A Lesson1 record');
  stage='account-B-signout';await signOut(page);
  await page.context().close();
  const restoredPage=await createPage();
  stage='fresh-context-A-login';
  await restoredPage.goto(origin+'/login/',{waitUntil:'domcontentloaded'});
  check(await restoredPage.evaluate(({id,key})=>localStorage.getItem('amg-user:'+encodeURIComponent(id)+':'+key)===null,{id:config.learners.A.id,key}),'The restoration context begins without account A’s local progress cache');
  await login(restoredPage,config.learners.A,'/course/lesson-01/');
  await restoredPage.waitForFunction(()=>document.querySelector('#completion-status').textContent.includes('complete'));
  const restored=await accountRecord(restoredPage,config.learners.A);
  assert.deepEqual(restored.records[key].value,finishedState);checks.push('Fresh-context account A restores the exact server lesson record');
  const local=await restoredPage.evaluate(key=>JSON.parse(window.AMG_ACCOUNT.storage.getItem(key)),key);
  assert.deepEqual(local,finishedState);checks.push('Fresh-context UI cache restores exact answers, attempt identity and completion metadata');
  check(await restoredPage.locator('#next-lesson').isVisible(),'Restored lesson exposes its completed next-lesson action');
  check(restored.records[key].revision===finishedRevision,'Restoring a finished lesson does not create an unnecessary replacement write');
  stage='final-signout';await signOut(restoredPage);
  check(runtimeErrors.length===0,'No uncaught runtime errors during actual login, completion, isolation and restore');
  const result={reviewedAt:new Date().toISOString(),status:'passed',previewOrigin:origin,checks,runtimeErrors,actualRequiredQuestions:8,progressPostRequests:progressPosts,reportingStatuses:[...reportingStatuses],lessonDataSha256:digest(fixtureText),syntheticAccountTags:{A:digest(config.learners.A.id).slice(0,12),B:digest(config.learners.B.id).slice(0,12)},scope:'Actual shared-code/profile entry, protected routes, server learning API, transcript completion, eight required answers, signout, second-user isolation and fresh-context restoration on the supplied Netlify preview. Reporting was explicitly disabled and each authenticated API observation required not_configured. No real learner emails, Google Sheet validation, screenshots, traces, saved cookies or raw credentials in evidence.'};
  save(result);console.log(JSON.stringify({status:result.status,checks:checks.length,evidence:outputPath}));
 }catch(error){
  const result={reviewedAt:new Date().toISOString(),status:'failed',previewOrigin:origin,checks,runtimeErrors,failure:safeFailure(error),progressPostRequests:progressPosts,reportingStatuses:[...reportingStatuses],scope:'Synthetic actual-entry acceptance; failed safely without logging exception text, credentials, request bodies or cookies.'};
  save(result);console.error(JSON.stringify({status:'failed',stage,errorClass:result.failure.errorClass,evidence:outputPath}));process.exitCode=1;
 }finally{
  for(const context of contexts)try{await context.close();}catch(_){}
  try{await browser?.close();}catch(_){}
  config=null;
 }
}
await main();
