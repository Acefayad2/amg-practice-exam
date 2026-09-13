import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// This integrator never generates, downloads, uploads or deploys media.
export const ZOE={name:'Zoe',voice_id:'d0374db1-44b9-4f05-939e-0a9ae9dbbe6a',voice_type:'preset'};
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BUILDER='scripts/build-full-course.mjs';
const DEFAULT_BASELINE='docs/course/zoe-narration/input-inventory.json';
const sha=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const objectSha=value=>sha(JSON.stringify(canonical(value)));
const json=value=>JSON.stringify(value,null,2).replaceAll('<','\\u003c')+'\n';
const hashPattern=/^[a-f0-9]{64}$/;
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const lessonData=text=>JSON.parse(text.slice(text.indexOf('=')+1).trim().replace(/;$/,''));

function local(root,relative){
 assert(typeof relative==='string'&&!path.isAbsolute(relative),'Expected a repository-relative file path');
 const absolute=path.resolve(root,relative);
 assert(absolute.startsWith(root+path.sep),'Path escapes the workspace: '+relative);
 return absolute;
}
function httpsURL(value,label){
 assert(typeof value==='string',label+' is required');
 const url=new URL(value);
 assert(url.protocol==='https:'&&!url.username&&!url.password,label+' must be a public HTTPS URL');
 assert(!url.search&&!url.hash,label+' must not contain signed credentials or query parameters');
 return value;
}
function verifyFile(root,record,label){
 assert(record&&hashPattern.test(record.sha256),label+' requires a SHA-256');
 const file=local(root,record.path);
 assert(fs.statSync(file).isFile(),label+' must name a file');
 assert.equal(sha(fs.readFileSync(file)),record.sha256,label+' changed: '+record.path);
 return file;
}
function replaceOnce(text,before,after,label){
 assert.equal(text.split(before).length-1,1,'Expected one '+label);
 return text.replace(before,after);
}
function all60(rows,label){
 assert(Array.isArray(rows)&&rows.length===60,label+' must contain exactly 60 lessons');
 const numbers=rows.map(x=>x.number);
 assert(numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=60),label+' contains an invalid lesson number');
 assert.equal(new Set(numbers).size,60,label+' contains duplicate/missing lessons');
}
function noFailure(value,label){
 if(Array.isArray(value)){for(const v of value)noFailure(v,label);return;}
 if(!value||typeof value!=='object')return;
 for(const [key,v] of Object.entries(value)){
  if(/^(status|result)$/i.test(key))assert(!['failed','error','rejected'].includes(String(v).toLowerCase()),label+' contains failed QA');
  noFailure(v,label);
 }
}
function parseCaptions(text){
 const cues=[];
 for(const block of text.replaceAll('\r','').trim().split(/\n\s*\n/)){
  const lines=block.split('\n'),index=lines.findIndex(line=>line.includes('-->'));if(index<0)continue;
  const match=lines[index].match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})(?:\s|$)/);
  assert(match,'Invalid caption timing syntax');
  const seconds=value=>value.split(':').reduce((sum,n)=>sum*60+Number(n),0);
  cues.push({id:index?lines[index-1]:String(cues.length+1),start:seconds(match[1]),end:seconds(match[2]),text:lines.slice(index+1).join(' ').replace(/<[^>]+>/g,'').trim().replace(/\s+/g,' ')});
 }
 assert(cues.length&&new Set(cues.map(c=>c.id)).size===cues.length,'Captions require nonempty unique cues');return cues;
}
function reviewedCaptions(root,base,row){
 const label='Part '+base.number,original=base.baselines.captions,config=row.captions;
 if(config?.mode==='unchanged'){
  assert.equal(config.sha256,original.file.sha256,label+' caption binding mismatch');
  return {mode:'unchanged',sha256:config.sha256,lastCueEnd:original.lastCueEnd};
 }
 assert.equal(config?.mode,'reviewed-patch',label+' caption mode is unsupported');
 assert.equal(config.originalSha256,original.file.sha256,label+' caption patch original mismatch');
 const file=verifyFile(root,config.file,label+' reviewed caption patch'),text=fs.readFileSync(file,'utf8'),cues=parseCaptions(text);
 const words=cues.map(c=>c.text).join(' ').normalize('NFKC').replace(/[’‘]/g,"'").toLowerCase().match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu)||[];
 assert.equal(sha(JSON.stringify(words)),original.captionWordsSha256,label+' caption patch changes the spoken word sequence');
 for(let i=0;i<cues.length;i++){
  const cue=cues[i],duration=cue.end-cue.start;
  assert(cue.start>=0&&duration>=1-0.000001&&cue.end<=row.output.durationSeconds+0.02,label+' patched cue '+cue.id+' has invalid duration/bounds');
  assert(cue.text.length/duration<=30+0.000001,label+' patched cue '+cue.id+' exceeds 30 characters per second');
  assert(!i||cue.start>=cues[i-1].end,label+' patched cue '+cue.id+' overlaps');
 }
 const review=readJSON(verifyFile(root,config.review,label+' caption patch review'));
 assert.equal(review.number,base.number,label+' caption review identity mismatch');
 assert.equal(review.status,'passed',label+' caption patch review has not passed');
 assert.equal(review.originalSha256,original.file.sha256,label+' caption review source mismatch');
 assert.equal(review.patchSha256,config.file.sha256,label+' caption review patch mismatch');
 verifyFile(root,review.pairedTimestampEvidence,label+' paired timestamp evidence');
 assert(Array.isArray(review.pairedIntervalChecks)&&review.pairedIntervalChecks.length>0,label+' caption patch requires paired spoken interval evidence');
 for(const pair of review.pairedIntervalChecks){
  assert.equal(pair.status,'accepted',label+' has an unaccepted caption evidence pair');
  assert(typeof pair.evidence==='string'&&pair.evidence.trim(),label+' caption evidence locator is missing');
  for(const [key,bound]of [['source',row.source.durationSeconds],['replacement',row.output.durationSeconds]])assert(Number.isFinite(pair[key]?.start)&&Number.isFinite(pair[key]?.end)&&pair[key].start>=0&&pair[key].end>pair[key].start&&pair[key].end<=bound+0.02,label+' caption evidence interval is invalid');
 }
 const old=new Map(parseCaptions(fs.readFileSync(local(root,original.file.path),'utf8')).map(c=>[c.id,c])),next=new Map(cues.map(c=>[c.id,c]));
 const changed=[...new Set([...old.keys(),...next.keys()])].filter(id=>JSON.stringify(old.get(id))!==JSON.stringify(next.get(id))).sort();
 assert(changed.length>0,label+' reviewed patch does not change any cue');
 assert(Array.isArray(review.changedCues),label+' changed-cue review is missing');
 assert.deepEqual(review.changedCues.map(c=>String(c.id)).sort(),changed,label+' patch review must cover every changed cue exactly once');
 for(const cue of review.changedCues){
  assert(typeof cue.reason==='string'&&cue.reason.trim(),label+' changed-cue reasoning is missing');
  assert(Array.isArray(cue.evidenceIndexes)&&cue.evidenceIndexes.length>0&&cue.evidenceIndexes.every(i=>Number.isInteger(i)&&i>=0&&i<review.pairedIntervalChecks.length),label+' each changed cue requires linked boundary evidence');
 }
 return {mode:'reviewed-patch',sha256:config.file.sha256,lastCueEnd:cues.at(-1).end,text,reviewSha256:config.review.sha256};
}

export function validateCaptionAcceptance(base,captions,review){
 const label='Part '+base.number;
 if(captions.mode==='reviewed-patch'){
  assert.equal(review.captionSha256,captions.sha256,label+' final acceptance is not bound to the patched captions');
  assert.equal(review.captionReviewSha256,captions.reviewSha256,label+' final acceptance is not bound to the patch review');
 }else{
  assert.equal(captions.mode,'unchanged',label+' caption mode is unsupported');
  if(review.captionSha256!==undefined)assert.equal(review.captionSha256,captions.sha256,label+' unchanged captions differ from final acceptance');
  assert.equal(review.captionReviewSha256,undefined,label+' final acceptance requires a caption patch');
 }
}

/** Bind each audio-only repair encode to its input, evidence and freshly reviewed final file. */
export function validateAudioRepairs(root,base,row,qa,review){
 const label='Part '+base.number,source=row.output.normalizationSource,chain=row.output.repairs;
 if(chain===undefined){
  assert(source===undefined,label+' normalization source requires a repair chain');
  assert(review.repairReportSha256s===undefined,label+' repair acceptance has no output repair chain');
  return;
 }
 assert(Array.isArray(chain)&&chain.length>0,label+' repair chain must be nonempty');
 assert.equal(review.checks?.audioRepairs,'passed',label+' lacks final audio-repair acceptance');
 assert.deepEqual(review.repairReportSha256s,chain.map(x=>x.report?.sha256),label+' acceptance must bind the ordered repair reports');
 assert.equal(new Set(chain.map(x=>x.report?.sha256)).size,chain.length,label+' repeats a repair report');
 httpsURL(source?.video,label+' original normalized video');
 assert(source.video!==row.output.video&&hashPattern.test(source.fileSha256),label+' repair source must identify the earlier normalized export');
 const before=readJSON(verifyFile(root,source.automatedReport,label+' pre-repair automated report'));
 assert.equal(before.number,base.number,label+' pre-repair QA identity mismatch');
 assert(['automated-checks-clear','review-candidates'].includes(before.status),label+' pre-repair technical QA is incomplete');
 noFailure(before,label+' pre-repair QA');
 assert.equal(before.original?.fullDecodeExit,0,label+' pre-repair source decode failed');
 assert.equal(before.replacement?.fullDecodeExit,0,label+' pre-repair normalized decode failed');
 assert.equal(before.original.fileSha256,row.sourceFileSha256,label+' pre-repair original file mismatch');
 assert.equal(before.replacement.fileSha256,source.fileSha256,label+' normalized input hash mismatch');
 assert.equal(before.inputIdentity?.originalUrlSha256,sha(row.source.video),label+' pre-repair source URL mismatch');
 assert.equal(before.inputIdentity?.newUrlSha256,sha(source.video),label+' pre-repair normalized URL mismatch');
 assert.equal(before.inputIdentity?.originalVttSha256,base.baselines.captions.file.sha256,label+' pre-repair captions mismatch');
 assert.equal(before.inputIdentity?.expectedNarrationSha256,base.baselines.captions.normalizedCaptionTextSha256,label+' pre-repair narration mismatch');
 assert.equal(before.expectedDuration,row.source.durationSeconds,label+' pre-repair duration target mismatch');
 assert.equal(before.replacement.duration,row.output.durationSeconds,label+' repairs must preserve normalized runtime exactly');
 assert.equal(before.visuals?.unchangedVisualsVerified,true,label+' pre-repair picture is not verified');
 const words=text=>(text.normalize('NFKC').replace(/[’‘]/g,"'").toLowerCase().match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu)||[]).join(' ');
 const authoredWords=' '+words(parseCaptions(fs.readFileSync(local(root,base.baselines.captions.file.path),'utf8')).map(c=>c.text).join(' '))+' ';
 const streamHash=value=>typeof value==='string'?value.replace(/^SHA256=/,''):'';
 let inputHash=source.fileSha256,videoHash=before.replacement.videoBitstreamSha256,lastReport;
 assert(hashPattern.test(videoHash),label+' pre-repair video packet hash missing');
 for(const [index,step]of chain.entries()){
  const name=label+' repair '+(index+1),report=readJSON(verifyFile(root,step.report,name+' report'));
  assert(['tts-speech-patch','duplicate-speech-removal','compound-audio-repair'].includes(step.kind),name+' kind is unsupported');
  assert.equal(report.number,base.number,name+' lesson mismatch');
  assert.equal(report.status,'repaired-awaiting-full-review',name+' native report status is unsupported');
  assert.equal(report.inputFileSha256,inputHash,name+' input hash breaks the repair chain');
  assert(hashPattern.test(report.outputFileSha256)&&report.outputFileSha256!==inputHash,name+' final hash is invalid');
  assert.equal(report.duration,row.output.durationSeconds,name+' changed the runtime');
  assert.equal(report.decodeExitCode,0,name+' full decode failed');
  assert.equal(report.pictureUnchanged,true,name+' changed the picture');
  assert.equal(streamHash(report.originalVideoStreamHash),videoHash,name+' source video packet hash mismatch');
  assert.equal(streamHash(report.finalVideoStreamHash),videoHash,name+' changed video packets');
  assert.equal(report.unmodifiedPcmOutsideInterval,true,name+' lacks bounded pre-encode PCM proof');
  // This statement is about the edit PCM before AAC encoding, never final AAC sample identity.
  if(report.pcmComparisonScope!==undefined)assert(typeof report.pcmComparisonScope==='string'&&/before.*AAC/i.test(report.pcmComparisonScope),name+' PCM comparison scope must identify pre-AAC samples');
  assert.equal(report.uploadHttpStatus,200,name+' final media upload is not confirmed successful');
  httpsURL(report.video,name+' final video');
  assert(typeof report.mediaId==='string'&&report.mediaId.trim(),name+' final media ID is missing');
  assert.equal(Number(report.technical?.format?.duration),row.output.durationSeconds,name+' probe runtime mismatch');
  assert(Array.isArray(report.technical?.streams)&&['video','audio'].every(kind=>report.technical.streams.some(s=>s.codec_type===kind)),name+' final technical streams are missing');
  assert(Number.isFinite(Number(report.loudness?.input_i))&&Number(report.loudness.input_i)>=-19&&Number(report.loudness.input_i)<=-17,name+' integrated level is outside the reviewed course range');
  assert(Number.isFinite(Number(report.loudness?.input_tp))&&Number(report.loudness.input_tp)<=-1,name+' true peak lacks headroom');
  const edits=report.repairs??[{kind:step.kind,repair:report.repair,generation:report.generation,generatedAudioFileSha256:report.generatedAudioFileSha256}];
  assert(Array.isArray(edits)&&edits.length>0,name+' edit list is missing');
  assert(step.kind==='compound-audio-repair'?edits.length>1:edits.length===1&&edits[0].kind===step.kind,name+' edit kind/count mismatch');
  let end=0;
  for(const [editIndex,edit]of edits.entries()){
   const detail=edit.repair??edit,tag=name+' edit '+(editIndex+1),start=detail.replaceStart;
   assert(['tts-speech-patch','duplicate-speech-removal'].includes(edit.kind),tag+' kind is unsupported');
   assert(Number.isFinite(start)&&Number.isFinite(detail.replaceEnd)&&start>=end&&detail.replaceEnd>start&&detail.replaceEnd<=row.output.durationSeconds,tag+' repair intervals are invalid or overlap');
   assert(base.number!==1||start>=12,tag+' touches protected Marcus dialogue');
   assert(typeof detail.reason==='string'&&detail.reason.trim(),tag+' repair reason is missing');
   if(edit.kind==='tts-speech-patch'){
    const generation=edit.generation??detail.generation,sentence=detail.sentence;
    assert(typeof sentence==='string'&&words(sentence).length>0&&authoredWords.includes(' '+words(sentence)+' '),tag+' TTS sentence differs from authored teaching');
    assert(generation&&typeof generation.jobId==='string'&&generation.jobId.trim(),tag+' TTS job is missing');
    assert.equal(generation.model,'seed_audio',tag+' TTS model is unsupported');
    assert.equal(generation.status,'completed',tag+' TTS job is incomplete');
    assert.equal(generation.voiceId,ZOE.voice_id,tag+' TTS voice mismatch');
    assert.equal(generation.voiceType,ZOE.voice_type,tag+' TTS voice type mismatch');
    assert(Number.isFinite(generation.credits)&&generation.credits>=0,tag+' TTS credits are invalid');
    httpsURL(generation.resultUrl,tag+' TTS output');
    assert(hashPattern.test(edit.generatedAudioFileSha256??detail.generatedAudioFileSha256),tag+' generated audio hash missing');
    assert(Number.isFinite(detail.patchAt)&&Number.isFinite(detail.patchDuration)&&detail.patchDuration>0&&detail.patchAt>=start&&detail.patchAt+detail.patchDuration<=detail.replaceEnd+0.000001,tag+' speech patch exceeds its edit interval');
   }else assert(edit.generation===undefined&&detail.generation===undefined,tag+' duplicate removal cannot silently include generated speech');
   end=detail.replaceEnd;
  }
  noFailure(report,name+' native evidence');
  inputHash=report.outputFileSha256;lastReport=report;
 }
 assert.equal(inputHash,row.output.fileSha256,label+' repair chain does not reach the final export');
 assert.equal(lastReport.video,row.output.video,label+' repair chain final URL mismatch');
 assert.equal(qa.replacement.fileSha256,inputHash,label+' fresh QA does not cover the repaired file');
 assert.equal(qa.replacement.videoBitstreamSha256,videoHash,label+' fresh QA video packet proof mismatch');
}

/** Read and validate every input before constructing any product changes. No writes. */
export function prepareIntegration(inputPath,baselinePath=DEFAULT_BASELINE,root=ROOT){
 root=path.resolve(root);
 const baselineFile=local(root,baselinePath),inputFile=local(root,inputPath);
 const baseline=readJSON(baselineFile),input=readJSON(inputFile);
 assert.equal(baseline.schemaVersion,1,'Unsupported inventory schema');
 assert.equal(input.schemaVersion,1,'Unsupported integration schema');
 assert.equal(input.baselineSha256,sha(fs.readFileSync(baselineFile)),'Input does not bind the exact inventory');
 assert.equal(baseline.summary?.issues,0,'Inventory contains unresolved issues');
 assert.deepEqual(baseline.issues,[],'Inventory contains unresolved issues');
 assert.deepEqual(input.voice,ZOE,'Only the approved Zoe preset may be integrated');
 all60(baseline.lessons,'Inventory');all60(input.lessons,'Verified outputs');
 for(const file of baseline.sharedProgressBaselines)verifyFile(root,file,'Progress/assessment baseline');
 const outputs=new Map(input.lessons.map(x=>[x.number,x]));
 const videos=new Set(),jobs=new Set(),changes=new Map(),accepted=[];
 for(const base of [...baseline.lessons].sort((a,b)=>a.number-b.number)){
  const row=outputs.get(base.number),label='Part '+base.number;
  verifyFile(root,base.media.manifest,label+' manifest');
  verifyFile(root,base.baselines.publicData,label+' learner data');
  verifyFile(root,base.baselines.captions.file,label+' captions');
  if(base.baselines.captions.sourceFile)verifyFile(root,base.baselines.captions.sourceFile,label+' source captions');
  assert.equal(row.status,'verified',label+' is not verified');
  assert.deepEqual(row.source,{video:base.media.video.url,editArchive:base.media.editableArchive.url,durationSeconds:base.media.durationSeconds},label+' source identity mismatch');
  httpsURL(row.output?.video,label+' output video');
  assert(row.output.video!==row.source.video,label+' still uses the source video');
  assert(!videos.has(row.output.video),label+' repeats an output URL');videos.add(row.output.video);
  assert(Number.isFinite(row.output.durationSeconds)&&row.output.durationSeconds>=180&&row.output.durationSeconds<=300,label+' runtime is invalid');
  assert(Math.abs(row.output.durationSeconds-row.source.durationSeconds)<=0.05,label+' runtime changed by more than 50 ms');
  const captions=reviewedCaptions(root,base,row);
  assert(captions.lastCueEnd<=row.output.durationSeconds+0.02,label+' captions exceed the output');
  assert(hashPattern.test(row.output.fileSha256)&&hashPattern.test(row.sourceFileSha256),label+' requires exact media file hashes');
  assert(row.job?.id&&typeof row.job.id==='string'&&row.job.id.trim(),label+' requires a job ID');
  assert(!jobs.has(row.job.id),label+' repeats a voice-change job');jobs.add(row.job.id);
  assert.equal(row.job.model,'voice_change_merge',label+' model must be voice_change_merge');
  assert.equal(row.job.status,'completed',label+' voice job is incomplete');
  assert.equal(row.job.voiceId,ZOE.voice_id,label+' has the wrong voice');
  if(row.job.chargedCredits!==undefined)assert(Number.isFinite(row.job.chargedCredits)&&row.job.chargedCredits>=0,label+' has invalid credits');
  const qa=readJSON(verifyFile(root,row.qa?.automatedReport,label+' automated report'));
  assert.equal(qa.number,base.number,label+' QA report identity mismatch');
  assert(['automated-checks-clear','review-candidates'].includes(qa.status),label+' automatic QA is failed/incomplete');
  noFailure(qa,label+' automated report');
  assert.equal(qa.original?.fullDecodeExit,0,label+' source decode failed');
  assert.equal(qa.replacement?.fullDecodeExit,0,label+' replacement decode failed');
  assert.equal(qa.original.fileSha256,row.sourceFileSha256,label+' QA source file mismatch');
  assert.equal(qa.replacement.fileSha256,row.output.fileSha256,label+' QA output file mismatch');
  assert.equal(qa.inputIdentity?.originalUrlSha256,sha(row.source.video),label+' QA source URL mismatch');
  assert.equal(qa.inputIdentity?.newUrlSha256,sha(row.output.video),label+' QA output URL mismatch');
  assert.equal(qa.inputIdentity?.originalVttSha256,base.baselines.captions.file.sha256,label+' QA caption file mismatch');
  assert.equal(qa.inputIdentity?.expectedNarrationSha256,base.baselines.captions.normalizedCaptionTextSha256,label+' QA expected speech does not match the audited captions');
  assert.equal(qa.expectedDuration,row.source.durationSeconds,label+' QA expected duration mismatch');
  assert.equal(qa.replacement.duration,row.output.durationSeconds,label+' QA measured duration mismatch');
  assert.equal(qa.visuals?.unchangedVisualsVerified,true,label+' visuals are not verified unchanged');
  assert(['exact-compressed-stream-identity','full-decoded-frame-comparison'].includes(qa.visuals.method),label+' visual proof method is missing');
  const technical=row.output.technical;
  assert(technical&&Array.isArray(technical.streams)&&technical.format,label+' requires the final full ffprobe metadata');
  assert.deepEqual(technical,qa.replacement.technical,label+' final technical metadata does not match QA');
  assert.equal(Number(technical.format.duration),row.output.durationSeconds,label+' final probe duration mismatch');
  assert(Number.isSafeInteger(Number(technical.format.size))&&Number(technical.format.size)>0,label+' final probe size is missing');
  for(const kind of ['video','audio'])assert(technical.streams.some(s=>s.codec_type===kind),label+' final probe is missing '+kind);
  const review=readJSON(verifyFile(root,row.qa?.acceptance,label+' final review acceptance'));
  assert.equal(review.number,base.number,label+' acceptance identity mismatch');
  assert.equal(review.outputFileSha256,row.output.fileSha256,label+' acceptance is for a different output');
  assert.equal(review.automatedReportSha256,row.qa.automatedReport.sha256,label+' acceptance is for different QA');
  assert.equal(review.status,'passed',label+' lacks final review acceptance');
  validateCaptionAcceptance(base,captions,review);
  assert(typeof review.reviewedBy==='string'&&review.reviewedBy.trim(),label+' reviewer is required');
  assert(typeof review.reviewedAt==='string'&&Number.isFinite(Date.parse(review.reviewedAt)),label+' review date is required');
  assert.deepEqual(review.outstandingIssues,[],label+' has outstanding review issues');
  for(const check of ['spokenContent','voice','volumeAndClipping','captionAlignment'])assert.equal(review.checks?.[check],'passed',label+' lacks '+check+' acceptance');
  if(qa.status==='review-candidates')assert(typeof review.candidateResolution==='string'&&review.candidateResolution.trim().length>=20,label+' requires an explicit candidate resolution');
  if(base.number===1){
   assert.deepEqual(row.preservedDialogue,{start:0,end:12,speaker:'Marcus'},'Part 1 must preserve Marcus from 0–12 seconds');
   assert.equal(review.checks.protectedDialogue,'passed','Part 1 original dialogue has not been accepted');
  }
  noFailure(review,label+' acceptance');
  validateAudioRepairs(root,base,row,qa,review);
  if(row.output.audio)httpsURL(row.output.audio,label+' normalized audio');
  if(row.output.editArchive){
   const archive=row.output.editArchive;
   httpsURL(archive.url,label+' updated archive');
   assert(archive.url!==row.source.editArchive,label+' cannot relabel the old archive as Zoe');
   assert.equal(archive.kind,'zoe-export-bundle',label+' archive kind is unsupported');
   assert(archive.includesSourceArchive===true&&archive.includesNewAudio===true&&archive.includesFinalVideo===true,label+' archive contents are not attested');
   assert.equal(review.checks.editArchive,'passed',label+' updated archive has not been accepted');
  }
  const manifest=readJSON(local(root,base.media.manifest.path));
  assert.equal(manifest.video,row.source.video,label+' live manifest mismatch');
  const archiveKey=base.number<=2?'editable_archive':'editArchive';
  const sourceArchiveKey=base.number<=2?'source_editable_archive':'sourceEditArchive';
  manifest[sourceArchiveKey]=manifest[archiveKey];delete manifest[archiveKey];
  if(row.output.editArchive)manifest[archiveKey]=row.output.editArchive.url;
  const provenance={schemaVersion:1,voice:ZOE,sourceVideo:row.source.video,sourceEditArchive:row.source.editArchive,
   sourceDurationSeconds:row.source.durationSeconds,sourceNarrator:manifest.narrator??base.narration.existingNarrator??null,
   job:row.job,output:{...row.output},qa:row.qa,
   // Publish the acceptance summary; detailed speech diagnostics stay local.
   reviewAcceptance:{number:review.number,status:review.status,reviewedAt:review.reviewedAt,
    outputFileSha256:review.outputFileSha256,automatedReportSha256:review.automatedReportSha256,
    captionSha256:review.captionSha256,captionReviewSha256:review.captionReviewSha256,
    repairReportSha256s:review.repairReportSha256s,checks:review.checks,outstandingIssues:review.outstandingIssues},
   captions:row.captions,captionPolicy:captions.mode==='unchanged'?'Original caption file retained byte-for-byte; alignment accepted against the final Zoe output.':'Reviewed timing/segmentation patch; original spoken word sequence preserved, with bound paired timestamp evidence and final acceptance.',
   sourceArchivePolicy:row.output.editArchive?'Updated bundle includes original project, new audio and final export.':'Source archive contains the previous narration; no new-voice editable archive is claimed.'};
  if(row.output.repairs)provenance.audioRepairPolicy='The ordered repair reports connect the normalized voice-change export to the freshly reviewed final export. Unmodified PCM proof concerns samples before final AAC encoding; it does not claim identical decoded AAC samples outside the edit.';
  if(base.number===1)provenance.preservedDialogue=row.preservedDialogue;
  for(const key of ['narration_jobs','parameters'])if(manifest[key]!==undefined){provenance['source_'+key]=manifest[key];delete manifest[key];}
  provenance.sourceReview=manifest.review??null;
  provenance.sourceTechnical=manifest.technical??null;
  manifest.narrator=ZOE;manifest.narrationChange=provenance;manifest.video=row.output.video;
  const durationKey=base.number<=2?'duration_seconds':'duration';
  if(row.output.durationSeconds!==row.source.durationSeconds)manifest[durationKey]=base.number<=2?row.output.durationSeconds:row.output.durationSeconds.toFixed(6);
  // Prior production details remain historical; the new review identifies the actual accepted export.
  manifest.review={voice:'Zoe replacement accepted; see narrationChange review evidence.',decode:'Final replacement fully decoded successfully.',
   visual:'Unchanged picture verified by the recorded source/output comparison.',speech:'Spoken content, voice, volume and captions accepted in the linked final review.'};
  manifest.technical=technical;
  changes.set(base.media.manifest.path,json(manifest));
  if(captions.mode==='reviewed-patch'){
   changes.set(base.baselines.captions.file.path,captions.text);
   if(base.baselines.captions.sourceFile)changes.set(base.baselines.captions.sourceFile.path,captions.text);
  }
  if(base.number<=2){
   const learner=lessonData(fs.readFileSync(local(root,base.baselines.publicData.path),'utf8'));
   learner.video=row.output.video;
   if(Object.hasOwn(learner,'duration'))learner.duration=row.output.durationSeconds;
   if(base.number===1)learner.transcript=replaceOnce(learner.transcript,'Gideon, narrator:','Zoe, narrator:','Part 1 speaker attribution');
   changes.set(base.baselines.publicData.path,`window.${base.publicGlobal} = ${json(learner).trimEnd()};\n`);
   const htmlPath=`public/course/lesson-${base.id}/index.html`;
   let html=fs.readFileSync(local(root,htmlPath),'utf8');
   html=replaceOnce(html,'Narrated by Gideon','Narrated by Zoe',label+' narrator credit');
   if(base.number===2)html=replaceOnce(html,'Gideon explains it','Zoe explains it','Part 2 narrator introduction');
   changes.set(htmlPath,html);
  }
  accepted.push({base,row,captions});
 }
 let builder=fs.readFileSync(local(root,BUILDER),'utf8');
 const dynamic="Narrated by ${esc(media.narrator?.name || 'Gideon')}";
 if(!builder.includes(dynamic))builder=replaceOnce(builder,'Narrated by Gideon',dynamic,'builder narrator credit');
 changes.set(BUILDER,builder);
 return {root,baseline,input,accepted,changes,inputPath,baselinePath,inputSha256:sha(fs.readFileSync(inputFile)),baselineSha256:sha(fs.readFileSync(baselineFile))};
}

function outputPaths(plan){
 const paths=new Set(plan.changes.keys());
 for(const {base} of plan.accepted){
  for(const name of ['index.html','lesson-data.js','scene-captions.vtt'])paths.add(`public/course/lesson-${base.id}/${name}`);
  if(base.baselines.captions.sourceFile)paths.add(base.baselines.captions.sourceFile.path);
 }
 for(const file of ['docs/course/full-course/coverage-map.json','public/course/shared/catalog.json','public/course/index.html',
  'public/course/coverage/audit.json','public/course/coverage/full-coverage.json','public/course/coverage/coverage.csv'])paths.add(file);
 return [...paths].sort();
}
function verifyIntegrated(plan){
 for(const {base,row,captions} of plan.accepted){
  const data=lessonData(fs.readFileSync(local(plan.root,base.baselines.publicData.path),'utf8'));
  assert.equal(data.video,row.output.video,'Built wrong video '+base.id);
  if(base.number>2)assert.equal(Number(data.duration),row.output.durationSeconds,'Built wrong duration '+base.id);
  assert.equal(data.version,base.version,'Changed progress version '+base.id);
  assert.equal(sha(JSON.stringify(data.questions)),base.baselines.questionsSerializedSha256,'Changed question keys/order '+base.id);
  const teaching=structuredClone(data);delete teaching.video;delete teaching.poster;delete teaching.duration;
  if(base.number===1)teaching.transcript=replaceOnce(teaching.transcript,'Zoe, narrator:','Gideon, narrator:','speaker attribution for integrity check');
  assert.equal(objectSha(teaching),base.baselines.teachingExcludingMediaSha256,'Changed teaching/progress data '+base.id);
  verifyFile(plan.root,{...base.baselines.captions.file,sha256:captions.sha256},'Accepted built captions '+base.id);
  if(base.baselines.captions.sourceFile)verifyFile(plan.root,{...base.baselines.captions.sourceFile,sha256:captions.sha256},'Accepted source captions '+base.id);
  assert(fs.readFileSync(local(plan.root,`public/course/lesson-${base.id}/index.html`),'utf8').includes('Narrated by Zoe'),'Missing Zoe credit '+base.id);
 }
 for(const file of plan.baseline.sharedProgressBaselines)verifyFile(plan.root,file,'Protected progress/assessment file');
}
function restore(root,backup,records){
 for(const record of records)if(record.beforeSha256!==null){
  local(root,record.path);
  assert.equal(sha(fs.readFileSync(path.join(backup,'files',record.path))),record.beforeSha256,'Corrupt rollback backup '+record.path);
 }
 for(const record of records){
  const destination=local(root,record.path);
  if(record.beforeSha256===null){fs.rmSync(destination,{force:true});continue;}
  const original=path.join(backup,'files',record.path);
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(original,destination);
 }
}
export function applyIntegration(plan,backupPath){
 const fresh=prepareIntegration(plan.inputPath,plan.baselinePath,plan.root);
 assert.equal(fresh.inputSha256,plan.inputSha256,'Input changed after validation');
 assert.equal(fresh.baselineSha256,plan.baselineSha256,'Inventory changed after validation');
 assert.deepEqual([...fresh.changes],[...plan.changes],'Product inputs changed after validation');
 const backup=local(plan.root,backupPath);
 assert(backup.startsWith(path.join(plan.root,'docs/course/zoe-narration')+path.sep),'Backup must be under docs/course/zoe-narration');
 assert(!fs.existsSync(backup),'Backup path already exists');
 const records=outputPaths(plan).map(relative=>({path:relative,beforeSha256:fs.existsSync(local(plan.root,relative))?sha(fs.readFileSync(local(plan.root,relative))):null}));
 fs.mkdirSync(backup,{recursive:true});
 for(const record of records)if(record.beforeSha256!==null){const destination=path.join(backup,'files',record.path);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(local(plan.root,record.path),destination);}
 const receipt={schemaVersion:1,status:'prepared',inputPath:plan.inputPath,inputSha256:plan.inputSha256,baselinePath:plan.baselinePath,baselineSha256:plan.baselineSha256,records};
 const writeReceipt=()=>fs.writeFileSync(path.join(backup,'receipt.json'),json(receipt));
 writeReceipt();
 try{
  for(const [relative,text] of plan.changes)fs.writeFileSync(local(plan.root,relative),text);
  const result=spawnSync(process.execPath,[BUILDER],{cwd:plan.root,env:{...process.env,AMG_COURSE_PREVIEW:'0'},stdio:'inherit'});
  assert.equal(result.status,0,'Course build failed'+(result.error?': '+result.error.message:''));
  verifyIntegrated(plan);
  for(const record of records)record.afterSha256=fs.existsSync(local(plan.root,record.path))?sha(fs.readFileSync(local(plan.root,record.path))):null;
  receipt.status='applied';receipt.appliedAt=new Date().toISOString();writeReceipt();
 }catch(error){
  restore(plan.root,backup,records);receipt.status='restored-after-failure';receipt.failure=error.message;writeReceipt();throw error;
 }
 return {lessons:60,questions:plan.baseline.summary.questions,backup:backupPath,status:receipt.status};
}
export function rollback(backupPath,root=ROOT){
 const backup=local(root,backupPath),receipt=readJSON(path.join(backup,'receipt.json'));
 assert.equal(receipt.schemaVersion,1,'Unsupported rollback receipt');
 assert.equal(receipt.status,'applied','Only an applied receipt may be rolled back');
 for(const record of receipt.records){const file=local(root,record.path),current=fs.existsSync(file)?sha(fs.readFileSync(file)):null;assert.equal(current,record.afterSha256,'Refusing to overwrite later edits: '+record.path);}
 restore(root,backup,receipt.records);receipt.status='rolled-back';receipt.rolledBackAt=new Date().toISOString();fs.writeFileSync(path.join(backup,'receipt.json'),json(receipt));
 return {status:'rolled-back',files:receipt.records.length};
}

function main(){
 const args=process.argv.slice(2),opts={};
 for(let i=0;i<args.length;i++){
  const name=args[i];assert(['--input','--baseline','--apply','--backup','--rollback','--help'].includes(name),'Unknown option '+name);
  assert(!Object.hasOwn(opts,name),'Repeated option '+name);
  if(['--apply','--help'].includes(name))opts[name]=true;
  else {assert(args[i+1]&&!args[i+1].startsWith('--'),'Missing value for '+name);opts[name]=args[++i];}
 }
 if(opts['--help']){console.log('Validate only: node scripts/apply-zoe-narration.mjs --input docs/course/zoe-narration/verified-outputs.json\nApply + course build: add --apply --backup docs/course/zoe-narration/backups/RUN_NAME\nRollback: --rollback docs/course/zoe-narration/backups/RUN_NAME');return;}
 if(opts['--rollback']){assert.equal(Object.keys(opts).length,1,'Rollback cannot be combined with other options');console.log(json(rollback(opts['--rollback'])));return;}
 assert(opts['--input'],'--input is required (or use --help)');
 assert(!opts['--backup']||opts['--apply'],'--backup requires --apply');
 const plan=prepareIntegration(opts['--input'],opts['--baseline']||DEFAULT_BASELINE);
 if(opts['--apply']){assert(opts['--backup'],'--apply requires an unused --backup path');console.log(json(applyIntegration(plan,opts['--backup'])));}
 else console.log(json({status:'validated-only',lessons:60,questions:plan.baseline.summary.questions,plannedDirectFiles:plan.changes.size,build:BUILDER,noFilesWritten:true}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error('Zoe integration stopped:',error.message);process.exitCode=1;}
}
