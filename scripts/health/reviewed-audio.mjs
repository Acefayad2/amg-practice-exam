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
    if(!/^h\d{2}-[1-6]-[a-f\d]{10}\.mp3$/.test(s.file))throw Error('Invalid mastered audio filename');
    const file=path.resolve(dir,'../../../public/course/health/audio',s.file);
    if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==s.sha256)throw Error('Mastered audio changed: '+s.index);
    selected.set(s.index,{url:'/course/health/audio/'+s.file,seconds:s.duration_sec});
  }
  return selected;
}
