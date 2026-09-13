import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const tabs = new Map();
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
let fetches=0,report,fetchStatus=200;
const book={getSheetByName:name=>tabs.get(name),insertSheet:makeSheet};
const context=vm.createContext({console,Number,JSON,Date,isFinite,
  ContentService:{MimeType:{JSON:'json'},createTextOutput(text){return{setMimeType(){return{text};}};}},
  SpreadsheetApp:{openById(id){assert.equal(id,'1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw');return book;},flush(){}},
  UrlFetchApp:{fetch(url,options){fetches++;assert.equal(url,'https://amg-exam-portal.netlify.app/api/learning?report=1');assert.match(options.headers.Cookie,/^nf_jwt=/);assert.equal(options.followRedirects,false);return{getResponseCode:()=>fetchStatus,getContentText:()=>JSON.stringify(report)};}},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}
});
vm.runInContext(fs.readFileSync('scripts/google-sheets/Code.gs','utf8'),context);
const send=data=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(data)}}).text);
assert.equal(send({action:'arbitrary',name:'Forged'}).ok,false);assert.equal(fetches,0);
assert.equal(send({action:'course_sync',identityAccessToken:'bad'}).ok,false);assert.equal(fetches,0);
const request={action:'course_sync',identityAccessToken:'a'.repeat(30),summary:{completedLessons:60}};
fetchStatus=401;assert.equal(send(request).ok,false);assert.equal(tabs.size,1);
fetchStatus=200;
report={summary:{uid:'12345678-abcd-1234-abcd-123456789012',name:'=HYPERLINK("x")',email:'qa@example.invalid',completedLessons:1,totalLessons:60,progressPercent:1.667,questionMastery:1.563,currentLesson:'01',lastActiveAt:'2026-09-13T03:00:00Z',courseCompletedAt:null,diagnosticScore:null,bestMockScore:85,latestMockScore:85,practiceAttempts:1},lessons:[{lessonId:'01',title:'Risk, perils and hazards',complete:true,completedAt:'2026-09-13T03:00:00Z',correct:8,total:8,firstCorrect:7,firstAnswered:8,position:250,lastActiveAt:'2026-09-13T03:00:00Z'}],attempts:[{attemptId:'attempt-1',formId:'A',title:'Timed Form A',startedAt:'2026-09-13T02:00:00Z',submittedAt:'2026-09-13T03:00:00Z',expired:false,fresh:true,correct:68,total:80,percentage:85,unscoredCorrect:9,unscoredTotal:10}]};
assert.equal(send(request).ok,true);
assert.equal(tabs.get('Course Progress').rows.length,2);
assert.equal(tabs.get('Course Progress').rows[1][0],"'=HYPERLINK(\"x\")");
assert.equal(tabs.get('Course Progress').rows[1][2],1,'Uses server report, not forged submitted summary.');
assert.equal(tabs.get('Course Progress').rows[1][9],'','Missing score stays blank, not zero.');
assert.equal(tabs.get('Practice Tests').rows[1][6],80,'Timed score excludes simulation items.');
assert.equal(tabs.get('Practice Tests').rows[1][7],0.85);
assert.equal(send(request).ok,true);
for(const name of ['Course Progress','Lesson Progress','Practice Tests']) assert.equal(tabs.get(name).rows.length,2,'Retry does not duplicate '+name);
assert.deepEqual(legacy.rows,[['Original','History']]);
tabs.get('Course Progress').rows[0][0]='Coordinator changed header';
assert.equal(send(request).ok,false,'Unexpected user schema is not silently overwritten.');
console.log('Apps Script reporting tests passed: auth rejection, authoritative metrics, formula-safe text, original history, score denominator, retry upserts and schema guard.');
