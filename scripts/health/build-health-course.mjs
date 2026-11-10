// Build the Maryland Accident & Health track under public/course/health/.
// Lessons without a media-NN.json (video not produced yet) publish as a text edition.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {curriculum} from '../../docs/course/health/curriculum.mjs';
import {coverageRows,sources as ledgerSources} from '../../docs/course/health/coverage-source.mjs';
import {courseHome} from '../course-home.mjs';
import {renderLesson,renderAuthoredReferences} from '../lesson-ui.mjs';
import {reviewedAudio} from './reviewed-audio.mjs';
import {HEALTH_TRACK,courseHeader,courseFooter,icon} from '../course-ui.mjs';
const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'../..');
const src=path.join(root,'docs/course/health');
const outBase='public/course/health/';
const track=HEALTH_TRACK;
const write=(file,data)=>{const p=path.join(root,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json=s=>JSON.stringify(s,null,2).replaceAll('<','\\u003c');
const pad=n=>String(n).padStart(2,'0');

const check=spawnSync(process.execPath,[path.join(root,'scripts/health/validate-health-lessons.mjs')],{stdio:['ignore','pipe','inherit']});
if(check.status!==0){process.stdout.write(check.stdout);throw new Error('Health lesson validation failed');}

const topics=new Map(coverageRows.flatMap(r=>r.topics.map((title,i)=>[r.id+'.'+String(i+1).padStart(2,'0'),title])));
const lessons=[];
for(const file of fs.readdirSync(src).filter(f=>/^lessons-\d+-\d+\.mjs$/.test(f)).sort())lessons.push(...(await import(pathToFileURL(path.join(src,file)))).default);
lessons.sort((a,b)=>a.number-b.number);
assert.equal(lessons.length,curriculum.length,'Every planned lesson must be authored');

const preview=process.env.AMG_COURSE_PREVIEW==='1';
const canPublish=m=>Boolean(m?.video)&&(m.status==='ready'||(preview&&m.status==='review'));
const mediaById=new Map(lessons.map(l=>{const file=path.join(src,'media-'+l.id+'.json');return [l.id,fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null];}));
const published=[];
const approvedAudio=reviewedAudio(src);
for(const l of lessons){
 const media=mediaById.get(l.id),ready=canPublish(media);
 const clips=l.blocks.map((block,i)=>{const clip=approvedAudio.get(l.number*100+i);return clip&&{...clip,title:block.title};});
 const narration=!ready&&clips.every(Boolean)?clips:[];
 const duration=ready?Number(media.duration):0;
 if(ready){assert(duration>=180&&duration<=330,'Video outside the 3 to 5.5 minute target '+l.id);const vtt=path.join(src,'captions-'+l.id+'.vtt');assert(fs.existsSync(vtt),'Missing captions '+l.id);write(outBase+'lesson-'+l.id+'/scene-captions.vtt',fs.readFileSync(vtt,'utf8'));}
 else fs.rmSync(path.join(root,outBase+'lesson-'+l.id+'/scene-captions.vtt'),{force:true});
 const data={...l,key:track.keyPrefix+l.id+'-v'+l.version,track:track.id,video:ready?media.video:'',poster:ready?media.poster:'/course/assets/amg-mark.webp',duration,pending:!ready,transcript:l.blocks.map(b=>b.narration).join('\n\n')};
 write(outBase+'lesson-'+l.id+'/lesson-data.js','window.AMG_LESSON = '+json(data)+';\n');
 const previous=l.number===1?track.base:track.base+'lesson-'+pad(l.number-1)+'/';
 const next=l.number===curriculum.length?track.assessments:track.base+'lesson-'+pad(l.number+1)+'/';
 const html=renderLesson({id:l.id,number:l.number,title:l.title,subtitle:l.subtitle,duration,questions:l.questions.length,narrator:media?.narrator?.name||'Zoe',previous,next,track,pending:!ready,narration,
  objectivesHtml:`<h2>By the end, you can…</h2><ul>${l.objectives.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul>`,
  referenceHtml:renderAuthoredReferences(l),
  sourcesHtml:`<p>${esc(track.scope)} · Prometric outline ${l.outline.map(esc).join(', ')} · Original teaching examples and practice questions.</p><ul>${l.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul><p>Maryland rules and federal requirements are distinguished from general contract concepts. Dollar amounts that the law indexes each year are shown as of 2026. Scenario facts are fictional. Coordinator sign-off is tracked separately in the course review.</p><p>Lesson completion records learning progress. It is not a license or a prediction of your exam result.</p>`
 });
 write(outBase+'lesson-'+l.id+'/index.html',html);
 published.push({id:l.id,number:l.number,version:l.version,title:l.title,subtitle:l.subtitle,duration,poster:data.poster,questions:l.questions.length,module:curriculum.find(c=>c.id===l.id).module,outline:l.outline,...(narration.length?{audioSections:narration.length}:{}),status:ready?media.status:'text'});
}
const map=[...topics].map(([id,title])=>({id,title,teaching:lessons.flatMap(l=>[...l.blocks,...l.notes].filter(x=>x.topics.includes(id)).map(x=>({lesson:l.id,title:x.title}))),questions:lessons.flatMap(l=>l.questions.filter(q=>q.topics.includes(id)).map(q=>({lesson:l.id,id:q.id}))),coordinatorApproval:null}));
write('docs/course/health/coverage-map.json',json(map)+'\n');
write(outBase+'catalog.json',json({version:1,track:track.id,planned:curriculum.length,lessons:published})+'\n');
write(outBase+'index.html',courseHome(curriculum,published.map(a=>({...a,answers:lessons.find(l=>l.id===a.id).questions.map(q=>q.answer)})),track));

// Interim practice page: the Health timed forms are still being authored; the public Health practice exam stands in.
write(outBase+'assessments/index.html',`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Practice tests · ${esc(track.label)}</title><meta name="description" content="Practice for the Maryland Accident & Health producer exam."><link rel="icon" href="/course/assets/amg-mark.webp"><link rel="stylesheet" href="/course/shared/app.css"><link rel="stylesheet" href="/course/shared/account.css"><script src="/course/shared/account.js" defer></script><link rel="stylesheet" href="/course/shared/home.css"></head><body class="account-loading" data-track="${track.id}">
<a class="skip" href="#main">Skip to content</a>${courseHeader('assessments',track)}
<main id="main" class="classroom">
<div class="classroom-heading"><div><p class="eyebrow">YOUR PRACTICE SPACE</p><h1>Practice tests</h1></div></div>
<section class="overview" aria-label="Practice options"><div class="continue-card"><div class="continue-content"><p class="eyebrow">AVAILABLE NOW</p><p class="continue-kicker">90 QUESTIONS · ROTATING SET</p><h2>Accident & Health practice exam</h2><a class="primary" href="/practice/health/"><span>Open the practice exam</span>${icon('arrow')}</a><p class="continue-note">Immediate explanations and a full results review. Saved separately from your course progress.</p></div></div>
<a class="practice-shortcut" href="${track.base}"><span class="practice-symbol">${icon('book')}</span><span class="eyebrow">YOUR CLASSROOM</span><h2>Review a topic</h2><p>Did a question give you trouble? Find that topic in the course, work through the example, and try the lesson quiz.</p><span class="shortcut-action">Browse Health lessons ${icon('arrow')}</span></a></section>
<details class="course-info" open><summary>About this practice material</summary><div class="course-info-body"><p>AMG original study material · ${esc(track.program)}. Scores describe these practice items; they are not an official exam result or a guarantee of passing.</p><p>The exam has 80 scored questions plus 10 unscored, 1 hour 45 minutes, weighted: Maryland regulation 30%, General insurance 9%, Health basics 11%, Policy provisions 8%, Disability income 9%, Medical plans 14%, Group health 5%, Dental 1%, Seniors and special needs 9%, Federal tax 5%.</p></div></details>
${courseFooter(track)}</main></body></html>\n`);
console.log(JSON.stringify({track:track.id,authoredLessons:lessons.length,videoPages:published.filter(p=>p.status!=='text').length,textOnlyPages:published.filter(p=>p.status==='text'&&!p.audioSections).length,narratedPages:published.filter(p=>p.audioSections===6).length,originalQuestions:lessons.reduce((n,l)=>n+l.questions.length,0),topicsWithAuthoredTeaching:map.filter(t=>t.teaching.length).length,topicsWithAuthoredQuestions:map.filter(t=>t.questions.length).length,totalTopics:topics.size,sources:ledgerSources.length}));
