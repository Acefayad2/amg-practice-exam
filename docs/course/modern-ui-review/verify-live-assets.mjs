import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const args=process.argv.slice(2), option=name=>args[args.indexOf(name)+1];
assert(args.includes('--deploy')&&args.includes('--commit'),'Parent-confirmed published deploy and commit required');
const deploy=option('--deploy'),commit=option('--commit');
assert(/^[a-f0-9]{24}$/.test(deploy)&&/^[a-f0-9]{7,40}$/.test(commit));
const dir='docs/course/modern-ui-review/',origin='https://amg-exam-portal.netlify.app',dist=path.resolve('dist');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const buildBytes=fs.readFileSync(dir+'build-assets.json'),build=JSON.parse(buildBytes),entries=Object.entries(build).sort(([a],[b])=>a.localeCompare(b));
assert.equal(entries.length,215);
const knownBytes=fs.readFileSync(dir+'known-host-attribution.json'),known=JSON.parse(knownBytes),snippet=known.snippet.text;
assert.equal(Buffer.byteLength(snippet),536);assert.equal(sha(snippet),known.snippet.sha256);
assert(snippet.startsWith('\n<!-- This site is hosted on Netlify.')&&!/<script|<link|<iframe|http-equiv\s*=/i.test(snippet));
const allowed=new Set(['.html','.js','.css','.json','.vtt','.csv','.md','.docx','.webp','.woff2','.txt']),local=new Map();
for(const [name,hash] of entries){
 assert(!name.startsWith('/')&&!name.split('/').includes('..')&&allowed.has(path.extname(name)));
 const bytes=fs.readFileSync(path.join(dist,name));assert.equal(sha(bytes),hash,'Build inventory/local mismatch: '+name);local.set(name,bytes);
}
const report={startedAt:new Date().toISOString(),site:origin,expectedDeployId:deploy,applicationCommit:commit,
 deploymentIdentitySource:'Parent-confirmed published deployment; static response bytes independently checked.',
 build:{path:dir+'build-assets.json',sha256:sha(buildBytes),dist},
 knownHostAttribution:{path:dir+'known-host-attribution.json',sha256:sha(knownBytes),snippetSha256:known.snippet.sha256},
 method:'Six concurrent public static HTTP GETs. Complete decoded response bytes hashed in memory and discarded; no video/audio bodies, media processing, browser state or settings changes.',
 remoteVideoOrAudioRequested:false,responseBodiesSaved:false,files:[],extraRoutes:[]};
const strictFiles=[];
async function get(route){
 let url=new URL(route,origin).href;const redirects=[];
 for(let i=0;i<=4;i++){
  assert.equal(new URL(url).origin,origin);
  const response=await fetch(url,{redirect:'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});
  if([301,302,303,307,308].includes(response.status)){
   const to=new URL(response.headers.get('location'),url).href;await response.body?.cancel();assert.equal(new URL(to).origin,origin,'External redirect refused');redirects.push({from:url,to,httpStatus:response.status});url=to;continue;
  }
  const bytes=Buffer.from(await response.arrayBuffer());return {bytes,httpStatus:response.status,finalUrl:url,redirects,actualBytes:bytes.length,actualSha256:sha(bytes),contentType:response.headers.get('content-type'),contentEncoding:response.headers.get('content-encoding')};
 }
 throw Error('Too many redirects');
}
function reconcile(name,bytes){
 const expected=local.get(name);if(bytes.equals(expected))return {status:'matched',exactBytes:true};
 assert(name.endsWith('.html'),'Only the reviewed HTML attribution can differ');
 const actual=bytes.toString('utf8'),occurrences=actual.split(snippet).length-1;
 assert.equal(occurrences,1,'Expected the exact reviewed attribution once');
 const at=actual.indexOf(snippet),headStart=actual.indexOf('<head>'),headEnd=actual.indexOf('</head>');
 assert(headStart>=0&&at>=headStart+6&&at+snippet.length<=headEnd,'Attribution must be wholly inside head');
 const stripped=Buffer.from(actual.replace(snippet,''));
 assert(stripped.equals(expected),'Other changed bytes remain after exact attribution removal');
 return {status:'matched-with-reviewed-host-attribution',exactBytes:false,transformation:{occurrences:1,position:at,headStart,headEnd,entirelyWithinHead:true,removedBytes:536,attributionSha256:sha(snippet),afterRemovalSha256:sha(stripped),exactRemainingBytes:true}};
}
let next=0;
async function worker(){
 while(next<entries.length){
  const [name,expectedSha256]=entries[next++],url=new URL('/'+name.split('/').map(encodeURIComponent).join('/'),origin).href;
  const item={path:name,url,expectedSha256,expectedBytes:local.get(name).length};
  try{
   const {bytes,...response}=await get(url);Object.assign(item,response);
   strictFiles.push({...item,status:response.httpStatus===200&&bytes.equals(local.get(name))?'matched':'mismatch'});
   assert.equal(response.httpStatus,200);Object.assign(item,reconcile(name,bytes));
  }catch(error){Object.assign(item,{status:'findings',error:error.message,cause:error.cause?.code});if(!strictFiles.some(x=>x.path===name))strictFiles.push({...item});}
  report.files.push(item);
 }
}
await Promise.all(Array.from({length:6},worker));
report.files.sort((a,b)=>a.path.localeCompare(b.path));strictFiles.sort((a,b)=>a.path.localeCompare(b.path));
for(const [route,name] of [['/course/','course/index.html'],['/course/assessments/','course/assessments/index.html'],['/course/lesson-01/','course/lesson-01/index.html']]){
 try{const {bytes,...response}=await get(route);assert.equal(response.httpStatus,200);report.extraRoutes.push({route,...response,...reconcile(name,bytes)});}
 catch(error){report.extraRoutes.push({route,status:'findings',error:error.message});}
}
assert.equal(sha(fs.readFileSync(dir+'build-assets.json')),report.build.sha256,'Build manifest changed during verification');
report.completedAt=new Date().toISOString();report.summary={assets:report.files.length,exactByteMatches:report.files.filter(x=>x.status==='matched').length,reviewedAttributionMatches:report.files.filter(x=>x.status==='matched-with-reviewed-host-attribution').length,unexpectedDifferences:report.files.filter(x=>x.status==='findings').length,extraRoutesChecked:report.extraRoutes.length,extraRouteFailures:report.extraRoutes.filter(x=>x.status==='findings').length};
report.status=report.summary.unexpectedDifferences||report.summary.extraRouteFailures?'findings':'passed-with-exactly-reviewed-host-attribution';
const strict={startedAt:report.startedAt,completedAt:report.completedAt,expectedDeployId:deploy,applicationCommit:commit,build:report.build,method:report.method,files:strictFiles};
fs.writeFileSync(dir+'live-assets-strict.json',JSON.stringify(strict,null,2)+'\n');report.strictScan={path:dir+'live-assets-strict.json',sha256:sha(fs.readFileSync(dir+'live-assets-strict.json'))};
fs.writeFileSync(dir+'live-assets.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,expectedDeployId:deploy,summary:report.summary,findings:report.files.filter(x=>x.status==='findings').map(x=>({path:x.path,error:x.error}))},null,2));
