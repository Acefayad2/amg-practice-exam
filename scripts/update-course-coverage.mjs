import fs from 'node:fs';
export function updateCoverage(map,available,questionCount){
 const base='public/course/coverage/',audit=JSON.parse(fs.readFileSync(base+'audit.json','utf8'));
 const byId=new Map(map.map(x=>[x.id,x])),live=new Set(available.map(x=>x.id));
 for(const r of audit.rows){
  const group=r.topics.map(t=>byId.get(t.id));
  const ls=[...new Set(group.flatMap(t=>t.teaching.map(x=>x.lesson)).filter(id=>live.has(id)))].sort();
  const complete=group.every(t=>t.teaching.some(x=>live.has(x.lesson))&&t.questions.some(x=>live.has(x.lesson)));
  r.evidence={status:complete?'published':'partial',text:complete?'Every teaching group has published instruction and required question evidence. Coordinator content approval remains pending.':'Some mapped instruction is still awaiting publication.',links:ls.map(id=>['Part '+Number(id),'/course/lesson-'+id+'/'])};
  r.lesson=ls.map(id=>'Part '+Number(id)).join(', ');
  r.courseQuestions=[...new Set(group.flatMap(t=>t.questions.filter(x=>live.has(x.lesson)).map(x=>x.id)))];
  for(const t of r.topics){const m=byId.get(t.id);t.status='published teaching';t.evidence=m;t.approval='Pending';}
 }
 audit.summary.availableLessons=available.length;audit.summary.lessonQuestions=questionCount;
 audit.summary.publishedTeachingGroups=map.filter(t=>t.teaching.some(x=>live.has(x.lesson))).length;
 fs.writeFileSync(base+'audit.json',JSON.stringify(audit,null,2)+'\n');
 fs.writeFileSync(base+'full-coverage.json',JSON.stringify(map,null,2)+'\n');
 const cell=x=>'"'+String(x).replaceAll('"','""')+'"';
 const csv=[['Topic ID','Teaching group','Published lesson evidence','Required question evidence','Coordinator approval'],...map.map(t=>[t.id,t.title,[...new Set(t.teaching.filter(x=>live.has(x.lesson)).map(x=>'Part '+Number(x.lesson)))].join('; '),t.questions.filter(x=>live.has(x.lesson)).map(x=>x.id).join('; '),'Pending'])].map(r=>r.map(cell).join(',')).join('\n');
 fs.writeFileSync(base+'coverage.csv',csv+'\n');
}
