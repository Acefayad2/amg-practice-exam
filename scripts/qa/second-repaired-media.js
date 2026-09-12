async page => {
  const base=page.url().match(/^https?:\/\/[^/]+/)[0];
  if(!['http://127.0.0.1:4186','https://amg-exam-portal.netlify.app'].includes(base))throw Error('Use an isolated QA browser on the course host');
  const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setExtraHTTPHeaders({'Cache-Control':'no-cache'});
  const samples={2:[132,135.5],8:[114.1,115],9:[196,197],19:[153.5,155],20:[25.3,26.2],22:[181.7,183],26:[205.6,207],37:[90.9,92],44:[205,235],59:[225,229,233,236],60:[158,160]};
  const selection=page.url().match(/[?&]parts=([^&]+)/)?.[1];
  const selected=selection?selection.split(',').map(Number):Object.keys(samples).map(Number);
  for(const n of selected){
    if(!samples[n])throw Error('Unknown repair sample');
    const id=String(n).padStart(2,'0');let checks=0;
    const check=(ok,label)=>{if(!ok)throw Error('Part '+n+': '+label);checks++;};
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/course/lesson-'+id+'/?review=20260913',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.AMG_LESSON&&document.querySelector('video')?.readyState>=1&&document.querySelector('track')?.track.cues?.length>0,null,{timeout:60000});
    const state=await page.evaluate(()=>{const v=document.querySelector('video'),d=window.AMG_LESSON;return{number:d.number,video:d.video,currentSrc:v.currentSrc,duration:v.duration,expectedDuration:d.duration,questionCount:d.questions.length,cues:Array.from(document.querySelector('track').track.cues).map(c=>({start:c.startTime,end:c.endTime,text:c.text}))};});
    check(state.number===n,'correct lesson');check(state.currentSrc===state.video,'current export loaded');
    check(state.duration>=180&&state.duration<=300,'3–5 minute media');check(Math.abs(state.duration-state.expectedDuration)<1,'manifest duration');
    check(state.cues.every(c=>c.end>c.start&&c.end<=state.duration+.03),'all caption bounds');
    check(state.cues.every((c,i)=>!i||c.start>=state.cues[i-1].end),'caption order');
    check(state.cues.every(c=>c.end-c.start>=.999),'no flashing sub-second cues');
    check(await page.locator('#video-error').isHidden(),'media loads without fallback');
    for(const time of samples[n]){
      const cue=state.cues.find(c=>c.start<=time&&c.end>time);
      if(!cue)continue;
      await page.locator('video').evaluate((v,t)=>{v.currentTime=t},time);
      await page.waitForFunction(expected=>document.querySelector('#inline-caption-text').textContent.replace(/\s+/g,' ').trim()===expected,cue.text.replace(/\s+/g,' ').trim(),{timeout:10000});
      check(await page.locator('#inline-caption-text').isVisible(),'repaired cue visible at '+time);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile fit at '+time);
    }
    await page.locator('video').evaluate(async v=>{v.muted=true;v.currentTime=v.duration-.35;await v.play();});
    await page.locator('dialog[open]').waitFor({timeout:30000});
    check(await page.locator('#check-heading').textContent()==='Question 1 of '+state.questionCount,'native end opens required questions');
    check(await page.locator('#complete').isDisabled(),'watching alone does not finish the lesson');
    await page.keyboard.press('Escape');
    results.push({number:n,video:state.video,duration:state.duration,cues:state.cues.length,checks});
  }
  if(errors.length)throw Error(errors.join('; '));
  return{origin:base,lessons:results.length,checks:results.reduce((s,x)=>s+x.checks,0),results,errors};
}
