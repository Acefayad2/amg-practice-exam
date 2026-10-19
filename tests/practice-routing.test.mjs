import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { healthQuestions } from '../src/data/healthQuestions.js'
import { PRACTICE_ROUTES, practiceRoutesFor, routeForLocation } from '../src/practiceRoutes.js'

test('stable practice routes keep Life protected paths and Health resources distinct', () => {
  assert.equal(PRACTICE_ROUTES.health, '/health/')
  assert.equal(PRACTICE_ROUTES.healthGuide, '/Accident%20%26%20Health%20Study%20Guide.docx')
  assert.equal(PRACTICE_ROUTES.lifeCourse, '/course/')
  assert.equal(PRACTICE_ROUTES.lifeExams, '/course/assessments/')
  assert.equal(PRACTICE_ROUTES.lifeGuide, '/Life%20Producer%20Study%20Guide.docx')
  assert.equal(routeForLocation('/'), 'home')
  assert.equal(routeForLocation('/health'), 'health')
  assert.equal(routeForLocation('/health/'), 'health')
  assert.equal(routeForLocation('/practice/'), 'home')
  assert.equal(routeForLocation('/practice/health'), 'health')
  assert.equal(routeForLocation('/practice/health/'), 'health')
  assert.equal(routeForLocation('/', '#confirmation_token=synthetic'), 'login-callback')
})

test('mounted practice routes keep reload, Back/Forward, guides and protected Life coherent', () => {
  const mounted = practiceRoutesFor('/practice/health/')
  assert.equal(mounted.home, '/practice/')
  assert.equal(mounted.health, '/practice/health/')
  assert.equal(mounted.healthGuide, '/guides/accident-health.docx')
  assert.equal(mounted.lifeGuide, '/guides/life-producer.docx')
  assert.equal(mounted.lifeCourse, '/course/')
  assert.equal(mounted.lifeExams, '/course/assessments/')
  assert.equal(routeForLocation(mounted.home), 'home')
  assert.equal(routeForLocation(mounted.health), 'health')
  assert.equal(practiceRoutesFor('/').home, '/')
})

test('the restored Health exam retains 90 complete questions and its guide asset', () => {
  assert.equal(healthQuestions.length, 90)
  for (const [index, question] of healthQuestions.entries()) {
    assert.equal(question.n, index + 1)
    assert.equal(question.choices.length, 4)
    assert.match(question.answer, /^[A-D]$/)
    assert.ok(question.choices.some(choice => choice.startsWith(`${question.answer})`)))
    assert.ok(question.explanation.length > 20)
  }
  assert.ok(fs.statSync(new URL('../public/Accident & Health Study Guide.docx', import.meta.url)).size > 0)
})

test('the root app restores Health without bypassing the Life course entry points', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const home = fs.readFileSync(new URL('../src/components/HomeScreen.jsx', import.meta.url), 'utf8')
  const registration = fs.readFileSync(new URL('../src/components/RegisterScreen.jsx', import.meta.url), 'utf8')
  assert.match(app, /healthQuestions/)
  assert.doesNotMatch(app, /location\.replace\('\/course\/'\)/)
  assert.match(home, /routes\.lifeCourse/)
  assert.match(home, /routes\.lifeExams/)
  assert.match(home, /routes\.healthGuide/)
  assert.match(home, /Start Health Practice Exam/)
  assert.match(registration, /does not confirm that it was saved/)
  assert.match(registration, /progress resets if you reload/)
  assert.doesNotMatch(registration, /score gets recorded/)
})
