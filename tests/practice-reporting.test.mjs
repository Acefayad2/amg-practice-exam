import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { submitPracticeResult } from '../src/practiceReporting.js'
const payload = { attemptId: 'b149adbd-95c7-4d77-949f-2183823ea00c', name: 'Synthetic learner', email: 'learner@example.invalid', examType: 'Accident & Health or Sickness Producer', score: 89, total: 90 }
test('reporting stays same-origin with acknowledged save and stable retry identity', async () => {
  const requests = []
  const fakeFetch = async (url, options) => { requests.push({url,options}); return {ok: true, json: async () => ({ok: true, id: payload.attemptId})} }
  await submitPracticeResult(payload, fakeFetch)
  await submitPracticeResult(payload, fakeFetch)
  assert.equal(requests.length, 2)
  for (const {url, options} of requests) {
    assert.equal(url, '/api/practice-results')
    assert.equal(options.credentials, 'same-origin')
    assert.equal(options.mode, undefined)
    assert.deepEqual(JSON.parse(options.body), payload)
  }
})
test('HTTP, JSON, application and network errors never report success', async () => {
  for (const fakeFetch of [
    async () => ({ok:false}),
    async () => ({ok:true, json:async()=>({ok:false})}),
    async () => ({ok:true, json:async()=>({})}),
    async () => ({ok:true, json:async()=>{throw new Error('malformed')}}),
    async () => {throw new Error('offline')},
  ]) await assert.rejects(submitPracticeResult(payload, fakeFetch))
})
test('client no longer accepts external reporting URL and exposes save retry', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url),'utf8')
  const result = fs.readFileSync(new URL('../src/components/ResultsScreen.jsx', import.meta.url),'utf8')
  assert(!app.includes('VITE_APPS_SCRIPT_URL'))
  assert(!app.includes('no-cors'))
  assert(app.includes('attemptId.current = crypto.randomUUID()'))
  assert(app.includes('reportInFlight.current'))
  assert(app.includes('beforeunload'))
  assert(result.includes('Retry saving result'))
  assert(result.includes("reportStatus === 'saved'"))
})
