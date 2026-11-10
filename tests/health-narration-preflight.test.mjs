import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('generated preflight is explicitly non-submitted', async () => {
  const source = await readFile(new URL('../docs/course/health/NARRATION-PREFLIGHT.md', import.meta.url), 'utf8');
  assert.match(source, /Status: \*\*not submitted\*\*/);
  assert.match(source, /spend no Higgsfield credits/);
  assert.match(source, /lessons 01–02 first/);
});
