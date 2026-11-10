// Regenerate netlify/functions/_shared/learning-schema.mjs from the published course files.
// The Life entries are carried over unchanged; tracks (Health) are rebuilt from public/course/<track>/.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'..');
const target=path.join(root,'netlify/functions/_shared/learning-schema.mjs');
const {schema:current}=await import(pathToFileURL(target)+'?t='+Date.now());
const sha=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const readCourseData=file=>{const window={};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window});return Object.values(window)[0];};
const tracks={};
for(const [id,prefix,count] of [['health','amg-health-lesson-',60]]){
 const lessons=[];const hashes={};
 for(let n=1;n<=count;n++){
  const lid=String(n).padStart(2,'0'),file=`public/course/${id}/lesson-${lid}/lesson-data.js`;
  if(!fs.existsSync(path.join(root,file)))continue;
  const data=readCourseData(file);
  lessons.push({id:lid,title:data.title,version:data.version,key:data.key||prefix+lid+'-v'+data.version,maxPosition:data.duration?Math.ceil(data.duration)+2:0,questions:data.questions.map(q=>({id:q.id,answer:q.answer,options:q.options.length}))});
  hashes[file]=sha(file);
 }
 const assessmentFile = `public/course/${id}/assessments/assessment-data.js`;
 const assessment = readCourseData(assessmentFile);
 if (assessment.track !== id || assessment.version !== 1) throw new Error('Unexpected assessment track or version: ' + id);
 const forms = assessment.forms.map(({id, title, minutes, questions}) => ({
   id, title, minutes, questions: questions.map(({id, answer, options, scored}) => ({id, answer, options:options.length, scored})),
 }));
 hashes[assessmentFile] = sha(assessmentFile);
 tracks[id] = {id, assessmentKey:`amg-${id}-assessments-v${assessment.version}`, assessmentVersion:assessment.version, lessons, forms, sourceHashes:hashes};
}
const lifeHashes=Object.fromEntries(Object.keys(current.sourceHashes).map(file=>[file,sha(file)]));
const schema={assessmentKey:current.assessmentKey,assessmentVersion:current.assessmentVersion,lessons:current.lessons,forms:current.forms,tracks,sourceHashes:lifeHashes};
fs.writeFileSync(target,'// Answer/shape snapshot from the current public course. Tests require exact source hashes.\nexport const schema = '+JSON.stringify(schema,null,2)+';\n');
console.log(JSON.stringify({lifeLessons:schema.lessons.length,lifeForms:schema.forms.length,tracks:Object.fromEntries(Object.entries(tracks).map(([k,t])=>[k,{lessons:t.lessons.length,forms:t.forms.length}]))}));
