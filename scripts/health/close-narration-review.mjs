import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewedAudio } from './reviewed-audio.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url)), dir=path.join(root,'docs/course/health');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const write=(n,r)=>fs.writeFileSync(path.join(dir,n),JSON.stringify(r,null,2)+'\n');
const names=fs.readdirSync(dir);
const first=names.filter(n=>/^audio-\d{2}-\d{2}\.json$/.test(n)).sort();
const repairs=names.filter(n=>/^retakes-\d+\.json$/.test(n)).sort();
const clips=read('narration-reviewed.json').clips;
const media=reviewedAudio(dir);
if(media.size!==360||clips.length!==360)throw Error('Close review only when all 360 unique sections have passed.');
const selections=new Map(clips.map(c=>[c.index,c]));
const kept=new Set(clips.map(c=>c.job_id));
const originals=new Set(), repairIds=new Set(), ids=new Set(); let firstSpend=0,repairSpend=0;
const updates=[];
for(const file of [...first,...repairs]){
  const r=read(file), isFirst=first.includes(file);
  if(r.inflight_indices?.length||r.params.length!==r.jobs.length||r.jobs.some(j=>j.status!=='completed'||!j.result_url))throw Error('Unfinished batch: '+file);
  if(new Set(r.jobs.map(j=>j.index)).size!==r.jobs.length)throw Error('Duplicate index in '+file);
  let subtotal=0;
  for(const j of r.jobs){
    if(ids.has(j.job_id))throw Error('Provider job appears twice: '+j.index);ids.add(j.job_id);
    (isFirst?originals:repairIds).add(j.job_id);
    const amount=r.estimates.find(q=>q.index===j.index)?.cost?.credits_exact;
    if(!(amount>0))throw Error('Missing quote '+j.index);subtotal+=amount;
  }
  if(Math.abs(subtotal-r.credits.credits_exact)>.001)throw Error('Receipt does not reconcile: '+file);
  if(isFirst)firstSpend+=subtotal;else repairSpend+=subtotal;
  r.status='reviewed';
  r.review={method:'decoded, transcribed, checked against the script, mastered and checked again',accepted_job_ids:r.jobs.filter(j=>kept.has(j.job_id)).map(j=>j.job_id)};
  if(isFirst)r.review.replacement_indices=r.jobs.filter(j=>selections.get(j.index).job_id!==j.job_id).map(j=>j.index);
  if(r.technical_review)r.technical_review.speech_review='Compared against the authored script; see narration-reviewed.json for accepted masters.';
  updates.push([file,r]);
}
if(originals.size!==360||[...kept].some(j=>!ids.has(j)))throw Error('Missing provider history.');
const lengths=clips.map(c=>c.duration_sec),seconds=Math.round(lengths.reduce((s,n)=>s+n,0));
const pace=clips.map(c=>c.wpm).sort((a,b)=>a-b),median=(pace[179]+pace[180])/2;
const silence=clips.reduce((s,c)=>s+c.silence_removed_sec,0);
const edits=Object.entries(read('narration-edits.json')).filter(([id])=>kept.has(id));
const numbers={firstPass:firstSpend.toFixed(1),retakes:repairSpend.toFixed(1),total:(firstSpend+repairSpend).toFixed(1),retakeJobs:repairIds.size,selectedRetakes:[...kept].filter(j=>repairIds.has(j)).length,seconds,lessons:60,clips:clips.length,medianWpm:median,range:[pace[0],pace.at(-1)],tempoAdjusted:clips.filter(c=>c.tempo_factor).length};
for(const [file,r] of updates)write(file,r);
const duration=Math.floor(seconds/3600)+' h '+Math.floor(seconds%3600/60)+' min '+seconds%60+' s';
const review=`# Maryland Health narration review

The review branch includes 60 lessons with six playable sections each. The files are served by the AMG classroom behind its existing sign-in. Every recording has a matching read-along section; learners can listen, read, or do both before taking the quiz.

| Recording measure | Result |
|---|---:|
| Selected clips, decoded and matched to the authored section | ${clips.length} |
| Total running time | ${duration} |
| Typical speaking pace (median; range) | ${median}; ${pace[0]}–${pace.at(-1)} words/min |
| Sections slowed without changing voice pitch | ${numbers.tempoAdjusted} |
| Excess silence removed, including lead-in and tail | ${Math.round(silence)} s |
| Selected recordings with a verified phrase cut or restored sentence | ${edits.length} |
| Replacement recordings made / selected | ${repairIds.size} / ${numbers.selectedRetakes} |

**Costs in Higgsfield credits:** ${numbers.firstPass} for the first 360 recordings (including the 46.1 pilot), plus ${numbers.retakes} for targeted retakes, for **${numbers.total}** in all. The original allowance including repairs was 1,932.9 credits. Decoding, transcription, silence edits and classroom rendering were local and incurred no additional generation credits. Quotes for completed jobs are recorded per batch; they are not a dollar invoice.

**Review method.** Each section was decoded end to end and transcribed locally. A second transcription and individual review decisions resolved disagreements over wording, pronunciations and numbers. Omissions, repeated lines and wrong figures were corrected rather than accepted on similarity alone. Mastered files were decoded again, checked for clipping and hashed. Review selections are in [narration-reviewed.json](narration-reviewed.json); [wording revisions](narration-wording.json), [speech edits](narration-edits.json), [documented exceptions](narration-decisions.json) and the per-batch receipts preserve the trail. These are automated speech checks plus editorial review, not a human listening panel.

The lessons include 484 original quiz questions. Reading or listening unlocks the quiz without marking a video as watched. The available 90-question Health practice exam is linked; the separate diagnostic and three new timed mock exams are not released. Full lesson videos and coordinator approval are separate from this narration release.
`;
fs.writeFileSync(path.join(dir,'NARRATION-REVIEW.md'),review);
console.log(JSON.stringify(numbers));
