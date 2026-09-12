import fs from 'node:fs';
// Map the actual reviewed Parts 1–2; these pages predate the lesson builder.
// This reads their real teaching and questions rather than counting a plan as coverage.
const definitions={
 '01':{title:'Risk, perils and hazards',terms:{Risk:['2.1.01'],Exposure:['2.1.02'],Peril:['2.1.04'],Hazard:['2.1.03'],Loss:['2.1.05']},questions:[['2.1.04'],['2.1.03'],['2.1.03'],['2.1.03'],['2.1.02'],['2.1.01'],['2.1.11'],['2.1.05']]},
 '02':{title:'Pooling, large numbers and adverse selection',terms:{'Law of large numbers':['2.1.13'],'Expected claims':['2.1.13'],'Adverse selection':['2.1.12']},questions:[['2.1.01'],['2.1.01'],['2.1.13'],['2.1.13'],['2.1.13'],['2.1.12'],['2.1.12'],['2.1.12']]}
};
export const foundationLessons=Object.entries(definitions).map(([id,m])=>{
 const raw=fs.readFileSync(new URL('../../../public/course/lesson-'+id+'/lesson-data.js',import.meta.url),'utf8');
 const data=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
 if(data.questions.length!==m.questions.length)throw Error('Update foundation question mapping '+id);
 const blocks=Object.entries(m.terms).map(([name,topics])=>{
  const t=data.terms.find(t=>t.name===name);if(!t)throw Error('Missing actual foundation teaching '+id+' '+name);
  return {title:t.name,narration:t.definition+' '+t.example,topics};
 });
 return {number:Number(id),id,version:data.version,title:m.title,blocks,notes:[],questions:data.questions.map((q,i)=>({...q,id:'L'+id+'-'+String(i+1).padStart(2,'0'),topics:m.questions[i]}))};
});
