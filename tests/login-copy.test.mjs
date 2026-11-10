import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loginCopyFor } from '../src/course/login-copy.js';

test('Health course, lessons and mock-exam return paths use Health entry copy', () => {
  for (const next of ['/course/health', '/course/health/', '/course/health/lesson-01/', '/course/health/assessments/?attempt=one#review', '/course/%68ealth/']) {
    const copy = loginCopyFor(next);
    assert.equal(copy.program, 'Maryland Accident & Health', next);
    assert.match(copy.description, /^Accident and health/);
    assert.match(copy.meta, /Accident & Health/);
  }
});

test('Life entry stays Life, while the checklist uses neutral licensing copy', () => {
  for (const path of ['/course', '/course/', '/course/lesson-20/', '/course/assessments/']) assert.equal(loginCopyFor(path).program, 'Maryland Life');
  for (const path of ['/', '/licensing-progress', '/licensing-progress/', '/%invalid']) {
    assert.equal(loginCopyFor(path).program, 'Maryland Licensing');
    assert.match(loginCopyFor(path).description, /Life and Accident & Health/);
  }
});

test('login HTML provides each copy target with track-neutral static fallback', () => {
  const html = fs.readFileSync(new URL('../public/login/index.html', import.meta.url), 'utf8');
  for (const id of ['login-meta-description', 'login-program', 'login-description', 'login-footer-program']) assert.equal(html.split(`id="${id}"`).length - 1, 1);
  assert.match(html, /Video lessons per track/);
  assert.doesNotMatch(html, /Maryland Life|continue your Maryland life insurance course/);
  const runtime = fs.readFileSync(new URL('../src/course/login.js', import.meta.url), 'utf8');
  assert.match(runtime, /const next = sanitizeReturnTo/);
  assert.match(runtime, /loginCopyFor\(next\)/);
  assert.match(runtime, /location\.replace\(next\)/);
});
