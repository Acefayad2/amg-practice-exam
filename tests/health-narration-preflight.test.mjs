import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  integerToWords,
  prepareNarration,
  projectedCredits,
} from '../scripts/health/build-narration-requests.mjs';

test('number preparation handles cardinal, decimal and ordinal speech', () => {
  assert.equal(integerToWords(1034), 'one thousand thirty-four');
  assert.equal(
    prepareNarration('At 65th, pay $3,600, then 1.5% across 80–120 days.'),
    'At sixty-fifth, pay three thousand six hundred dollars, then one point five percent across eighty to one hundred twenty days.',
  );
});

test('speech preparation expands course abbreviations and unsupported symbols', () => {
  const prepared = prepareNarration('AMG compares HMO/PPO rules and AD&D benefits for a 41-year-old.');
  assert.equal(prepared, 'A M G compares H M O or P P O rules and A D and D benefits for a forty-one-year-old.');
  assert.doesNotMatch(prepared, /[0-9$%&/+=]/);
});

test('credit projection rounds each request up to a tenth', () => {
  assert.equal(projectedCredits(1), 0.1);
  assert.equal(projectedCredits(150), 1);
  assert.equal(projectedCredits(151), 1.1);
});

test('the preflight counts actual outputs instead of treating a quote as a recording', async () => {
  const dir = new URL('../docs/course/health/', import.meta.url);
  const files = (await readdir(dir)).filter(f => /^audio-.*\.json$/.test(f));
  const receipts = await Promise.all(files.map(async f => JSON.parse(await readFile(new URL(f, dir)))));
  const completed = receipts.flatMap(r => r.jobs).filter(j => j.status === 'completed' && j.result_url);
  assert.equal(new Set(completed.map(j => j.job_id)).size, completed.length);
  const report = await readFile(new URL('NARRATION-PREFLIGHT.md', dir), 'utf8');
  assert.ok(report.includes(`${completed.length} of 360 recordings completed`));
});

test('speech reads a coinsurance split, statute reference, date and initialism as intended', () => {
  assert.equal(prepareNarration('80/20 coinsurance. Section 15-405. July 1, 2026. ESRD.'),
    'eighty-twenty coinsurance. Section fifteen dash four oh five. July first, twenty twenty-six. E S R D.');
});

test('request builder preserves submitted receipts', async () => {
  const receipt = JSON.parse(await readFile(new URL('../docs/course/health/audio-01-02.json', import.meta.url), 'utf8'));
  assert.ok(receipt.jobs.every(j => j.status === 'completed' && j.result_url));
  assert.equal(receipt.jobs.length, 12);
  assert.equal(receipt.credits.credits_exact, 46.1);
});
