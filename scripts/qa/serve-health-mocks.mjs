// Run with: node scripts/qa/serve-health-mocks.mjs /path/to/the/built/amg-wealth
// Loopback only. This fixture uses the site's real learner API and admin scoring
// with disposable in-memory data. It does not connect to any hosted service.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
if (!process.argv[2]) throw Error('Provide the built AMG website directory.');
const root=path.resolve(process.argv[2]);
const {userPrefix}=await import(pathToFileURL(path.join(root,'netlify/functions/_shared/learning-core.mjs')));
const {createLearningHandler}=await import(pathToFileURL(path.join(root,'netlify/functions/_shared/learning-service.mjs')));
const {buildAdminLearningSnapshot}=await import(pathToFileURL(path.join(root,'netlify/functions/_shared/admin-learning.mjs')));
const port=18445, origin='http://127.0.0.1:'+port;
const info=new Map(), learnerStore=new Map(), clocks=new Map();let revision=0;
const backend={
  getWithMetadata:async key=>structuredClone(learnerStore.get(key)||null),
  setJSON:async(key,data,options)=>{
    const old=learnerStore.get(key);
    if((options.onlyIfNew&&old)||(options.onlyIfMatch&&old?.etag!==options.onlyIfMatch))return {modified:false};
    learnerStore.set(key,{data:structuredClone(data),etag:'m-'+(++revision),metadata:{}});
    return {modified:true};
  },
};
const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const types={'.js':'application/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.mp3':'audio/mpeg','.woff2':'font/woff2','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,origin),id=/\bqa_user=([a-z0-9-]+)/.exec(req.headers.cookie||'')?.[1]||'viewer';
    const user={id,name:'Course reviewer',email:id+'@example.invalid',accessGranted:true};
    if(url.pathname==='/api/access')return json(res,{stage:'ready',user});
    if(url.pathname==='/__qa/admin')return json(res,info.get(id)||{attempts:[]});
    if(url.pathname==='/__qa/clock'&&req.method==='POST'){clocks.set(id,Number(url.searchParams.get('at'))-Date.now());return json(res,{ok:true});}
    // Simulate a record written by the previous production release in this local fixture.
    if (url.pathname === '/__qa/old-timer' && req.method === 'POST') {
      const track = url.searchParams.get('track');
      if (!['life','health'].includes(track)) return json(res, {error:'unknown track'}, 400);
      const key = userPrefix(id) + 'records/amg-' + track + '-assessments-v1';
      const record = await backend.getWithMetadata(key);
      const attempt = record?.data.value.attempts.find(a => a.submittedAt === null);
      if (!attempt) return json(res, {error:'no saved attempt'}, 404);
      attempt.deadline = attempt.startedAt + 105 * 60_000;
      record.data.revision++;
      await backend.setJSON(key, record.data, {onlyIfMatch:record.etag});
      return json(res, {ok:true});
    }
    if(url.pathname==='/api/learning'){
      const reqBody=[];for await(const chunk of req)reqBody.push(chunk);
      const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(reqBody)}:{})});
      const handle=createLearningHandler({getUser:async()=>user,getStore:()=>backend,appsScriptURL:()=>'',now:()=>Date.now()+(clocks.get(id)||0),
        saveAdminSnapshot:async(_,x,records,at)=>{info.set(x.id,buildAdminLearningSnapshot(x,records,at));}});
      const result=await handle(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
    }
    let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep))return json(res,{error:'not found'},404);
    if(url.pathname==='/practice/health/'||url.pathname==='/practice/health')file=path.join(root,'practice/index.html');
    if(url.pathname==='/licensing')file=path.join(root,'licensing.html');
    if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    if(!fs.existsSync(file))return json(res,{error:'not found'},404);
    const size=fs.statSync(file).size, headers={'content-type':types[path.extname(file)]||'application/octet-stream','accept-ranges':'bytes'};
    const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
    if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;res.writeHead(206,{...headers,'content-range':`bytes ${start}-${end}/${size}`,'content-length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res);}
    else{res.writeHead(200,{...headers,'content-length':size});fs.createReadStream(file).pipe(res);}
  } catch(e){console.error(e.message);if(!res.headersSent)json(res,{error:'fixture failure'},500);else res.end();}
}).listen(port,'127.0.0.1',()=>console.log('Local classroom + original assessment API on '+origin));
