import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {curriculum} from '../docs/course/full-course/curriculum.mjs';
import {coverageRows} from '../docs/course/coverage-source.mjs';
import {courseHome} from './course-home.mjs';
import {renderLesson,renderAuthoredReferences} from './lesson-ui.mjs';
import {foundationContent} from './foundation-lesson-content.mjs';
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
 const prev='/course/lesson-'+String(l.number-1).padStart(2,'0')+'/';
 const nextId=String(l.number+1).padStart(2,'0');
 const next=l.number===60?'/course/assessments/':canPublish(mediaById.get(nextId))?'/course/lesson-'+nextId+'/':'/course/';
 const html=renderLesson({id:l.id,number:l.number,title:l.title,subtitle:l.subtitle,duration,questions:l.questions.length,narrator:media.narrator?.name||'Gideon',previous:prev,next,
  objectivesHtml:`<h2>By the end, you can…</h2><ul>${l.objectives.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul>`,
  referenceHtml:renderAuthoredReferences(l),
  sourcesHtml:`<p>Life-only scope · Prometric outline ${l.outline.map(esc).join(', ')} · Original teaching examples and practice questions.</p><ul>${l.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul><p>Maryland rules and federal requirements are distinguished from general contract concepts. Scenario facts are fictional. Coordinator sign-off is tracked separately in the course review.</p><p>Lesson completion records learning progress. It is not a license or a prediction of your exam result.</p>`
 });
 write('public/course/lesson-'+l.id+'/index.html',html);
 published.push({id:l.id,number:l.number,version:l.version,title:l.title,subtitle:l.subtitle,duration,poster:media.poster,questions:l.questions.length,module:curriculum.find(c=>c.id===l.id).module,outline:l.outline,status:media.status});
}
const mappedLessons=[...foundationLessons,...lessons];
const map=[...topics].map(([id,title])=>({id,title,teaching:mappedLessons.flatMap(l=>[...l.blocks,...l.notes].filter(x=>x.topics.includes(id)).map(x=>({lesson:l.id,title:x.title}))),questions:mappedLessons.flatMap(l=>l.questions.filter(q=>q.topics.includes(id)).map(q=>({lesson:l.id,id:q.id}))),coordinatorApproval:null}));
write('docs/course/full-course/coverage-map.json',json(map)+'\n');
write('public/course/shared/catalog.json',json({version:1,planned:curriculum.length,lessons:published})+'\n');
const foundationMedia=[1,2].map(n=>JSON.parse(fs.readFileSync(path.join(root,'docs/course/part-'+String(n).padStart(2,'0')+'-manifest.json'),'utf8')));
for(const content of foundationContent){
 const media=foundationMedia[content.number-1];
 write('public/course/lesson-'+content.id+'/index.html',renderLesson({...content,duration:Number(media.duration_seconds),questions:8,narrator:media.narrator?.name||'Zoe',previous:content.number===1?'/course/':'/course/lesson-01/',next:'/course/lesson-'+String(content.number+1).padStart(2,'0')+'/',foundation:true}));
}
const available=[...foundationMedia.map((m,i)=>({...curriculum[i],version:2,duration:Number(m.duration_seconds),poster:m.poster,questions:8,status:'ready'})),...published].sort((a,b)=>a.number-b.number);
write('public/course/index.html',courseHome(curriculum,available.map(a=>({...a,answers:mappedLessons.find(l=>l.id===a.id).questions.map(q=>q.answer)}))));
updateCoverage(map,available,mappedLessons.reduce((n,l)=>n+l.questions.length,0));
console.log(JSON.stringify({authoredLessons:lessons.length,originalQuestions:questionIds.size,videoPages:published.length,topicsWithAuthoredTeaching:map.filter(t=>t.teaching.length).length,topicsWithAuthoredQuestions:map.filter(t=>t.questions.length).length,totalTopics:topics.size}));
