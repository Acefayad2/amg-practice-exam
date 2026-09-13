import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Actual Apps Script source, with all Google services replaced by in-memory fakes.
// This test never contacts Google, Netlify, a session service or the real workbook.
const tabs = new Map(), checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
function makeSheet(name) {
  const rows = [], sheet = {name,rows,filter:null,getLastRow:()=>rows.length,getMaxRows:()=>1000,
    getRange(row,column,height=1,width=1) {
      const range = {setValues(values){values.forEach((value,i)=>{ rows[row+i-1] ||= []; value.forEach((v,j)=>rows[row+i-1][column+j-1]=v); });return range;},getValues(){return Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[column+j-1]??''));},getLastRow:()=>row+height-1,createFilter(){sheet.filter={getRange:()=>range};return sheet.filter;}};
      for (const method of ['setFontWeight','setBackground','setFontColor','setWrap','setVerticalAlignment','setNumberFormat']) range[method]=()=>range;
      return range;
    }, getFilter:()=>sheet.filter};
  for (const method of ['setFrozenRows','setFrozenColumns','setRowHeight','setColumnWidths','setColumnWidth','hideColumns','insertRowsAfter']) sheet[method]=()=>sheet;
  tabs.set(name,sheet);return sheet;
}
const legacy=makeSheet('Sheet1');legacy.rows.push(['Original','History']);
let report,fetchStatus=200,lockAvailable=true;
const fetchLog=[],book={getSheetByName:name=>tabs.get(name),insertSheet:makeSheet};
const context=vm.createContext({console,Number,JSON,Date,isFinite,
  ContentService:{MimeType:{JSON:'json'},createTextOutput(text){return{setMimeType(){return{text};}};}},
  SpreadsheetApp:{openById(id){assert.equal(id,'1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw');return book;},flush(){}},
  UrlFetchApp:{fetch(url,options){
    assert.equal(url,'https://amg-exam-portal.netlify.app/api/learning?report=1');
    assert.equal(options.method,'get');assert.equal(options.followRedirects,false);
    fetchLog.push({url,options});
    return{getResponseCode:()=>fetchStatus,getContentText:()=>JSON.stringify(report)};
  }},
  LockService:{getScriptLock:()=>({tryLock:()=>lockAvailable,releaseLock(){}})}
});
vm.runInContext(fs.readFileSync('scripts/google-sheets/Code.gs','utf8'),context);
const send=data=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(data)}}).text);
const request={action:'course_sync',sessionToken:'a'.repeat(64)+'.'+'b'.repeat(43)};
const unchanged=()=>assert.deepEqual([...tabs].map(([name,s])=>[name,s.rows]),[['Sheet1',[['Original','History']]]]);
check('Version2 handshake uses the fixed AMG service name',()=>assert.deepEqual(JSON.parse(context.doGet().text),{ok:true,service:'AMG Learning reporting',version:2}));
check('Only the exact shared-course session envelope is accepted',()=>{
  for(const value of [null,[],{}, {action:'arbitrary',name:'Forged'}, {action:'course_sync',identityAccessToken:request.sessionToken}, {...request,summary:{completedLessons:60}}, {...request,sessionToken:'short'}, {...request,sessionToken:'.signature'}, {...request,sessionToken:'payload.'}, {...request,sessionToken:'a.b.c'}, {...request,sessionToken:'a=.b'}, {...request,sessionToken:'a'.repeat(4094)+'.bb'}, {...request,sessionToken:'a'.repeat(30)+'; other=1'}, {...request,sessionToken:'a'.repeat(30)+'\r\nAuthorization: forged'}]) assert.equal(send(value).ok,false);
  assert.equal(fetchLog.length,0);unchanged();
});
check('Unauthenticated, redirected and failed report responses cannot write rows',()=>{
  for(const status of [401,302,500]){fetchStatus=status;assert.equal(send(request).ok,false);unchanged();}
});
check('Session is forwarded only in the protected cookie to the canonical report URL',()=>{
  for(const {options} of fetchLog) assert.deepEqual(JSON.parse(JSON.stringify(options.headers)),{Cookie:'__Host-amg_session='+request.sessionToken});
});
fetchStatus=200;
report={summary:{uid:'a'.repeat(64),name:'=HYPERLINK("x")',email:'qa@example.invalid',completedLessons:1,totalLessons:60,progressPercent:1.667,questionMastery:1.563,currentLesson:'01',lastActiveAt:'2026-09-13T03:00:00Z',courseCompletedAt:null,diagnosticScore:null,bestMockScore:85,latestMockScore:85,practiceAttempts:1},lessons:[{lessonId:'01',title:'Risk, perils and hazards',complete:true,completedAt:'2026-09-13T03:00:00Z',correct:8,total:8,firstCorrect:7,firstAnswered:8,position:250.9,lastActiveAt:'2026-09-13T03:00:00Z'}],attempts:[{attemptId:'attempt-1',formId:'A',title:'Timed Form A',startedAt:'2026-09-13T02:00:00Z',submittedAt:'2026-09-13T03:00:00Z',expired:false,fresh:true,correct:68,total:80,percentage:85,unscoredCorrect:9,unscoredTotal:10}]};
check('Invalid authoritative report structure is rejected before any sheet write',()=>{
  const good=report;report={summary:{...good.summary,totalLessons:59},lessons:[],attempts:[]};assert.equal(send(request).ok,false);unchanged();report=good;
});
check('A busy reporting lock leaves all sheets unchanged',()=>{lockAvailable=false;assert.equal(send(request).ok,false);unchanged();lockAvailable=true;});
check('Setup probes protected reporting without a cookie and creates headers only',()=>{
  fetchStatus=401;context.setupCourseReporting();assert.equal(fetchLog.at(-1).options.headers,undefined);
  assert.equal(tabs.size,4);for(const name of ['Course Progress','Lesson Progress','Practice Tests'])assert.equal(tabs.get(name).rows.length,1);
  assert.equal(tabs.get('Course Progress').rows[0].at(-1),'Account ID','Existing hidden schema remains compatible.');fetchStatus=200;
});
check('Version2 acknowledgement follows a successful authoritative report',()=>{
  const result=send(request);assert.equal(result.ok,true);assert.equal(result.version,2);assert.ok(Number.isFinite(Date.parse(result.syncedAt)));
});
check('Metrics and learner grouping come from the server report',()=>{
  const row=tabs.get('Course Progress').rows[1];assert.equal(row[2],1);assert.equal(row[14],report.summary.uid);assert.equal(row[1],'qa@example.invalid');
});
check('Formula-like text is escaped and ordinary values remain intact',()=>{
  assert.equal(tabs.get('Course Progress').rows[1][0],"'=HYPERLINK(\"x\")");
  for(const text of ['=1+1','+1','-1','@SUM(A1)','\tformula','\rformula'])assert.equal(context.safe_(text),"'"+text);
  assert.equal(context.safe_('Ordinary name'),'Ordinary name');assert.equal(context.safe_(12),12);assert.equal(context.safe_(true),true);
});
check('Missing scores remain blank and scored results exclude simulation items',()=>{
  assert.equal(tabs.get('Course Progress').rows[1][9],'');
  const row=tabs.get('Practice Tests').rows[1];assert.equal(row[5],68);assert.equal(row[6],80);assert.equal(row[7],0.85);assert.equal(row[8],9);assert.equal(row[9],10);
  assert.equal(tabs.get('Lesson Progress').rows[1][9],250);
});
check('Retry upserts do not duplicate a learner, lesson or submitted attempt',()=>{
  assert.equal(send(request).ok,true);for(const name of ['Course Progress','Lesson Progress','Practice Tests'])assert.equal(tabs.get(name).rows.length,2);
});
check('Later authoritative values update the existing learner key',()=>{
  report.summary.name='Updated self-reported name';report.summary.completedLessons=2;assert.equal(send(request).ok,true);
  assert.equal(tabs.get('Course Progress').rows.length,2);assert.equal(tabs.get('Course Progress').rows[1][0],report.summary.name);assert.equal(tabs.get('Course Progress').rows[1][2],2);
});
check('Different server learner keys create separate reporting rows',()=>{
  report.summary.uid='b'.repeat(64);report.summary.email='other@example.invalid';assert.equal(send(request).ok,true);
  for(const name of ['Course Progress','Lesson Progress','Practice Tests'])assert.equal(tabs.get(name).rows.length,3);
});
check('Setup refuses an unexpectedly public report endpoint',()=>{fetchStatus=200;assert.throws(()=>context.setupCourseReporting(),/protection/);});
check('Changed coordinator headers are never silently overwritten',()=>{
  tabs.get('Course Progress').rows[0][0]='Coordinator changed header';assert.equal(send(request).ok,false);assert.equal(tabs.get('Course Progress').rows[0][0],'Coordinator changed header');
});
check('Historical Sheet1 data remains untouched',()=>assert.deepEqual(legacy.rows,[['Original','History']]));
console.log(JSON.stringify({status:'passed',checks:checks.length,groups:checks,scope:'Actual Apps Script source with in-memory Google services only; no real session or spreadsheet calls.'}));
