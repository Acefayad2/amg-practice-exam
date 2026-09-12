import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {curriculum} from '../docs/course/full-course/curriculum.mjs';
import {coverageRows} from '../docs/course/coverage-source.mjs';
import {courseHome} from './course-home.mjs';
import {foundationLessons} from '../docs/course/full-course/foundation-mapping.mjs';
import {updateCoverage} from './update-course-coverage.mjs';
const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'..');
const src=path.join(root,'docs/course/full-course');
const write=(file,data)=>{const p=path.join(root,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json=s=>JSON.stringify(s,null,2).replaceAll('<','\\u003c');
const topics=new Map(coverageRows.flatMap(r=>r.topics.map((title,i)=>[r.id+'.'+String(i+1).padStart(2,'0'),title])));
const lessons=[];
for(const file of fs.readdirSync(src).filter(f=>/^lessons-\d+-\d+\.mjs$/.test(f)).sort())lessons.push(...(await import(pathToFileURL(path.join(src,file)))).default);
const ids=new Set(),questionIds=new Set(),stems=new Set();
for(const l of lessons){
 assert(!ids.has(l.id),'Duplicate lesson '+l.id);ids.add(l.id);
 assert(curriculum.some(x=>x.id===l.id),'Unplanned lesson '+l.id);
 assert(l.blocks.length>=4&&l.blocks.length<=8,'Section count '+l.id);
 // Broader Maryland duties lessons need up to twelve website questions.
 assert(l.questions.length>=6&&l.questions.length<=12,'Question count '+l.id);
 for(const item of [...l.blocks,...l.notes,...l.questions])for(const t of item.topics)assert(topics.has(t),'Unknown topic '+t);
 for(const b of l.blocks){assert(b.narration.length>100);assert(b.visual.items.length<=5);}
 for(const q of l.questions){
  assert(!questionIds.has(q.id),'Duplicate question ID '+q.id);questionIds.add(q.id);
  const stem=q.prompt.toLowerCase().replace(/[^a-z0-9]/g,'');assert(!stems.has(stem),'Duplicate stem '+q.id);stems.add(stem);
  assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(x=>x.toLowerCase().trim())).size,4);
  assert.equal(q.explanations.length,4);assert(q.explanations.every(x=>x.trim().length>15));
  assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert(l.blocks[q.review]);
 }
}
const published=[];
const preview=process.env.AMG_COURSE_PREVIEW==='1';
const canPublish=m=>Boolean(m?.video)&&(m.status==='ready'||(preview&&m.status==='review'));
const mediaById=new Map(lessons.map(l=>{
 const file=path.join(src,'media-'+l.id+'.json');
 return [l.id,fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null];
}));
for(const l of lessons){
 const media=mediaById.get(l.id);
 if(!canPublish(media)){
  // Only remove this builder's generated files; Parts 1–2 and other assets are separate.
  for(const file of ['index.html','lesson-data.js','scene-captions.vtt'])fs.rmSync(path.join(root,'public/course/lesson-'+l.id,file),{force:true});
  continue;
 }
 const vtt=path.join(src,'captions-'+l.id+'.vtt');assert(fs.existsSync(vtt),'Missing captions '+l.id);
 const duration=Number(media.duration);assert(duration>=180&&duration<=300,'Video outside 3–5 minute target '+l.id);
 const data={...l,video:media.video,poster:media.poster,duration,transcript:l.blocks.map(b=>b.narration).join('\n\n')};
 write('public/course/lesson-'+l.id+'/lesson-data.js','window.AMG_LESSON = '+json(data)+';\n');
 write('public/course/lesson-'+l.id+'/scene-captions.vtt',fs.readFileSync(vtt,'utf8'));
 const t=Math.round(duration),label=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
 const prev='/course/lesson-'+String(l.number-1).padStart(2,'0')+'/';
 const nextId=String(l.number+1).padStart(2,'0');
 const next=canPublish(mediaById.get(nextId))?'/course/lesson-'+nextId+'/':'/course/';
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${esc(l.subtitle)}"><title>${esc(l.title)} · Part ${l.number} · AMG Life</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/course/lesson-01/lesson.css"><link rel="stylesheet" href="/course/lesson-02/lesson.css"><link rel="stylesheet" href="/course/shared/lesson.css"><script src="lesson-data.js" defer></script><script src="/course/shared/lesson.js" defer></script></head><body>
<a class="skip" href="#main">Skip to lesson</a><header class="topbar"><a class="brand" href="/course/">AMG <span>LIFE INSURANCE EXAM LAB</span></a><span class="review-label">Maryland Life · Part ${l.number}</span></header>
<div class="layout"><aside class="sidebar" aria-label="Lesson outline"><p class="eyebrow">PART ${l.id}</p><h2>${esc(l.title)}</h2><nav aria-label="On this page"><a href="#scenario">Watch the lesson</a>${l.blocks.map((b,i)=>`<a href="#section-${i}">${String(i+1).padStart(2,'0')} <span>${esc(b.title)}</span></a>`).join('')}<a href="#practice">Lesson questions</a><a href="#finish">Finish & continue</a></nav><div class="progress-box"><label for="lesson-progress">Practice progress</label><progress id="lesson-progress" max="${l.questions.length}" value="0"></progress><p id="progress-label" aria-live="polite">0 of ${l.questions.length} understood</p><p id="save-status">Progress is saved in this browser.</p></div><a class="back" href="${prev}">← Previous part</a></aside>
<main id="main"><div class="hero"><p class="eyebrow">MARYLAND LIFE · ${esc(curriculum.find(c=>c.id===l.id).module.toUpperCase())}</p><h1>${esc(l.title)}</h1><p class="lede">${esc(l.subtitle)}</p><p class="meta">${label} video · ${l.questions.length} required questions · Original scenarios</p></div><div class="objectives"><h2>By the end, you can…</h2><ul>${l.objectives.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div>
<section id="scenario" class="section"><p class="eyebrow">WATCH / FOLLOW THE EXPLANATION</p><h2>See the concepts in action.</h2><figure><video id="scenario-video" controls playsinline preload="metadata" aria-label="${esc(l.title)}"></video><div id="inline-captions" class="inline-captions" hidden><div class="inline-caption-controls"><span>English captions</span><button id="toggle-inline-captions" type="button" aria-pressed="true" aria-controls="inline-caption-text">Hide captions</button></div><p id="inline-caption-text" aria-live="off"></p></div><figcaption>Original teaching scenarios and diagrams · Narrated by Gideon</figcaption></figure><div id="video-error" hidden><p>The video could not load. Retry it, or read the transcript while your connection recovers.</p><button id="retry-video" type="button">Retry video</button></div><p id="watch-status" role="status" class="watch-status"></p><details><summary>Read the full transcript</summary><p id="transcript"></p><p>You can study the complete written lesson as an alternative to watching. The same required questions and completion standard apply.</p><button id="transcript-ready" type="button">I’ve read the lesson — open questions</button></details></section>
${l.blocks.map((b,i)=>`<section id="section-${i}" class="section"><p class="eyebrow">${String(i+1).padStart(2,'0')} / UNDERSTAND THE REASON</p><h2>${esc(b.title)}</h2><p>${esc(b.narration)}</p><div class="concept-grid">${b.visual.items.map(([a,z])=>`<article class="simple-card"><h3>${esc(a)}</h3><p>${esc(z)}</p></article>`).join('')}</div></section>`).join('')}
${l.notes.length?`<section class="section"><p class="eyebrow">APPLY / IMPORTANT DISTINCTIONS</p><h2>Go one step deeper.</h2>${l.notes.map(n=>`<article class="teaching-note"><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p><p><strong>Example:</strong> ${esc(n.example)}</p></article>`).join('')}</section>`:''}
<section id="practice" class="section"><p class="eyebrow">PRACTICE / EXPLAIN YOUR ANSWER</p><h2>Make each distinction stick.</h2><p>The questions open when the video ends, or after you finish the transcript study option. Answer all ${l.questions.length} correctly to finish. If you miss one, read why each option fits or fails, revisit the teaching, and retry. Your first answers are saved separately.</p><button id="open-check" class="primary" type="button" disabled>Open lesson questions</button><noscript>Enable JavaScript to use the video, questions and saved progress.</noscript></section>
<section id="finish" class="section"><p class="eyebrow">FINISH / CONTINUE LEARNING</p><h2>Check your understanding.</h2><div class="result-box"><p id="result" aria-live="polite"></p><button id="complete" class="primary" type="button" disabled>Finish this lesson</button><p id="completion-status" role="status" tabindex="-1"></p><button id="restart" type="button" class="text-button">Start a fresh practice attempt</button></div><div class="review-box"><p id="next-lesson" hidden><a href="${next}">${next==='/course/'?'Return to the course':'Continue to Part '+(l.number+1)} →</a></p><p id="next-locked">Finish the lesson content and required questions to complete this part.</p><p class="fine">Lesson completion records learning progress. It is not a license or a prediction of your exam result.</p></div><details class="sources"><summary>Sources and exam-outline mapping</summary><p>Life-only scope · Prometric outline ${l.outline.map(esc).join(', ')} · Original teaching examples and practice questions.</p><ul>${l.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul><p>Maryland rules and federal requirements are distinguished from general contract concepts. Scenario facts are fictional. Coordinator sign-off is tracked separately in the course review.</p></details></section><footer><a href="${prev}">← Previous part</a> <a href="/course/">Course home →</a><p>AMG · Maryland life-insurance exam preparation</p></footer></main></div>
<dialog id="lesson-check" class="check-dialog" aria-labelledby="check-heading" aria-describedby="check-description"><div class="check-top"><div><p class="eyebrow">PART ${l.number} · LESSON CHECK</p><h2 id="check-heading" tabindex="-1">Lesson questions</h2></div><button id="close-check" type="button" aria-label="Close questions and return to lesson">Close</button></div><p id="check-description">Answer every question correctly. Review the explanation and retry any missed answer.</p><p id="check-progress" class="fine" role="status"></p><div id="check-content" class="question"></div></dialog></body></html>`;
 write('public/course/lesson-'+l.id+'/index.html',html+'\n');
 published.push({id:l.id,number:l.number,version:l.version,title:l.title,subtitle:l.subtitle,duration,questions:l.questions.length,module:curriculum.find(c=>c.id===l.id).module,outline:l.outline,status:media.status});
}
const mappedLessons=[...foundationLessons,...lessons];
const map=[...topics].map(([id,title])=>({id,title,teaching:mappedLessons.flatMap(l=>[...l.blocks,...l.notes].filter(x=>x.topics.includes(id)).map(x=>({lesson:l.id,title:x.title}))),questions:mappedLessons.flatMap(l=>l.questions.filter(q=>q.topics.includes(id)).map(q=>({lesson:l.id,id:q.id}))),coordinatorApproval:null}));
write('docs/course/full-course/coverage-map.json',json(map)+'\n');
write('public/course/shared/catalog.json',json({version:1,planned:curriculum.length,lessons:published})+'\n');
const available=[{...curriculum[0],version:2,duration:256,questions:8,status:'ready'},{...curriculum[1],version:2,duration:199,questions:8,status:'ready'},...published].sort((a,b)=>a.number-b.number);
write('public/course/index.html',courseHome(curriculum,available.map(a=>({...a,answers:mappedLessons.find(l=>l.id===a.id).questions.map(q=>q.answer)}))));
updateCoverage(map,available,mappedLessons.reduce((n,l)=>n+l.questions.length,0));
console.log(JSON.stringify({authoredLessons:lessons.length,originalQuestions:questionIds.size,videoPages:published.length,topicsWithAuthoredTeaching:map.filter(t=>t.teaching.length).length,topicsWithAuthoredQuestions:map.filter(t=>t.questions.length).length,totalTopics:topics.size}));
