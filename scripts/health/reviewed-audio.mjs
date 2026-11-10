import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Raw generations are not learner media. An explicit review selection ties each
// published section to one immutable provider job, including any accepted retake.
export function reviewedAudio(dir) {
  const indexPath=path.join(dir,'narration-reviewed.json');
  if(!fs.existsSync(indexPath))return new Map();
  const selections=JSON.parse(fs.readFileSync(indexPath,'utf8')).clips, jobs=new Map(), selected=new Map();
  for(const f of fs.readdirSync(dir).filter(n=>/^(?:audio-\d{2}-\d{2}|retakes-\d+)\.json$/.test(n))){
    for(const job of JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')).jobs)if(job.job_id)jobs.set(job.job_id,job);
  }
  for(const s of selections){
    const j=jobs.get(s.job_id);
    if(!j||j.status!=='completed'||j.index!==s.index||selected.has(s.index)||!Number.isFinite(s.duration_sec)||s.duration_sec<=0)
      throw Error('Invalid reviewed audio selection: '+s.index);
    const lesson=Math.floor(s.index/100), section=s.index%100;
    if(!Number.isInteger(s.index)||lesson<1||lesson>60||section>5||!/^[a-f0-9]{64}$/.test(s.sha256)||
      s.file!=='h'+String(lesson).padStart(2,'0')+'-'+(section+1)+'-'+s.sha256.slice(0,10)+'.mp3')
      throw Error('Invalid mastered audio filename: '+s.index);
    const file=path.resolve(dir,'../../../public/course/health/audio',s.file);
    if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==s.sha256)throw Error('Mastered audio changed: '+s.index);
    selected.set(s.index,{url:'/course/health/audio/'+s.file,seconds:s.duration_sec});
  }
  for(const lesson of new Set([...selected.keys()].map(i=>Math.floor(i/100)))){
    for(let i=0;i<6;i++)if(!selected.has(lesson*100+i))throw Error('Incomplete narration for lesson '+lesson);
  }
  return selected;
}
