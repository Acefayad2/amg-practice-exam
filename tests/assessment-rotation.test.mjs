import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../public/course/assessments/assessment-rotation.js', import.meta.url), 'utf8')
const context = { window: {} }
vm.runInNewContext(source, context)
const { nextPracticeForm, practiceForms } = context.window.AMG_ASSESSMENT_ROTATION
const forms = [
  { id: 'D', questions: Array(32) },
  { id: 'A', questions: Array(90) },
  { id: 'B', questions: Array(90) },
  { id: 'C', questions: Array(90) },
]

test('one Practice Test rotates across balanced sets for each new attempt', () => {
  assert.deepEqual(Array.from(practiceForms(forms), form => form.id), ['A', 'B', 'C'])
  assert.equal(nextPracticeForm(forms, []).id, 'A')
  assert.equal(nextPracticeForm(forms, [{ form: 'A', submittedAt: 1 }]).id, 'B')
  assert.equal(nextPracticeForm(forms, [{ form: 'A', submittedAt: 1 }, { form: 'B', submittedAt: 2 }]).id, 'C')
  assert.equal(nextPracticeForm(forms, [{ form: 'A', submittedAt: 1 }, { form: 'B', submittedAt: 2 }, { form: 'C', submittedAt: 3 }]).id, 'A')
})

test('an in-progress attempt keeps its stored question set and old diagnostic records are ignored', () => {
  const attempts = [{ form: 'D', submittedAt: 1 }, { form: 'A', submittedAt: 2 }, { form: 'B', submittedAt: null }]
  assert.equal(nextPracticeForm(forms, attempts).id, 'B')
  assert.equal(nextPracticeForm(forms, attempts).id, 'B')
  assert.deepEqual(attempts, [{ form: 'D', submittedAt: 1 }, { form: 'A', submittedAt: 2 }, { form: 'B', submittedAt: null }])
})

test('learner-facing assessment UI does not expose internal form choices', () => {
  const assessment = fs.readFileSync(new URL('../public/course/assessments/assessment.js', import.meta.url), 'utf8')
  const page = fs.readFileSync(new URL('../public/course/assessments/index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(assessment, /'Form '\+f\.id/)
  assert.doesNotMatch(assessment, /Start diagnostic|Retake test|Start test/)
  assert.match(assessment, /Life Practice Test/)
  assert.match(page, /Practice Test/)
})
