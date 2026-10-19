import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { healthQuestions } from '../src/data/healthQuestions.js'
import { healthQuestionsForAttempt } from '../src/healthQuestionRotation.js'
import { PRACTICE_ROUTES, practiceRoutesFor, routeForLocation } from '../src/practiceRoutes.js'

test('stable practice routes keep Life protected paths and Health resources distinct', () => {
  assert.equal(PRACTICE_ROUTES.health, '/course/health/')
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
  assert.equal(mounted.health, '/course/health/')
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

test('Health question order is stable per attempt, rotates on a new attempt and preserves mappings', () => {
  const first = healthQuestionsForAttempt(healthQuestions, 0)
  const firstAgain = healthQuestionsForAttempt(healthQuestions, 0)
  const second = healthQuestionsForAttempt(healthQuestions, 1)

  assert.deepEqual(first.map(question => question.n), firstAgain.map(question => question.n))
  assert.notDeepEqual(first.map(question => question.n), second.map(question => question.n))
  for (const order of [first, second]) {
    assert.equal(order.length, healthQuestions.length)
    assert.equal(new Set(order).size, healthQuestions.length)
    for (const question of order) {
      const original = healthQuestions.find(candidate => candidate.n === question.n)
      assert.strictEqual(question, original)
      assert.equal(question.answer, original.answer)
      assert.equal(question.explanation, original.explanation)
      assert.deepEqual(question.choices, original.choices)
    }
  }
})

test('the legacy root app routes into the unified protected producer portal', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.match(app, /'\/course\/health\/'/)
  assert.match(app, /'\/course\/'/)
  assert.doesNotMatch(app, /RegisterScreen|Health Practice Exam|healthQuestions/)
})
