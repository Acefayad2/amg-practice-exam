import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
const source=fs.readFileSync('src/course/account.js','utf8');
const executable=source;
assert.ok(!source.includes('@netlify/identity'),'The learner adapter has no Identity dependency.');
const checks=[],fixtures=[];
const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await wait(10);}throw Error('Timed out awaiting test operation');};
const KEY='amg-life-lesson-03-v1',ASSESS='amg-life-assessments-v1';
const copy=x=>JSON.parse(JSON.stringify(x));
class Element {
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.attributes={};this.handlers={};this.inert=false;this.classList={remove(){}};}
 append(...children){for(const child of children){if(child&&typeof child==='object')child.parent=this;this.children.push(child);}}
 replaceChildren(...children){this.children=[];this.append(...children);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 setAttribute(key,value){this.attributes[key]=String(value);}
 addEventListener(name,fn){this.handlers[name]=fn;}
}
function backend(user='agent-a'){
 return {user,accessStage:'ready',accessUser:null,accessCalls:[],records:{},seen:new Map(),writes:0,posts:[],hook:null,getHook:null,
 async fetch(path,options){
  assert.equal(options.credentials,'include');
  if(path==='/api/access'){
   this.accessCalls.push(options.method?JSON.parse(options.body):null);
   if(options.method){this.accessStage='code';return response(200,{stage:'code'});}
   return response(200,{stage:this.accessStage,...(this.accessStage==='ready'?{user:{id:this.accessUser||this.user,name:this.user}}:{})});
  }
  assert.equal(path,'/api/learning');
  if(!options.method){if(this.getHook)return this.getHook();return response(200,{user:{id:this.user,name:this.user},records:copy(this.records),reporting:{status:'synced'}});}
  const body=JSON.parse(options.body);this.posts.push(copy(body));
  if(options.headers['X-AMG-User']!==this.user)return response(403,{error:'account_changed'});
  if(body.action==='sync-report')return response(200,{reporting:{status:'synced'}});
  if(this.hook)return this.hook(body);
  return this.accept(body);
 },
 accept(body){
  if(this.seen.has(body.mutationId))return response(200,{record:copy(this.seen.get(body.mutationId)),reporting:{status:'synced'}});
  const current=this.records[body.key]||{revision:0,value:null};if(body.revision!==current.revision)return response(409,{error:'conflict',record:current});
  const record={value:copy(body.value),revision:current.revision+1};this.records[body.key]=record;this.seen.set(body.mutationId,copy(record));this.writes++;return response(200,{record:copy(record),reporting:{status:'synced'}});
 }};
}
const response=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>copy(body)});
function fixture(server,{store=new Map(),failWrites=false}={}){
 const body=new Element('body'),controls=new Element('div'),status=new Element('div'),nodes={'account-controls':controls,'account-sync-status':status};body.append(controls,status,new Element('main'));
 const handlers={},timers=new Set(),locks=new Map(),auth=[],redirects=[],scheduledDelays=[];
 const local={get length(){return store.size;},key:i=>[...store.keys()][i]??null,getItem:key=>store.get(key)??null,setItem(key,value){if(f.failWrites)throw Error('storage_full');store.set(key,String(value));},removeItem(key){store.delete(key);}};
 const f={store,failWrites,auth,redirects,handlers,timers,body,scheduledDelays};
 const context={console,JSON,Object,Array,Map,Set,Promise,Number,String,RegExp,Error,Math,Date,encodeURIComponent,queueMicrotask,AbortController,
  document:{body,getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),createTextNode:text=>String(text),querySelectorAll:()=>[]},
  location:{pathname:'/course/lesson-03/',search:'',hash:'',replace:url=>redirects.push(url),reload:()=>redirects.push('reload')},
  crypto:{randomUUID},localStorage:local,
  navigator:{locks:{request(key,fn){const result=(locks.get(key)||Promise.resolve()).catch(()=>{}).then(fn);locks.set(key,result);return result;}}},
  setTimeout(fn,ms){scheduledDelays.push(ms);const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;},clearTimeout(id){timers.delete(id);clearTimeout(id);},
  fetch:(...args)=>server.fetch(...args),
  addEventListener(name,fn){(handlers[name]??=[]).push(fn);}
 };context.window=context;vm.createContext(context);vm.runInContext(executable,context,{filename:'account.js'});f.api=context.AMG_ACCOUNT;f.emit=(name,event)=>{for(const fn of handlers[name]||[])fn(event);};f.envelope=key=>JSON.parse(store.get('amg-user:'+encodeURIComponent(server.user)+':'+key)||'null');f.close=()=>{for(const id of timers)clearTimeout(id);};fixtures.push(f);return f;
}
try {
 {
  const b=backend(),old=JSON.stringify({complete:true,answers:[1]});b.records[KEY]={revision:4,value:{position:71}};let resolve;b.getHook=()=>new Promise(r=>resolve=r);const f=fixture(b,{store:new Map([[KEY,old]])});await until(()=>resolve);
  check(!f.api.canWrite(),'Hydration blocks progress writes before the verified account response');
  assert.throws(()=>f.api.storage.getItem(KEY));checks.push('Runtime storage cannot read unscoped records while loading');
  resolve(response(200,{user:{id:b.user,name:'Agent A'},records:b.records,reporting:{status:'synced'}}));await f.api.ready;
  check(JSON.parse(f.api.storage.getItem(KEY)).position===71,'Server progress is restored before ready resolves');
  check(f.store.get(KEY)===old&&!f.store.has('amg-user:agent-b:'+KEY),'Legacy unscoped records stay untouched and other users receive no cache');
  check(f.api.lockKey(KEY)==='amg-user:agent-a:'+KEY,'Lesson locks are scoped to the authenticated user');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;f.api.storage.setItem(KEY,JSON.stringify({position:1}));f.api.storage.setItem(KEY,JSON.stringify({position:2}));await until(()=>b.writes===1);await until(()=>!f.envelope(KEY).dirty);
  check(b.posts.length===1&&b.records[KEY].value.position===2,'Rapid playback saves coalesce into one latest-value request');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;let release;b.hook=body=>new Promise(r=>release=()=>r(b.accept(body)));
  f.api.storage.setItem(KEY,JSON.stringify({position:10}));await until(()=>release);f.api.storage.setItem(KEY,JSON.stringify({position:20}));b.hook=null;release();await until(()=>b.writes===2);await until(()=>!f.envelope(KEY).dirty);
  check(b.records[KEY].value.position===20&&b.posts[1].revision===1,'An inflight acknowledgement advances revision without erasing newer local progress');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;b.hook=body=>{b.hook=null;b.accept(body);throw Error('response_lost');};f.api.storage.setItem(KEY,JSON.stringify({position:30}));await until(()=>b.posts.length===1);await wait(20);f.emit('online',{});await until(()=>b.posts.filter(x=>x.key===KEY).length===2);await until(()=>!f.envelope(KEY).dirty);
  const attempts=b.posts.filter(x=>x.key===KEY);check(b.writes===1&&JSON.stringify(attempts[0])===JSON.stringify(attempts[1]),'A lost response retries the identical persisted mutation body without a duplicate write');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;b.records[KEY]={revision:5,value:{position:90}};f.api.storage.setItem(KEY,JSON.stringify({position:40}));await until(()=>!f.api.canWrite());
  check(f.envelope(KEY).value.position===40&&f.envelope(KEY).conflict&&b.records[KEY].value.position===90,'A server conflict preserves pending local content and never overwrites the newer cloud record');
 }
 {
  const b=backend(),f=fixture(b);b.records[ASSESS]={revision:1,value:{version:1,attempts:[]}};await f.api.ready;const baseline=f.api.storage.getItem(ASSESS);
  f.api.storage.setItem(ASSESS,JSON.stringify({version:1,attempts:[{id:'newer-tab-attempt'}]}));const accepted=await f.api.commitSnapshot(ASSESS,JSON.stringify({version:1,attempts:[{id:'stale-tab-attempt'}]}),baseline);
  check(!accepted&&!f.api.canWrite()&&f.envelope(ASSESS).value.attempts[0].id==='newer-tab-attempt'&&f.envelope(ASSESS).rejectedValue.attempts[0].id==='stale-tab-attempt','A stale assessment snapshot cannot borrow the latest local revision; rejected pending data is retained');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;const one=JSON.stringify({version:1,attempts:[{id:'a',answer:1}]}),two=JSON.stringify({version:1,attempts:[{id:'a',answer:2}]}),events=[];f.api.subscribe(e=>events.push(e));
  const queued=[f.api.commitSnapshot(ASSESS,one,null),f.api.commitSnapshot(ASSESS,two,one)];check(f.api.statusText().startsWith('Saving'),'Queued snapshot writes display Saving before the WebLock commit begins');
  const values=await Promise.all(queued);await until(()=>b.writes===1);
  check(values.every(Boolean)&&b.records[ASSESS].value.attempts[0].answer===2,'Queued same-page assessment saves preserve their own ordered baselines');
  check(events.filter(e=>e.key===ASSESS).every(e=>e.source==='local'),'Originating writes are distinguished from external restore notifications');
 }
 {
  const b=backend();b.records[KEY]={revision:1,value:{position:1}};const f=fixture(b);await f.api.ready;f.failWrites=true;f.api.storage.setItem(KEY,JSON.stringify({position:2}));f.api.storage.setItem(KEY,JSON.stringify({position:3}));await until(()=>b.records[KEY].value.position===3);
  check(JSON.parse(f.api.storage.getItem(KEY)).position===3,'Readable old disk data cannot replace newer memory progress after a cache write failure');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;f.api.storage.setItem(KEY,JSON.stringify({position:99}));b.user='agent-b';await until(()=>!f.api.canWrite());
  check(!b.writes&&b.posts[0].value.position===99,'A changed authenticated cookie is rejected through the captured X-AMG-User identity assertion');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;f.api.storage.setItem(KEY,JSON.stringify({position:7}));f.emit('storage',{key:'amg-account-session-change',newValue:JSON.stringify({type:'logout',userId:'agent-a'})});await wait(380);
  check(!f.api.canWrite()&&!b.writes,'A cross-tab signout stops queued writes and freezes the old account page');
 }
 {
  const b=backend();let release;b.getHook=()=>new Promise(r=>release=r);const f=fixture(b);await until(()=>release);f.emit('storage',{key:'amg-account-session-change',newValue:JSON.stringify({type:'logout'})});release(response(200,{user:{id:'agent-a'},records:{[KEY]:{value:{position:12},revision:1}}}));
  check(await f.api.ready===null&&!f.store.has('amg-user:agent-a:'+KEY),'A late hydration response after signout cannot restore the previous user');
 }
 {
  const b=backend();b.getHook=async()=>response(200,{user:{id:b.user},records:{},reporting:{status:'pending',retryAfterMs:120000}});const f=fixture(b);await f.api.ready;
  check(f.scheduledDelays.includes(120000),'Coordinator reporting retry honors the server-advertised delay');
 }
 {
  const b=backend();b.accessStage='profile';const f=fixture(b);await f.api.ready;
  check(!f.api.canWrite()&&f.redirects[0].startsWith('/login/?next=')&&!b.posts.length,'A code-only gate redirects to learner entry before any progress read or write');
 }
 {
  const b=backend();b.accessUser='prior-learner';const f=fixture(b);await f.api.ready;
  check(!f.api.canWrite()&&!f.store.has('amg-user:agent-a:'+KEY),'A learner change between access and learning responses cannot hydrate a mixed session');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;
  f.emit('storage',{key:'amg-account-session-change',newValue:JSON.stringify({type:'active',userId:'agent-b'})});
  check(!f.api.canWrite(),'Entry under another email freezes the previous learner tab');
 }
 {
  const b=backend(),f=fixture(b);await f.api.ready;
  const control=f.body.children[0].children.find(x=>x.tagName==='BUTTON');await control.handlers.click();
  check(b.accessCalls.some(x=>x?.action==='logout')&&!f.api.canWrite()&&f.redirects[0].startsWith('/login/'),'Leave course clears the server learner session before returning to entry');
 }
 const result={reviewedAt:new Date().toISOString(),status:'passed',sourceSha256:createHash('sha256').update(source).digest('hex'),checks,scope:'Isolated adapter behavioral tests with fake learner-session API/DOM. Tests concurrency ordering, pending payload retention and user scoping; browser/runtime and real server-cookie integration are separate.'};
 fs.mkdirSync('output/qa',{recursive:true});fs.writeFileSync('output/qa/account-adapter-unit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:checks.length,sourceSha256:result.sourceSha256}));
} finally {for(const f of fixtures)f.close();}
