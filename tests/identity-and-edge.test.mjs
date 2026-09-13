import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import identity from '../netlify/shared/identity-policy.ts';
import validationHook from '../netlify/functions/identity-validate.mts';
import signupHook from '../netlify/functions/identity-signup.mts';
import modificationHook from '../netlify/functions/identity-usermodified.mts';
import courseAccess, { config } from '../netlify/edge-functions/course-access.ts';

// Local tests only: fake registration code, Identity responses and session cookie.
// Lifecycle reference: https://docs.netlify.com/build/functions/trigger-on-events/
// https://docs.netlify.com/manage/security/secure-access-to-sites/identity/use-identity-in-functions/
// Hook metadata replacement: https://github.com/netlify/gotrue/blob/master/api/hooks.go
const CODE = 'local-test-only-code';
const SITE = 'https://amg.example.test';
const base = () => ({ id: 'test-agent-001', email: 'agent@example.test', userMetadata: { full_name: 'Test Agent', amg_access_code: CODE }, appMetadata: { provider: 'email', roles: [] } });
function event(user) { const result = { user, denied: false, deny() { this.denied = true; } }; return result; }
function environment(t, options = {}) {
  const beforeNetlify = globalThis.Netlify, beforeIdentity = globalThis.netlifyIdentityContext, beforeFetch = globalThis.fetch;
  const calls = [];
  globalThis.Netlify = { env: { get: name => name === 'AMG_REGISTRATION_CODE' ? options.code ?? CODE : undefined }, context: { url: new URL(SITE), cookies: { get: name => name === 'nf_jwt' && options.cookie !== false ? 'local-test-token' : null } } };
  delete globalThis.netlifyIdentityContext;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    assert.equal(String(url), SITE + '/.netlify/identity/user', 'SDK may only call mocked local Identity endpoint');
    assert.equal(init.headers.Authorization, 'Bearer local-test-token');
    if (options.fail) throw new Error('simulated identity outage');
    return new Response(JSON.stringify(options.rawUser || { id: 'test-agent-001', email: 'agent@example.test', confirmed_at: '2026-09-13T10:00:00Z', app_metadata: { roles: ['amg-agent'] }, user_metadata: { full_name: 'Test Agent' } }), { status: options.status || 200 });
  };
  t.after(() => { globalThis.Netlify = beforeNetlify; globalThis.netlifyIdentityContext = beforeIdentity; globalThis.fetch = beforeFetch; });
  return calls;
}

test('correct registration code grants one AMG role before confirmation, cleans the code, and preserves other metadata', t => {
  environment(t);
  const input = base(); input.appMetadata.roles = ['existing-role']; input.roles = ['existing-role']; input.userMetadata.department = 'Licensing'; input.appMetadata.team = 'AMG';
  const original = structuredClone(input), e = event(input), result = identity.userValidate(e);
  assert.equal(e.denied, false); assert.deepEqual(result.user.appMetadata.roles, ['existing-role', 'amg-agent']);
  assert.deepEqual(result.user.roles, result.user.appMetadata.roles, 'runtime serializes top-level roles last');
  assert.equal(result.user.confirmedAt, undefined, 'validation must never invent confirmation');
  assert.equal(result.user.userMetadata.amg_access_code, undefined); assert.equal(result.user.userMetadata.department, 'Licensing');
  assert.equal(result.user.appMetadata.team, 'AMG'); assert.deepEqual(input, original, 'the event input remains unchanged');
});

test('normalized empty roles cannot override the newly granted role during runtime serialization', t => {
  environment(t);
  for (const roles of [[], ['existing-role'], ['amg-agent']]) {
    const user = base(); user.roles = [...roles]; user.appMetadata.roles = [...roles];
    const result = identity.userValidate(event(user)).user;
    assert.deepEqual(result.roles, [...new Set([...roles, 'amg-agent'])]);
    assert.deepEqual(result.roles, result.appMetadata.roles);
  }
});

test('each supported filename exposes only its intended typed policy without a broad duplicate function', () => {
  assert.deepEqual(Object.keys(validationHook), ['userValidate']);
  assert.deepEqual(Object.keys(signupHook), ['userSignup']);
  assert.deepEqual(Object.keys(modificationHook), ['userModified']);
  assert.equal(fs.existsSync(new URL('../netlify/functions/identity.mts', import.meta.url)), false);
});

test('missing, wrong, blank, numeric and unicode lookalike codes are denied even if supplied user metadata claims a role', t => {
  environment(t);
  for (const code of [undefined, '', 'wrong', CODE + ' ', CODE.toUpperCase(), 42, 'local-test-only-codе']) {
    const user = base(); user.userMetadata.amg_access_code = code; user.userMetadata.roles = ['amg-agent'];
    const e = event(user); assert.equal(identity.userValidate(e), undefined); assert.equal(e.denied, true);
  }
});

test('missing environment code fails closed; blank/absent/overlong names cannot enroll', t => {
  environment(t, { code: '' }); const noConfig = event(base()); identity.userValidate(noConfig); assert.equal(noConfig.denied, true);
  globalThis.Netlify.env.get = () => CODE;
  for (const name of [undefined, '', '  ', 42, 'x'.repeat(121)]) { const user = base(); user.userMetadata.full_name = name; const e = event(user); identity.userValidate(e); assert.equal(e.denied, true); }
});

test('validate → persisted metadata → confirmed signup preserves authorization without retaining/requiring the registration secret', t => {
  environment(t);
  const validated = identity.userValidate(event(base())).user;
  // Netlify documents persisted validate mutations; signup follows confirmation.
  // The raw Identity API uses snake_case; the event adapter supplies camelCase.
  const confirmed = { ...structuredClone(validated), confirmedAt: '2026-09-13T10:00:00Z', roles: ['amg-agent'] };
  const e = event(confirmed), signedUp = identity.userSignup(e);
  assert.equal(e.denied, false); assert.equal(signedUp.user.confirmedAt, confirmed.confirmedAt);
  assert.deepEqual(signedUp.user.appMetadata.roles, ['amg-agent']); assert.equal(signedUp.user.userMetadata.amg_access_code, undefined);
  assert.deepEqual(signedUp.user.roles, signedUp.user.appMetadata.roles);
  const repeated = identity.userSignup(event(signedUp.user)); assert.deepEqual(repeated.user.appMetadata.roles, ['amg-agent']);
});

test('signup cannot acquire the AMG role solely from user-controlled metadata or the access code', t => {
  environment(t);
  for (const metadata of [{}, { roles: [] }, { roles: ['another-role'] }]) {
    const user = base(); user.appMetadata = metadata; user.userMetadata.roles = ['amg-agent'];
    const e = event(user); assert.equal(identity.userSignup(e), undefined); assert.equal(e.denied, true);
  }
});

test('profile edits remove a reintroduced registration code but never grant a missing role', t => {
  environment(t);
  for (const roles of [[], ['amg-agent'], ['coordinator', 'amg-agent']]) {
    const user = base(); user.appMetadata.roles = roles; user.userMetadata.roles = ['amg-agent'];
    const updated = identity.userModified(event(user)).user;
    assert.deepEqual(updated.appMetadata.roles, roles); assert.equal(updated.userMetadata.amg_access_code, undefined);
    assert.deepEqual(updated.roles, roles);
  }
});

test('actual Identity2 SDK converts confirmed_at/app_metadata roles and lets authorized users continue without caching', async t => {
  const calls = environment(t); let next = 0;
  const response = await courseAccess(new Request(SITE + '/course/lesson-01/'), { next: async () => { next++; return new Response('private lesson', { headers: { 'Cache-Control': 'public, max-age=3600' } }); } });
  assert.equal(response.status, 200); assert.equal(next, 1); assert.equal(calls.length, 1);
  assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(await response.text(), 'private lesson');
});

test('unconfirmed accounts cannot use an already granted AMG role to access lesson content', async t => {
  environment(t, { rawUser: { id: 'test-agent-001', email: 'agent@example.test', app_metadata: { roles: ['amg-agent'] } } });
  const response = await courseAccess(new Request(SITE + '/course/lesson-01/?review=1'), { next: async () => assert.fail('Unconfirmed content served') });
  assert.equal(response.status, 302); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const target = new URL(response.headers.get('location')); assert.equal(target.origin, SITE); assert.equal(target.pathname, '/login/'); assert.equal(target.searchParams.get('next'), '/course/lesson-01/?review=1');
});

test('confirmed accounts without the app-managed role cannot bypass course access with user metadata roles', async t => {
  environment(t, { rawUser: { id: 'test-agent-001', confirmed_at: '2026-09-13T10:00:00Z', app_metadata: { roles: ['visitor'] }, user_metadata: { roles: ['amg-agent'] } } });
  const response = await courseAccess(new Request(SITE + '/course/'), { next: async () => assert.fail('Roleless content served') });
  assert.equal(response.status, 302);
});

test('no session and SDK API-failure fallback cannot bypass email verification', async t => {
  environment(t, { cookie: false });
  const next = async () => assert.fail('Unauthenticated content served');
  assert.equal((await courseAccess(new Request(SITE + '/course/'), { next })).status, 302);
  globalThis.netlifyIdentityContext = { url: SITE + '/.netlify/identity', token: 'local-test-token', user: { sub: 'test-agent-001', email: 'agent@example.test', app_metadata: { roles: ['amg-agent'] } } };
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  assert.equal((await courseAccess(new Request(SITE + '/course/'), { next })).status, 302, 'JWT fallback lacks confirmedAt, so it must fail closed');
});

test('exact login styling/assets are public while course data, captions and similar prefix paths remain gated', async t => {
  const calls = environment(t, { cookie: false }); let next = 0;
  const context = { next: async () => { next++; return new Response('asset'); } };
  for (const path of ['/course/assets/amg-logo.png', '/course/shared/app.css', '/course/shared/account.css', '/course/shared/account.js', '/course/shared/login.js']) assert.equal((await courseAccess(new Request(SITE + path), context)).status, 200);
  assert.equal(next, 5); assert.equal(calls.length, 0);
  for (const path of ['/course', '/course/', '/course/lesson-01/lesson-data.js', '/course/lesson-01/scene-captions.vtt', '/course/shared/lesson.js', '/course/assessments/assessment-data.js', '/course/assets-evil/data.js', '/course/shared/app.css/fake']) assert.equal((await courseAccess(new Request(SITE + path), context)).status, 302, path);
  assert.equal(next, 5);
});

test('edge route covers every course URL and fails closed on execution error; signup validation is synchronous', () => {
  assert.deepEqual(config.path, ['/course', '/course/*']); assert.equal(config.onError, 'fail');
  const source = fs.readFileSync(new URL('../netlify/shared/identity-policy.ts', import.meta.url), 'utf8');
  assert(!/background\s*:\s*true/.test(source)); assert.match(source, /timingSafeEqual/);
});
