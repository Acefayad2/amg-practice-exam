import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('course navigation presents the two producer programs and no generic Course tab', () => {
  const ui = read('scripts/course-ui.mjs')
  assert.match(ui, />Life Producer</)
  assert.match(ui, />Health &amp; Sickness</)
  assert.match(ui, /href="\/course\/health\/"/)
  assert.doesNotMatch(ui, /<span>Course<\/span>/)
  assert.doesNotMatch(ui, /<span>Practice tests<\/span>/)
})

test('Health stays inside the new portal design with real resources and honest coming-soon video state', () => {
  const build = read('scripts/build-health-course.mjs')
  const client = read('src/course/health.js')
  assert.match(build, /courseHeader\('health'\)/)
  assert.match(build, /Coming soon|not published/)
  assert.match(build, /healthQuestions/)
  assert.match(client, /Start Practice Test/)
  assert.match(client, /Accident%20%26%20Health%20Study%20Guide\.docx/)
  assert.match(client, /Your first response is locked/)
  assert.match(client, /correct>=HEALTH_PASS_COUNT/)
  assert.match(client, /account\.commitSnapshot\(HEALTH_PROGRESS_KEY/)
  assert.match(client, /Resume Practice Test/)
  assert.match(client, /event\.source==='external'/)
  assert.match(build, /course\/shared\/account\.js/)
  assert.match(build, /body class="account-loading"/)
  assert.doesNotMatch(build, /<script src="health\.js"/)
  assert.doesNotMatch(client, /video src|youtube|vimeo/i)
})

test('Life assessment reveals feedback after a locked first response and keeps automatic sync truthful', () => {
  const assessment = read('public/course/assessments/assessment.js')
  const account = read('src/course/account.js')
  assert.match(assessment, /a\.answers\[a\.current\]!==null/)
  assert.match(assessment, /Correct answer:/)
  assert.match(assessment, /first selection is locked/)
  assert.doesNotMatch(assessment, /Clear answer/)
  assert.doesNotMatch(account, /Retry sync/)
  assert.match(account, /window\.addEventListener\('online'/)
  assert.match(account, /Math\.min\(30000,2000 \* 2 \*\*/)
  assert.doesNotMatch(account, /reporting\?\.status === 'not_configured'/)
  assert.match(account, /Progress sync is pending/)
  assert.match(account, /markConflict/)
})
