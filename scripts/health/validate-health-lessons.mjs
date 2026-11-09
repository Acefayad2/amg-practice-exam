// Validate authored Health lessons against the same contract the Life builder enforces,
// plus narration-length and coverage reporting. Usage: node scripts/health/validate-health-lessons.mjs [file ...]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {curriculum} from '../../docs/course/health/curriculum.mjs';
import {coverageRows} from '../../docs/course/health/coverage-source.mjs';
const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'../..');
const src=path.join(root,'docs/course/health');
const topics=new Map(coverageRows.flatMap(r=>r.topics.map((title,i)=>[r.id+'.'+String(i+1).padStart(2,'0'),title])));
const VISUALS=new Set(['flow','compare','cards','recap','calculation','benefit_timeline']);
const files=process.argv.slice(2).length?process.argv.slice(2).map(f=>path.resolve(f)):fs.readdirSync(src).filter(f=>/^lessons-\d+-\d+\.mjs$/.test(f)).sort().map(f=>path.join(src,f));
const errors=[],warnings=[];
const err=(m)=>errors.push(m),warn=(m)=>warnings.push(m);
const lessons=[];
for(const file of files){
 let mod;try{mod=await import(pathToFileURL(file));}catch(e){err(path.basename(file)+': import failed: '+e.message);continue;}
 if(!Array.isArray(mod.default)){err(path.basename(file)+': default export must be an array');continue;}
 for(const l of mod.default)lessons.push({...l,__file:path.basename(file)});
}
const ids=new Set(),qids=new Set(),stems=new Set();
const words=s=>s.trim().split(/\s+/).length;
let blocks=0,narrationWords=0,questions=0;
for(const l of lessons){
 const tag=`${l.__file} lesson ${l.id}`;
 if(ids.has(l.id))err(tag+': duplicate lesson id');ids.add(l.id);
 const plan=curriculum.find(c=>c.id===l.id);
 if(!plan){err(tag+': not in curriculum');continue;}
 if(plan.number!==l.number)err(tag+': number does not match curriculum');
 if(plan.title!==l.title)warn(tag+`: title differs from curriculum ("${plan.title}")`);
 if(JSON.stringify(plan.outline)!==JSON.stringify(l.outline))warn(tag+`: outline differs from curriculum (${plan.outline.join(', ')})`);
 for(const k of ['version','title','subtitle','outline','objectives','sources','blocks','notes','questions'])if(!(k in l))err(tag+': missing '+k);
 if(!Array.isArray(l.blocks)||l.blocks.length<4||l.blocks.length>8)err(tag+': blocks must be 4–8');
 if(!Array.isArray(l.questions)||l.questions.length<6||l.questions.length>12)err(tag+': questions must be 6–12');
 if(!Array.isArray(l.sources)||!l.sources.length)warn(tag+': no sources');
 if(!Array.isArray(l.objectives)||l.objectives.length<2)warn(tag+': fewer than 2 objectives');
 const lessonTopics=new Set();
 for(const [i,b] of (l.blocks||[]).entries()){
  blocks++;
  if(typeof b.narration!=='string'||b.narration.length<=100)err(tag+` block ${i+1}: narration too short`);
  else{const w=words(b.narration);narrationWords+=w;if(w<80||w>120)warn(tag+` block ${i+1}: ${w} words (target 90–110)`);}
  if(!b.visual||!VISUALS.has(b.visual.type))err(tag+` block ${i+1}: unknown visual type ${b.visual?.type}`);
  else{
   if(!Array.isArray(b.visual.items)||b.visual.items.length<1||b.visual.items.length>5)err(tag+` block ${i+1}: visual needs 1–5 items`);
   else for(const it of b.visual.items)if(!Array.isArray(it)||it.length!==2||it.some(x=>typeof x!=='string'||!x.trim()))err(tag+` block ${i+1}: visual items must be [title,text]`);
   if(b.visual.type==='benefit_timeline'&&b.visual.items?.length!==3)err(tag+` block ${i+1}: benefit_timeline needs exactly 3 items`);
  }
  if(!Array.isArray(b.topics)||!b.topics.length)err(tag+` block ${i+1}: no topics`);
  for(const t of b.topics||[]){if(!topics.has(t))err(tag+` block ${i+1}: unknown topic ${t}`);lessonTopics.add(t);}
  if(!b.title)err(tag+` block ${i+1}: missing title`);
 }
 for(const [i,n] of (l.notes||[]).entries()){
  for(const k of ['title','text','example','topics'])if(!(k in n))err(tag+` note ${i+1}: missing ${k}`);
  for(const t of n.topics||[]){if(!topics.has(t))err(tag+` note ${i+1}: unknown topic ${t}`);lessonTopics.add(t);}
 }
 for(const [i,q] of (l.questions||[]).entries()){
  questions++;
  const expectId='L'+l.id+'-'+String(i+1).padStart(2,'0');
  if(q.id!==expectId)warn(tag+` question ${i+1}: id ${q.id} (expected ${expectId})`);
  if(qids.has(q.id))err(tag+`: duplicate question id ${q.id}`);qids.add(q.id);
  const stem=String(q.prompt||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(stems.has(stem))err(tag+`: duplicate stem ${q.id}`);stems.add(stem);
  if(!Array.isArray(q.options)||q.options.length!==4)err(tag+` ${q.id}: needs 4 options`);
  else if(new Set(q.options.map(x=>x.toLowerCase().trim())).size!==4)err(tag+` ${q.id}: options not distinct`);
  if(!Array.isArray(q.explanations)||q.explanations.length!==4)err(tag+` ${q.id}: needs 4 explanations`);
  else if(!q.explanations.every(x=>typeof x==='string'&&x.trim().length>15))err(tag+` ${q.id}: explanation too short`);
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>3)err(tag+` ${q.id}: bad answer index`);
  if(!Number.isInteger(q.review)||!l.blocks?.[q.review])err(tag+` ${q.id}: review must index a block`);
  if(!Array.isArray(q.topics)||!q.topics.length)err(tag+` ${q.id}: no topics`);
  for(const t of q.topics||[])if(!topics.has(t))err(tag+` ${q.id}: unknown topic ${t}`);
 }
 const outlineTopics=new Set(coverageRows.filter(r=>l.outline?.includes(r.id)).flatMap(r=>r.topics.map((_,i)=>r.id+'.'+String(i+1).padStart(2,'0'))));
 const stray=[...lessonTopics].filter(t=>!outlineTopics.has(t));
 if(stray.length)warn(tag+`: topics outside the lesson's outline subsections: ${stray.join(', ')}`);
}
// Coverage report
const taught=new Set(lessons.flatMap(l=>[...l.blocks,...l.notes].flatMap(x=>x.topics||[])));
const asked=new Set(lessons.flatMap(l=>l.questions.flatMap(q=>q.topics||[])));
const bySection={};
for(const [id] of topics){const s=id.split('.')[0];bySection[s]??={total:0,taught:0,asked:0};bySection[s].total++;if(taught.has(id))bySection[s].taught++;if(asked.has(id))bySection[s].asked++;}
const planned=new Set(lessons.map(l=>l.id));
const expected=new Set(curriculum.filter(c=>lessons.length&&lessons.some(l=>l.outline?.some(o=>c.outline.includes(o)))).map(c=>c.id));
for(const w of warnings)console.log('WARN  '+w);
for(const e of errors)console.log('ERROR '+e);
console.log(JSON.stringify({files:files.length,lessons:lessons.length,blocks,narrationWords,avgWordsPerBlock:blocks?Math.round(narrationWords/blocks):0,questions,topicsTotal:topics.size,topicsTaught:taught.size,topicsAsked:asked.size,bySection,errors:errors.length,warnings:warnings.length}));
// Topics still untaught in the subsections these lessons claim
const claimed=new Set(lessons.flatMap(l=>l.outline||[]));
const missing=[...topics].filter(([id])=>claimed.has(id.split('.').slice(0,2).join('.'))&&!taught.has(id)).map(([id,t])=>id+' '+t);
if(missing.length)console.log('Untaught topics in claimed subsections:\n  '+missing.join('\n  '));
if(errors.length)process.exit(1);
