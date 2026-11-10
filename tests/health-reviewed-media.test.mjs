import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { reviewedAudio } from '../scripts/health/reviewed-audio.mjs';

test('cannot release partial, swapped or modified recordings as a complete lesson', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'amg-narration-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const docs = path.join(root, 'docs/course/health'), media = path.join(root, 'public/course/health/audio');
  for (const dir of [docs, media]) fs.mkdirSync(dir, { recursive: true });
  const clips = Array.from({ length: 6 }, (_, section) => {
    const data = Buffer.from('clip ' + section), sha256 = createHash('sha256').update(data).digest('hex');
    const file = 'h01-' + (section + 1) + '-' + sha256.slice(0, 10) + '.mp3';
    fs.writeFileSync(path.join(media, file), data);
    return { index: 100 + section, job_id: 'job-' + section, file, sha256, duration_sec: 35 };
  });
  fs.writeFileSync(path.join(docs, 'audio-01-02.json'), JSON.stringify({jobs: clips.map(({ index, job_id }) => ({ index, job_id, status: 'completed' }))}));
  const select = clips => fs.writeFileSync(path.join(docs, 'narration-reviewed.json'), JSON.stringify({version: 1, clips}));
  select(clips); assert.equal(reviewedAudio(docs).size, 6);
  select(clips.slice(1)); assert.throws(() => reviewedAudio(docs), /Incomplete narration/);
  select([{...clips[0], file: clips[1].file, sha256: clips[1].sha256}, ...clips.slice(1)]);
  assert.throws(() => reviewedAudio(docs), /Invalid mastered audio filename/);
  select(clips); fs.writeFileSync(path.join(media, clips[0].file), 'not the reviewed recording');
  assert.throws(() => reviewedAudio(docs), /Mastered audio changed/);
});
