import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourseUser } from '../netlify/shared/course-user.ts';
import courseAccess from '../netlify/edge-functions/course-access.ts';
import { createLearningHandler } from '../netlify/functions/_shared/learning-service.mjs';

const CANONICAL = 'https://amg-exam-portal.netlify.app/.netlify/identity/user';
const PREVIEW = 'https://1234567890abcdef12345678--amg-exam-portal.netlify.app';
const UID = 'verified-agent-001';
const normalProfile = () => ({ id: UID, email: 'agent@example.test', confirmed_at: '2026-09-13T12:00:00Z', user_metadata: { full_name: 'Full Profile Name' }, app_metadata: { roles: ['amg-agent'] } });
function setup(t, options = {}) {
  const previous = { fetch: globalThis.fetch, identity: globalThis.netlifyIdentityContext, netlify: globalThis.Netlify, setTimeout: globalThis.setTimeout };
  const calls = [];
  globalThis.Netlify = { context: { url: new URL(PREVIEW), cookies: { get: key => key === 'nf_jwt' ? 'actual-session-token' : null } } };
  globalThis.netlifyIdentityContext = { url: 'https://operator.identity.example.test', token: 'operator-token', ...(options.noClaims ? {} : { user: { sub: UID, email: 'old-claims@example.test', app_metadata: { roles: ['amg-agent'] }, user_metadata: { full_name: 'Old Claims Name' } } }) };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), bearer: init.headers?.Authorization, redirect: init.redirect, signal: init.signal });
    if (String(url) === 'https://operator.identity.example.test/user') {
      assert.equal(init.headers.Authorization, 'Bearer operator-token');
      return new Response('{}', { status: 403 });
    }
    assert.equal(String(url), CANONICAL, 'Profile lookup must use only the fixed canonical Identity endpoint');
    assert.equal(init.headers.Authorization, 'Bearer actual-session-token');
    assert.equal(init.redirect, 'error');
    if (options.reject) throw new Error('simulated network/redirect failure');
    if (options.timeout) return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    return new Response(options.raw ?? JSON.stringify(options.profile || normalProfile()), { status: options.status || 200 });
  };
  if (options.timeout) globalThis.setTimeout = (callback, delay, ...args) => previous.setTimeout(callback, delay === 8000 ? 1 : delay, ...args);
  t.after(() => { globalThis.fetch = previous.fetch; globalThis.netlifyIdentityContext = previous.identity; globalThis.Netlify = previous.netlify; globalThis.setTimeout = previous.setTimeout; });
  return { calls, request: (cookie = 'nf_jwt=actual-session-token', path = '/course/lesson-01/') => new Request(PREVIEW + path, { headers: { Cookie: cookie } }) };
}

test('real SDK operator-token fallback hydrates same verified uid with request cookie and canonical profile', async t => {
  const s = setup(t), user = await getCourseUser(s.request());
  assert.equal(user.id, UID); assert.equal(user.confirmedAt, normalProfile().confirmed_at);
  assert.equal(user.email, 'agent@example.test'); assert.equal(user.name, 'Full Profile Name'); assert.deepEqual(user.roles, ['amg-agent']);
  assert.equal(s.calls.length, 2); assert.equal(s.calls[0].bearer, 'Bearer operator-token'); assert.equal(s.calls[1].bearer, 'Bearer actual-session-token');
  assert.equal(s.calls[1].url, CANONICAL); assert.equal(s.calls[1].redirect, 'error'); assert(s.calls[1].signal instanceof AbortSignal);
});

test('a canonical profile for another uid cannot upgrade SDK identity', async t => {
  const s = setup(t, { profile: { ...normalProfile(), id: 'different-user' } });
  assert.equal(await getCourseUser(s.request()), null);
});

test('no verified SDK uid means no canonical hydration, even with a session-like cookie', async t => {
  const s = setup(t, { noClaims: true }); assert.equal(await getCourseUser(s.request()), null); assert.equal(s.calls.length, 1);
});

test('missing/invalid-encoding/oversized request cookies cannot borrow the runtime operator token', async t => {
  const s = setup(t);
  for (const cookie of ['', 'nf_jwt=', 'nf_jwt=%ZZ', 'nf_jwt=' + 'x'.repeat(16385)]) assert.equal(await getCourseUser(s.request(cookie)), null);
  assert(s.calls.every(call => call.bearer === 'Bearer operator-token'));
});

test('a rejected actual session token fails closed despite verified-looking runtime claims', async t => {
  const s = setup(t, { status: 401 }); assert.equal(await getCourseUser(s.request()), null);
});

test('unconfirmed or malformed confirmed_at cannot become verified', async t => {
  const s = setup(t, { profile: { ...normalProfile(), confirmed_at: null } });
  assert.equal(await getCourseUser(s.request()), null);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => String(url) === CANONICAL ? Promise.resolve(new Response(JSON.stringify({ ...normalProfile(), confirmed_at: 'not-a-date' }))) : oldFetch(url, init);
  assert.equal(await getCourseUser(s.request()), null);
});

test('roles come from current verified profile, not stale JWT claims or user-supplied metadata', async t => {
  const s = setup(t, { profile: { ...normalProfile(), app_metadata: { roles: ['visitor'] }, user_metadata: { full_name: 'Current Name', roles: ['amg-agent'] } } });
  const user = await getCourseUser(s.request()); assert.deepEqual(user.roles, ['visitor']); assert.equal(user.name, 'Current Name');
  const response = await courseAccess(s.request(), { next: async () => assert.fail('Roleless access allowed') }); assert.equal(response.status, 302);
});

test('network or redirect errors cannot bypass confirmation checks', async t => {
  const s = setup(t, { reject: true }); assert.equal(await getCourseUser(s.request()), null);
});

test('bounded canonical verification aborts a hung Identity request and fails closed', async t => {
  const s = setup(t, { timeout: true }); assert.equal(await getCourseUser(s.request()), null); assert.equal(s.calls.at(-1).signal.aborted, true);
});

test('malformed/non-object/oversized profile responses are rejected', async t => {
  const s = setup(t); const originalFetch = globalThis.fetch;
  for (const raw of ['<html>sign in</html>', 'null', '[]', JSON.stringify({ ...normalProfile(), email: null }), JSON.stringify({ ...normalProfile(), filler: 'x'.repeat(65537) })]) {
    globalThis.fetch = (url, init) => String(url) === CANONICAL ? Promise.resolve(new Response(raw)) : originalFetch(url, init);
    assert.equal(await getCourseUser(s.request()), null);
  }
});

test('actual SDK fallback context now permits authorized Edge and learning API flows', async t => {
  const s = setup(t); let nextCalls = 0;
  const edge = await courseAccess(s.request(), { next: async () => { nextCalls++; return new Response('lesson'); } });
  assert.equal(edge.status, 200); assert.equal(nextCalls, 1); assert.equal(edge.headers.get('cache-control'), 'private, no-store');
  const learning = createLearningHandler({ getUser: getCourseUser, getStore: () => ({ getWithMetadata: async () => null }), appsScriptURL: () => '' });
  const result = await learning(s.request('nf_jwt=actual-session-token', '/api/learning'));
  assert.equal(result.status, 200); const body = await result.json(); assert.equal(body.user.id, UID); assert.deepEqual(body.records, {});
});

test('existing complete SDK profile avoids unnecessary canonical fetch', async t => {
  const s = setup(t);
  globalThis.fetch = async (url, init) => { assert.equal(String(url), 'https://operator.identity.example.test/user'); return new Response(JSON.stringify(normalProfile())); };
  const result = await getCourseUser(s.request()); assert.equal(result.id, UID); assert.equal(result.confirmedAt, normalProfile().confirmed_at);
});
