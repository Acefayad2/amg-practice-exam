// Run with the exact installed deployment bootstrap path, without a live account:
// node scripts/qa/account-identity-runtime.mjs <serverless-functions-api/dist/index.js>
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const runtimePath = process.argv[2];
assert(runtimePath, 'Supply the installed deployment runtime index.js path.');
globalThis.awslambda = {
  streamifyResponse: fn => fn,
  HttpResponseStream: { from(stream, metadata) { stream.metadata = metadata; return stream; } }
};
const { getLambdaHandler } = await import(pathToFileURL(path.resolve(runtimePath)).href);
const priorCode = process.env.AMG_REGISTRATION_CODE;
process.env.AMG_REGISTRATION_CODE = 'local-runtime-regression-only';
const checks = [];
const rawUser = roles => ({ id: 'local-only-user', email: 'local-only@example.invalid', created_at: '2026-09-13T00:00:00Z', app_metadata: { provider: 'email', roles }, user_metadata: { full_name: 'Local Test', amg_access_code: process.env.AMG_REGISTRATION_CODE } });
async function invoke(file, eventName, user) {
  const stream = new PassThrough(), chunks = [];
  stream.on('data', chunk => chunks.push(chunk));
  const fileURL = new URL(`../../netlify/functions/${file}.mts`, import.meta.url).href;
  await getLambdaHandler(fileURL)({ rawUrl: `https://amg.example.test/.netlify/functions/${file}`, path: `/.netlify/functions/${file}`, httpMethod: 'POST', headers: { 'x-netlify-event': eventName, 'content-type': 'application/json' }, isBase64Encoded: false, body: JSON.stringify({ user }) }, stream, { awsRequestId: 'local-only', getRemainingTimeInMillis: () => 10000 });
  const body = Buffer.concat(chunks).toString();
  return { status: stream.metadata.statusCode, body: body ? JSON.parse(body) : null };
}
try {
  for (const roles of [[], ['existing-role'], ['amg-agent']]) {
    const result = await invoke('identity-validate', 'identity_validate', rawUser(roles));
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.app_metadata.roles, [...new Set([...roles, 'amg-agent'])]);
    assert.equal(result.body.user_metadata.amg_access_code, undefined);
    assert.equal(result.body.confirmed_at, null);
    checks.push(`actual runtime validate round trip: ${roles.length ? roles.join(',') : 'empty roles'}`);
  }
  const invalid = rawUser([]); invalid.user_metadata.amg_access_code = 'wrong-local-code';
  assert.equal((await invoke('identity-validate', 'identity_validate', invalid)).status, 401);
  checks.push('actual runtime denial returns401');
  const validated = (await invoke('identity-validate', 'identity_validate', rawUser([]))).body;
  validated.confirmed_at = '2026-09-13T01:00:00Z';
  const signedUp = await invoke('identity-signup', 'identity_signup', validated);
  assert.equal(signedUp.status, 200); assert.deepEqual(signedUp.body.app_metadata.roles, ['amg-agent']);
  assert.equal(signedUp.body.confirmed_at, validated.confirmed_at);
  assert.equal(signedUp.body.user_metadata.amg_access_code, undefined);
  checks.push('actual persisted validate→confirmed signup round trip');
  assert.equal((await invoke('identity-signup', 'identity_signup', rawUser([]))).status, 401);
  checks.push('actual roleless signup denied');
  for (const roles of [[], ['amg-agent']]) {
    const result = await invoke('identity-usermodified', 'identity_usermodified', rawUser(roles));
    assert.equal(result.status, 200); assert.deepEqual(result.body.app_metadata.roles, roles);
    assert.equal(result.body.user_metadata.amg_access_code, undefined);
    checks.push(`actual modification cleanup preserves ${roles.length ? 'AMG role' : 'absence of role'}`);
  }
  const runtimeBytes = await fs.readFile(runtimePath);
  const receipt = { checkedAt: new Date().toISOString(), status: 'passed', runtimePackage: '@netlify/serverless-functions-api', runtimeVersion: JSON.parse(await fs.readFile(path.resolve(runtimePath, '../../package.json'), 'utf8')).version, runtimeSha256: createHash('sha256').update(runtimeBytes).digest('hex'), invocation: 'Actual getLambdaHandler with file URL; only AWS response stream mocked. No network or accounts.', checks };
  await fs.mkdir(new URL('../../output/qa/', import.meta.url), { recursive: true });
  await fs.writeFile(new URL('../../output/qa/account-identity-runtime.json', import.meta.url), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ status: receipt.status, runtimeVersion: receipt.runtimeVersion, checks: checks.length }));
} finally {
  if (priorCode === undefined) delete process.env.AMG_REGISTRATION_CODE;
  else process.env.AMG_REGISTRATION_CODE = priorCode;
}
