#!/usr/bin/env python3
"""Exercise release failure modes in disposable fixtures; never apply course changes."""
import contextlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
VOICE = 'd0374db1-44b9-4f05-939e-0a9ae9dbbe6a'


@contextlib.contextmanager
def fixture():
    with tempfile.TemporaryDirectory(prefix='amg-zoe-guard-') as tmp:
        root = Path(tmp)
        docs = root / 'docs/course/zoe-narration'
        docs.mkdir(parents=True)
        script = root / 'scripts/qa/assemble-zoe-release.py'
        script.parent.mkdir(parents=True)
        shutil.copyfile(ROOT / 'scripts/qa/assemble-zoe-release.py', script)
        baseline, normalized, jobs = [], [], []
        for n in range(1, 61):
            source, raw = f'https://example.test/source-{n}.mp4', f'https://example.test/raw-{n}.mp4'
            baseline.append({'number': n, 'media': {'video': {'url': source}}})
            normalized.append({'number': n, 'sourceVideo': source, 'rawVoiceChangeVideo': raw})
            jobs.append({'number': n, 'sourceVideo': source, 'rawVideo': raw, 'status': 'completed', 'voice_id': VOICE})
        inputs = {'input-inventory.json': {'lessons': baseline},
                  'normalized-outputs.json': {'lessons': normalized}, 'voice-jobs.json': jobs}
        for name, data in inputs.items():
            (docs / name).write_text(json.dumps(data))
        stale = b'{"synthetic":"previous-success-envelope"}\n'
        (docs / 'verified-outputs.json').write_bytes(stale)
        yield script, docs, inputs, stale


class ReleaseGuardTests(unittest.TestCase):
    def rejected(self, script, docs, stale):
        result = subprocess.run([sys.executable, '-B', str(script)], capture_output=True, text=True, timeout=10)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertFalse((docs / 'verified-outputs.json').exists(), 'A failed refresh left a stale active envelope')
        history = list((docs / 'assembly-history').glob('verified-outputs-*.json'))
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].read_bytes(), stale)
        return result

    def test_incomplete_acceptance_archives_stale_envelope_and_fails(self):
        with fixture() as (script, docs, inputs, stale):
            result = self.rejected(script, docs, stale)
            progress = json.loads(result.stdout)
            self.assertEqual(progress['acceptedCount'], 0)
            self.assertEqual(progress['awaitingAcceptance'], list(range(1, 61)))

    def test_duplicate_numbers_fail_before_dict_construction(self):
        for name in ('input-inventory.json', 'normalized-outputs.json', 'voice-jobs.json'):
            with self.subTest(name=name), fixture() as (script, docs, inputs, stale):
                obj = inputs[name]
                rows = obj if isinstance(obj, list) else obj['lessons']
                rows[-1]['number'] = rows[0]['number']
                (docs / name).write_text(json.dumps(obj))
                self.assertIn('duplicate or missing', self.rejected(script, docs, stale).stderr)

    def test_source_job_and_raw_output_mismatches_fail(self):
        for name, field in (('normalized-outputs.json', 'sourceVideo'),
                            ('voice-jobs.json', 'sourceVideo'),
                            ('normalized-outputs.json', 'rawVoiceChangeVideo')):
            with self.subTest(name=name, field=field), fixture() as (script, docs, inputs, stale):
                obj = inputs[name]
                rows = obj if isinstance(obj, list) else obj['lessons']
                rows[52][field] = 'https://example.test/wrong-input.mp4'
                (docs / name).write_text(json.dumps(obj))
                self.assertIn('mismatched', self.rejected(script, docs, stale).stderr)

    def test_malformed_json_also_inactivates_old_envelope(self):
        with fixture() as (script, docs, inputs, stale):
            (docs / 'input-inventory.json').write_text('{')
            self.rejected(script, docs, stale)

    def test_wrong_count_and_boolean_number_rejected(self):
        for mutation in ('extra-row', 'boolean-number'):
            with self.subTest(mutation=mutation), fixture() as (script, docs, inputs, stale):
                obj = inputs['normalized-outputs.json']
                if mutation == 'extra-row':
                    obj['lessons'].append(dict(obj['lessons'][0]))
                else:
                    obj['lessons'][0]['number'] = True
                (docs / 'normalized-outputs.json').write_text(json.dumps(obj))
                self.rejected(script, docs, stale)

    def test_caption_acceptance_cannot_bypass_reviewed_patch(self):
        code = """
import assert from 'node:assert/strict';
import {validateCaptionAcceptance as check} from './scripts/apply-zoe-narration.mjs';
const base={number:9},old='a'.repeat(64),patch='b'.repeat(64),review='c'.repeat(64);
const unchanged={mode:'unchanged',sha256:old};
check(base,unchanged,{});
check(base,unchanged,{captionSha256:old});
assert.throws(()=>check(base,unchanged,{captionSha256:patch}),/differ from final acceptance/);
assert.throws(()=>check(base,unchanged,{captionSha256:old,captionReviewSha256:review}),/requires a caption patch/);
assert.throws(()=>check(base,unchanged,{captionReviewSha256:review}),/requires a caption patch/);
const patched={mode:'reviewed-patch',sha256:patch,reviewSha256:review};
check(base,patched,{captionSha256:patch,captionReviewSha256:review});
assert.throws(()=>check(base,patched,{captionSha256:old,captionReviewSha256:review}),/patched captions/);
assert.throws(()=>check(base,patched,{captionSha256:patch}),/patch review/);
console.log('3 valid caption bindings accepted; 5 mismatched bindings rejected');
"""
        result = subprocess.run(['node', '--input-type=module', '-e', code], cwd=ROOT,
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == '__main__':
    unittest.main()
