import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Node launcher for the Playwright CLI. Never attach this check to a user browser.
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const hash=value=>createHash('sha256').update(value).digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const readData=file=>JSON.parse(fs.readFileSync(file,'utf8').split('=').slice(1).join('=').trim().replace(/;$/,''));
const defaultInput='docs/course/zoe-narration/verified-outputs.json';
const defaultBaseline='docs/course/zoe-narration/input-inventory.json';

export function preparePlayerConfig(baseURL,inputPath=defaultInput,baselinePath=defaultBaseline){
 const target=new URL(baseURL),local=['localhost','127.0.0.1','[::1]'].includes(target.hostname);
 assert((local&&target.protocol==='http:')||target.origin==='https://amg-exam-portal.netlify.app','Only localhost or the AMG production origin is allowed');
 assert(!target.username&&!target.password&&!target.search&&!target.hash&&target.pathname==='/','Use an origin URL without a path, credentials or query');
 const baselineFile=path.resolve(ROOT,baselinePath),baseline=readJSON(baselineFile),input=readJSON(path.resolve(ROOT,inputPath));
 assert.equal(input.baselineSha256,hash(fs.readFileSync(baselineFile)),'Wrong input inventory binding');
 assert.equal(baseline.summary.issues,0,'Baseline has issues');
 assert.equal(input.voice?.voice_id,'d0374db1-44b9-4f05-939e-0a9ae9dbbe6a','Wrong voice');
 for(const file of baseline.sharedProgressBaselines)assert.equal(hash(fs.readFileSync(path.join(ROOT,file.path))),file.sha256,'Protected progress/assessment script changed: '+file.path);
 for(const rows of [baseline.lessons,input.lessons])assert(rows.length===60&&new Set(rows.map(r=>r.number)).size===60&&rows.every(r=>Number.isInteger(r.number)&&r.number>=1&&r.number<=60),'Exactly 60 unique lessons are required');
 const outputs=new Map(input.lessons.map(r=>[r.number,r]));
 const lessons=baseline.lessons.map(base=>{
  const row=outputs.get(base.number),manifest=readJSON(path.join(ROOT,base.media.manifest.path));
  assert.equal(row.status,'verified','Unverified output '+base.number);
  assert.equal(manifest.video,row.output.video,'Apply integration before browser QA: Part '+base.number);
  assert.equal(manifest.narrator?.name,'Zoe','Narrator metadata is not integrated: Part '+base.number);
  const duration=Number(manifest[base.number<=2?'duration_seconds':'duration']);
  assert.equal(duration,row.output.durationSeconds,'Wrong integrated duration '+base.number);
  const captionSha256=row.captions.mode==='reviewed-patch'?row.captions.file.sha256:row.captions.sha256;
  assert.equal(hash(fs.readFileSync(path.join(ROOT,base.baselines.captions.file.path))),captionSha256,'Wrong integrated captions '+base.number);
  const data=readData(path.join(ROOT,base.baselines.publicData.path));
  assert.equal(hash(JSON.stringify(data.questions)),base.baselines.questionsSerializedSha256,'Questions changed '+base.number);
  assert.equal(data.version,base.version,'Progress version changed '+base.number);
  return {number:base.number,id:base.id,version:base.version,storageKey:base.storageKey,video:row.output.video,duration,
   captionSha256,captionMode:row.captions.mode,captionWords:base.baselines.captions.wordCount,captionWordsSha256:base.baselines.captions.captionWordsSha256,
   captionCues:row.captions.mode==='unchanged'?base.baselines.captions.cueCount:null,
   questionsSha256:base.baselines.questionsSerializedSha256,answers:base.baselines.questionIdentity.map(q=>q.answer)};
 });
 return {origin:target.origin,target:local?'local':'live',lessons:lessons.sort((a,b)=>a.number-b.number),baselineSha256:input.baselineSha256,inputSha256:hash(fs.readFileSync(path.resolve(ROOT,inputPath)))};
}

// This function is serialized into run-code; keep its helpers self-contained.
export async function browserReview(page,config){
 const started=Date.now(),results=[],errors=[],pageErrors=[],seedKey='amg-zoe-qa-seed-'+config.lessons[0].id;
 const check=(ok,label)=>{if(!ok)throw Error(label);};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const keys=config.lessons.map(r=>r.storageKey),blankURL=config.origin+'/__amg_zoe_isolated_qa__';
 const oldState={};let oldSeed=null,restored=false;
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.route(blankURL,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated AMG QA</title>'}));
 await page.goto(blankURL,{waitUntil:'domcontentloaded'});
 Object.assign(oldState,await page.evaluate(ks=>Object.fromEntries(ks.map(k=>[k,localStorage.getItem(k)])),keys));
 oldSeed=await page.evaluate(k=>sessionStorage.getItem(k),seedKey);
 await page.addInitScript(({origin,keys,seedKey})=>{
  if(location.origin!==origin)return;
  const text=sessionStorage.getItem(seedKey);if(!text)return;
  sessionStorage.removeItem(seedKey);
  const seed=JSON.parse(text);if(!keys.includes(seed.key))throw Error('QA seed key outside this batch');
  if(seed.state===null)localStorage.removeItem(seed.key);else localStorage.setItem(seed.key,JSON.stringify(seed.state));
 },{origin:config.origin,keys,seedKey});
 const seed=async(key,state)=>page.evaluate(({seedKey,key,state})=>sessionStorage.setItem(seedKey,JSON.stringify({key,state})),{seedKey,key,state});
 const waitPlayer=()=>page.waitForFunction(()=>window.AMG_LESSON&&document.querySelector('#scenario-video')?.readyState>=1&&document.querySelector('track')?.readyState===2,null,{timeout:30000});
 const saved=key=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 try{
  await page.setViewportSize({width:1280,height:900});
  for(const expected of config.lessons){
   const checks=[],verify=(ok,label)=>{check(ok,'Part '+expected.number+': '+label);checks.push(label);};
   try{
    await seed(expected.storageKey,null);
    const response=await page.goto(config.origin+'/course/lesson-'+expected.id+'/',{waitUntil:'domcontentloaded',timeout:30000});
    verify(response?.ok(),'Lesson response successful');await waitPlayer();
    const actual=await page.evaluate(async()=>{
     const d=window.AMG_LESSON,v=document.querySelector('#scenario-video'),t=document.querySelector('track');
     const cues=[...t.track.cues].map(c=>({start:c.startTime,end:c.endTime,text:c.text}));
     const words=cues.map(c=>c.text).join(' ').normalize('NFKC').replace(/[’‘]/g,"'").toLowerCase().match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu)||[];
     const sha=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');
     const response=await fetch(t.src,{cache:'no-store'});if(!response.ok)throw Error('Caption HTTP '+response.status);
     return {id:d.id,number:d.number,version:d.version,source:d.video,currentSrc:v.currentSrc,duration:v.duration,error:v.error?.code||null,
      trackReadyState:t.readyState,cues,captionSha256:await sha(await response.text()),wordCount:words.length,wordHash:await sha(JSON.stringify(words)),
      questionsHash:await sha(JSON.stringify(d.questions)),narrator:document.querySelector('figcaption')?.textContent||''};
    });
    verify(actual.id===expected.id&&actual.number===expected.number&&actual.version===expected.version,'Lesson identity and progress version retained');
    verify(actual.source===expected.video&&actual.currentSrc===expected.video,'Data URL and native currentSrc use the verified Zoe export');
    verify(!actual.error&&Math.abs(actual.duration-expected.duration)<=0.05,'Native duration matches final manifest within 50 ms');
    verify(actual.trackReadyState===2&&actual.cues.length>0,'Caption track fully loaded, readyState 2');
    verify(actual.captionSha256===expected.captionSha256,'Final caption bytes match the accepted file');
    verify(actual.wordCount===expected.captionWords&&actual.wordHash===expected.captionWordsSha256,'Caption word count and sequence match the original inventory');
    verify(expected.captionCues===null||actual.cues.length===expected.captionCues,'Unchanged caption cue count retained');
    verify(actual.cues.every((c,i)=>Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&c.end<=actual.duration+0.02&&(!i||c.start>=actual.cues[i-1].end-0.001)),'Every caption has valid nonoverlapping times inside the final video');
    verify(actual.questionsHash===expected.questionsSha256,'Original questions and answer indices retained');
    verify(actual.narrator.includes('Narrated by Zoe')&&!actual.narrator.includes('Gideon'),'Visible narrator credit is Zoe');
    verify(await page.locator('#open-check').isDisabled()&&await page.locator('#complete').isDisabled(),'Fresh learner must finish content and questions');
    const ended=await page.evaluate(async()=>{
     const video=document.querySelector('#scenario-video');video.muted=true;
     const result=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Native ended timed out')),20000);
      video.addEventListener('ended',event=>{clearTimeout(timer);resolve({trusted:event.isTrusted,ended:video.ended});},{once:true});
     });
     video.currentTime=Math.max(0,video.duration-0.45);await video.play();return result;
    });
    await page.locator('#lesson-check[open]').waitFor({timeout:5000});
    const afterEnd=await saved(expected.storageKey);
    verify(ended.trusted&&ended.ended&&afterEnd.videoEnded,'Real native ended event recorded; no synthetic completion event');
    verify(await page.locator('#check-heading').textContent()==='Question 1 of '+expected.answers.length,'Native end opens the required questions');
    verify(await page.locator('#complete').isDisabled()&&!afterEnd.complete&&afterEnd.answers.every(a=>a===null)&&await page.locator('#next-lesson').isHidden(),'Watching alone cannot complete or unlock the next lesson');
    await page.locator('#close-check').click();
    let priorState=null;
    if([1,2,9,33,48,60].includes(expected.number)){
     const count=expected.answers.length,wrong=(expected.answers[0]+1)%4;
     const state={answers:Array(count).fill(null),firstAnswers:Array(count).fill(null),attempts:Array(count).fill(0),videoEnded:false,transcriptRead:false,complete:false,position:0,completedAt:null};
     if(expected.number===9){priorState='resume-position';state.position=37;}
     else if([33,60].includes(expected.number)){
      priorState='completed';state.videoEnded=true;state.complete=true;state.answers=[...expected.answers];state.firstAnswers=[...expected.answers];state.firstAnswers[0]=wrong;state.attempts.fill(1);state.attempts[0]=2;state.completedAt='2026-09-01T12:00:00.000Z';
     }else{
      priorState=expected.number===2?'partial-transcript':'partial-video';state.transcriptRead=expected.number===2;state.videoEnded=!state.transcriptRead;
      state.answers[0]=expected.answers[0];state.firstAnswers[0]=wrong;state.attempts[0]=2;
      state.answers[1]=(expected.answers[1]+1)%4;state.firstAnswers[1]=state.answers[1];state.attempts[1]=1;
     }
     await seed(expected.storageKey,state);await page.reload({waitUntil:'domcontentloaded'});await waitPlayer();
     if(priorState==='resume-position')await page.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-37)<0.2,null,{timeout:10000});
     // A second unseeded refresh proves persisted state is recognized normally.
     await page.reload({waitUntil:'domcontentloaded'});await waitPlayer();
     const restoredState=await saved(expected.storageKey);
     verify(same(restoredState.answers,state.answers)&&same(restoredState.firstAnswers,state.firstAnswers)&&same(restoredState.attempts,state.attempts),'Prior original option indices, first answers and retry counts survive reload');
     verify(restoredState.complete===state.complete&&restoredState.completedAt===state.completedAt&&restoredState.videoEnded===state.videoEnded&&restoredState.transcriptRead===state.transcriptRead,'Prior completion and study flags survive reload');
     if(priorState==='resume-position'){
      await page.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-37)<0.2,null,{timeout:10000});
      verify(await page.locator('#open-check').isDisabled()&&await page.locator('#complete').isDisabled(),'Prior playback resumes without granting completion');
     }else{
      const expectedCorrect=state.answers.filter((a,i)=>a===expected.answers[i]).length;
      verify((await page.locator('#progress-label').textContent()).startsWith(expectedCorrect+' of '+count),'Prior progress total remains recognized');
      verify(await page.locator('#next-lesson').isVisible()===state.complete,'Prior next-lesson access is retained correctly');
      await page.locator('#open-check').click();
      const index=state.complete?0:1,selected=state.answers[index];
      verify(await page.locator('#check-heading').textContent()==='Question '+(index+1)+' of '+count,'Prior answer review opens the expected question');
      verify(Number(await page.locator('input[name="lesson-answer"]:checked').inputValue())===selected,'Original saved answer index selects the intended displayed option');
      verify(await page.locator('input[name="lesson-answer"]:checked').evaluate((input,index)=>input.parentElement.querySelector('span').textContent.endsWith(window.AMG_LESSON.questions[index].options[Number(input.value)]),index),'Saved option label still matches its original value');
      await page.locator('#close-check').click();
     }
    }
    results.push({number:expected.number,status:'passed',duration:actual.duration,captionCues:actual.cues.length,captionWords:actual.wordCount,captionMode:expected.captionMode,checks,priorState});
   }catch(error){errors.push({number:expected.number,message:error.message});results.push({number:expected.number,status:'failed',checks});}
  }
 }finally{
  try{
   // Navigating first lets the application's final pagehide save finish before restoration.
   await page.goto(blankURL,{waitUntil:'domcontentloaded'});
   restored=await page.evaluate(({oldState,oldSeed,seedKey})=>{
    for(const [key,value]of Object.entries(oldState)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
    if(oldSeed===null)sessionStorage.removeItem(seedKey);else sessionStorage.setItem(seedKey,oldSeed);
    return Object.entries(oldState).every(([key,value])=>localStorage.getItem(key)===value)&&sessionStorage.getItem(seedKey)===oldSeed;
   },{oldState,oldSeed,seedKey});
  }catch(error){errors.push({stage:'storage-restoration',message:error.message});}
 }
 return {status:errors.length||pageErrors.length||!restored?'failed':'passed',origin:config.origin,seconds:(Date.now()-started)/1000,results,errors,pageErrors,isolatedStorageRestored:restored,
  scope:'All listed players: final media identity, loaded captions, native end and completion gate. Six representative prior states. Tail playback only; full audio/visual review is separate.'};
}

function main(){
 const args=process.argv.slice(2),opts={};
 for(let i=0;i<args.length;i++){const key=args[i];assert(['--base-url','--input','--baseline','--report','--help'].includes(key),'Unknown option '+key);assert(!Object.hasOwn(opts,key),'Repeated option '+key);if(key==='--help')opts[key]=true;else{assert(args[i+1]&&!args[i+1].startsWith('--'),'Missing '+key);opts[key]=args[++i];}}
 if(opts['--help']){console.log('After integration only: node scripts/qa/zoe-live-player.js --base-url http://127.0.0.1:4186 --input '+defaultInput+' --report output/playwright/zoe-local.json\nFor production use --base-url https://amg-exam-portal.netlify.app and --report output/playwright/zoe-live.json.\nOpens a new isolated Playwright CLI session; never attaches to a user browser. Does not build or deploy.');return;}
 assert(opts['--base-url'],'--base-url is required');
 const config=preparePlayerConfig(opts['--base-url'],opts['--input']||defaultInput,opts['--baseline']||defaultBaseline);
 const reportPath=path.resolve(ROOT,opts['--report']||`output/playwright/zoe-${config.target}.json`);
 assert(reportPath.startsWith(path.join(ROOT,'output/playwright')+path.sep),'Write the QA report under output/playwright');
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});
 const temp=fs.mkdtempSync(path.join(ROOT,'output/playwright/.zoe-player-'));
 const wrapper=path.join(process.env.HOME,'.codex/skills/playwright/scripts/playwright_cli.sh');
 const session='amg-zoe-player-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 const run=(...args)=>{const result=spawnSync(wrapper,['--session',session,...args],{cwd:ROOT,encoding:'utf8',maxBuffer:12*1024*1024,timeout:240000});assert.equal(result.status,0,'Playwright CLI failed; session '+session+(result.error?': '+result.error.message:''));return result.stdout;};
 const report={schemaVersion:1,status:'running',startedAt:new Date().toISOString(),origin:config.origin,baselineSha256:config.baselineSha256,inputSha256:config.inputSha256,batches:[]};
 const save=()=>fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');save();
 try{
  run('open','about:blank');
  for(let start=0;start<60;start+=10){
   const batch={origin:config.origin,lessons:config.lessons.slice(start,start+10)},file=path.join(temp,'review.js');
   fs.writeFileSync(file,`async page => (${browserReview.toString()})(page, ${JSON.stringify(batch)})`);
   const output=run('run-code','--filename',file),match=output.match(/### Result\s*\n([\s\S]*?)\n### Ran Playwright code/);
   assert(match,'Playwright returned no structured QA result');const result=JSON.parse(match[1]);report.batches.push(result);save();
   console.log(JSON.stringify({parts:[start+1,start+10],status:result.status,seconds:result.seconds,storageRestored:result.isolatedStorageRestored}));
  }
  report.status=report.batches.every(b=>b.status==='passed')?'passed':'failed';
 }catch(error){report.status='failed';report.launcherError=error.message;}
 finally{
  try{run('close');report.isolatedSessionClosed=true;}catch(error){report.isolatedSessionClosed=false;report.status='failed';report.closeError=error.message;}
  report.finishedAt=new Date().toISOString();report.lessons=report.batches.flatMap(b=>b.results).length;save();fs.rmSync(temp,{recursive:true,force:true});
 }
 console.log(JSON.stringify({status:report.status,lessons:report.lessons,report:path.relative(ROOT,reportPath)}));if(report.status!=='passed')process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{main();}catch(error){console.error('Zoe browser QA stopped:',error.message);process.exitCode=1;}
