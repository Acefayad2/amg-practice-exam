/* AMG Learning reporting. Bound to the existing AMG Practice Exam Results workbook.
 * Course records are fetched from the authenticated learning API, never trusted
 * from an arbitrary browser payload. Existing Sheet1 history is left untouched.
 */
var AMG_SHEET_ID = '1WDRXIE0B0O6D8IeZ2k2XwjMO6R9gwKtxekKJIISHJPw';
var AMG_SITE = 'https://amg-exam-portal.netlify.app';
var AMG_REPORT_VERSION = 1;

function doGet() {
  return json_({ok: true, service: 'AMG Learning reporting', version: AMG_REPORT_VERSION});
}

function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 24000) throw new Error('Invalid request.');
    var data = JSON.parse(e.postData.contents);
    if (data.action !== 'course_sync') throw new Error('Use the signed-in AMG course to record results.');
    var token = data.identityAccessToken;
    if (typeof token !== 'string' || token.length < 20 || token.length > 16000 || !/^[A-Za-z0-9_.-]+$/.test(token)) throw new Error('Sign in again.');
    var response = UrlFetchApp.fetch(AMG_SITE + '/api/learning?report=1', {
      method: 'get', headers: {Cookie: 'nf_jwt=' + token, Authorization: 'Bearer ' + token},
      muteHttpExceptions: true, followRedirects: false
    });
    if (response.getResponseCode() !== 200) throw new Error('Your course session could not be verified.');
    var report = JSON.parse(response.getContentText());
    validateReport_(report);
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) throw new Error('Reporting is busy. Please retry.');
    try {
      var book = SpreadsheetApp.openById(AMG_SHEET_ID);
      var syncedAt = new Date().toISOString();
      syncReport_(book, report, syncedAt);
      SpreadsheetApp.flush();
      return json_({ok: true, syncedAt: syncedAt, version: AMG_REPORT_VERSION});
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json_({ok: false, error: String(err.message || 'Reporting failed.').slice(0,180)});
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function safe_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  var text = String(value).slice(0,2000);
  return /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
}
function percent_(value) { return typeof value === 'number' && isFinite(value) ? value / 100 : ''; }
function validateReport_(report) {
  var s = report && report.summary;
  if (!s || typeof s.uid !== 'string' || !/^[A-Za-z0-9-]{12,100}$/.test(s.uid) || typeof s.email !== 'string' || !s.email.includes('@')) throw new Error('Invalid account report.');
  if (s.totalLessons !== 60 || !Number.isInteger(s.completedLessons) || s.completedLessons < 0 || s.completedLessons > 60) throw new Error('Invalid course summary.');
  if (!Array.isArray(report.lessons) || report.lessons.length > 60 || !Array.isArray(report.attempts) || report.attempts.length > 1000) throw new Error('Invalid course records.');
}
function tab_(book, name, headers, percentColumns) {
  var sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#f1f3f4').setFontColor('#202124').setWrap(true).setVerticalAlignment('middle');
    sheet.setRowHeight(1,44);
    sheet.setColumnWidths(1,headers.length,140);
    sheet.setColumnWidth(1,190);
    sheet.setColumnWidth(2,230);
    sheet.hideColumns(headers.length);
    (percentColumns || []).forEach(function(column) {sheet.getRange(2,column,sheet.getMaxRows()-1,1).setNumberFormat('0%');});
  }
  var actual = sheet.getRange(1,1,1,headers.length).getValues()[0];
  if (JSON.stringify(actual) !== JSON.stringify(headers)) throw new Error(name + ' headers changed. Contact your coordinator.');
  return sheet;
}
function upsert_(sheet, rows, columns) {
  var last = sheet.getLastRow();
  var keys = last > 1 ? sheet.getRange(2,columns,last-1,1).getValues() : [];
  var index = {};
  keys.forEach(function(row, i) { if (row[0]) index[row[0]] = i+2; });
  var additions = [];
  rows.forEach(function(row) {
    var key = row[columns-1];
    var safeRow = row.map(safe_);
    if (index[key]) sheet.getRange(index[key],1,1,columns).setValues([safeRow]);
    else { index[key] = last + additions.length + 1; additions.push(safeRow); }
  });
  if (additions.length) {
    var required = last + additions.length;
    if (required > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),required-sheet.getMaxRows());
    sheet.getRange(last+1,1,additions.length,columns).setValues(additions);
  }
  var filter = sheet.getFilter();
  if (!filter) sheet.getRange(1,1,sheet.getMaxRows(),columns-1).createFilter();
  else if (filter.getRange().getLastRow() < sheet.getLastRow()) {
    var criteria = [];
    for (var c = 1; c < columns; c++) criteria[c] = filter.getColumnFilterCriteria(c);
    filter.remove();
    var resized = sheet.getRange(1,1,sheet.getMaxRows(),columns-1).createFilter();
    for (var column = 1; column < columns; column++) if (criteria[column]) resized.setColumnFilterCriteria(column,criteria[column]);
  }
}
function syncReport_(book, report, syncedAt) {
  var s = report.summary;
  var summaryHeaders = ['Agent','Email','Lessons complete','Total lessons','Course progress','Questions mastered','Current lesson','Last activity (UTC)','Course completed (UTC)','Diagnostic score','Best timed score','Latest timed score','Practice attempts','Reported at (UTC)','Account ID'];
  var summary = tab_(book,'Course Progress',summaryHeaders,[5,6,10,11,12]);
  upsert_(summary,[[s.name,s.email,s.completedLessons,60,percent_(s.progressPercent),percent_(s.questionMastery),s.currentLesson,s.lastActiveAt,s.courseCompletedAt,percent_(s.diagnosticScore),percent_(s.bestMockScore),percent_(s.latestMockScore),s.practiceAttempts,syncedAt,s.uid]],summaryHeaders.length);
  var lessonHeaders = ['Agent','Email','Lesson','Title','Status','Questions correct','Required questions','First answers correct','First answers given','Resume position (seconds)','Last activity (UTC)','Completed at (UTC)','Record ID'];
  var lessons = tab_(book,'Lesson Progress',lessonHeaders,[]);
  lessons.setColumnWidth(4,310);
  var lessonRows = report.lessons.map(function(l) {
    return [s.name,s.email,l.lessonId,l.title,l.complete ? 'Complete' : (l.firstAnswered || l.position || l.lastActiveAt ? 'In progress' : 'Not started'),l.correct,l.total,l.firstCorrect,l.firstAnswered,Math.floor(l.position || 0),l.lastActiveAt,l.completedAt,s.uid+'|'+l.lessonId];
  });
  upsert_(lessons,lessonRows,lessonHeaders.length);
  var attemptHeaders = ['Agent','Email','Practice test','Started at (UTC)','Submitted at (UTC)','Correct (scored)','Total (scored)','Score','Correct (simulation)','Total (simulation)','Time expired','Fresh questions','Record ID'];
  var attempts = tab_(book,'Practice Tests',attemptHeaders,[8]);
  attempts.setColumnWidth(3,230);
  var attemptRows = report.attempts.map(function(a) {
    return [s.name,s.email,a.title,a.startedAt,a.submittedAt,a.correct,a.total,percent_(a.percentage),a.unscoredCorrect,a.unscoredTotal,a.expired ? 'Yes' : 'No',a.fresh ? 'Yes' : 'No',s.uid+'|'+a.attemptId];
  });
  upsert_(attempts,attemptRows,attemptHeaders.length);
}

// Run once in the Apps Script editor to authorize and prepare only the new tabs.
function setupCourseReporting() {
  var book = SpreadsheetApp.openById(AMG_SHEET_ID);
  var response = UrlFetchApp.fetch(AMG_SITE + '/.netlify/identity/settings', {muteHttpExceptions:true});
  if (response.getResponseCode() !== 200) throw new Error('AMG account service is unavailable.');
  tab_(book,'Course Progress',['Agent','Email','Lessons complete','Total lessons','Course progress','Questions mastered','Current lesson','Last activity (UTC)','Course completed (UTC)','Diagnostic score','Best timed score','Latest timed score','Practice attempts','Reported at (UTC)','Account ID'],[5,6,10,11,12]);
  tab_(book,'Lesson Progress',['Agent','Email','Lesson','Title','Status','Questions correct','Required questions','First answers correct','First answers given','Resume position (seconds)','Last activity (UTC)','Completed at (UTC)','Record ID'],[]);
  tab_(book,'Practice Tests',['Agent','Email','Practice test','Started at (UTC)','Submitted at (UTC)','Correct (scored)','Total (scored)','Score','Correct (simulation)','Total (simulation)','Time expired','Fresh questions','Record ID'],[8]);
}
