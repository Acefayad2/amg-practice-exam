#!/usr/bin/env python3
"""Bind completed reviews to the exact 60 normalized exports; never presume acceptance."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs/course/zoe-narration'
sha = lambda value: hashlib.sha256(value).hexdigest()

def record(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())}

def index60(rows, label):
    if not isinstance(rows, list) or len(rows) != 60:
        raise ValueError(f'{label} must contain exactly 60 rows')
    if any(not isinstance(r, dict) or type(r.get('number')) is not int or not 1 <= r['number'] <= 60 for r in rows):
        raise ValueError(f'{label} contains an invalid lesson number')
    if len({r['number'] for r in rows}) != 60:
        raise ValueError(f'{label} contains duplicate or missing lesson numbers')
    return {r['number']: r for r in rows}

def archive_previous_envelope():
    previous = DOCS / 'verified-outputs.json'
    if previous.exists():
        history = DOCS / 'assembly-history'
        history.mkdir(exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
        previous.rename(history / f'verified-outputs-{stamp}-{sha(previous.read_bytes())[:12]}.json')

def load_inputs():
    baseline = json.loads((DOCS / 'input-inventory.json').read_text())
    index60(baseline['lessons'], 'Baseline')
    normalized = index60(json.loads((DOCS / 'normalized-outputs.json').read_text())['lessons'], 'Normalized outputs')
    jobs = index60(json.loads((DOCS / 'voice-jobs.json').read_text()), 'Voice jobs')
    for base in baseline['lessons']:
        n = base['number']
        output, job = normalized[n], jobs[n]
        source = base['media']['video']['url']
        for label, actual, expected in [
            ('normalized source', output['sourceVideo'], source),
            ('voice-job source', job['sourceVideo'], source),
            ('raw voice output', output['rawVoiceChangeVideo'], job['rawVideo']),
        ]:
            if not isinstance(actual, str) or not actual or actual != expected:
                raise ValueError(f'Part {n} has a mismatched {label}')
        if job['status'] != 'completed' or job['voice_id'] != 'd0374db1-44b9-4f05-939e-0a9ae9dbbe6a':
            raise ValueError(f'Part {n} lacks a completed approved voice job')
    return baseline, normalized, jobs

def main():
    # A failed/incomplete refresh must never leave yesterday's envelope active.
    archive_previous_envelope()
    baseline_path = DOCS / 'input-inventory.json'
    baseline, normalized, jobs = load_inputs()
    objects, hashes = [], {}
    for path in sorted(DOCS.rglob('*')):
        if not path.is_file() or any(folder in path.parts for folder in ('backups', 'assembly-history')) or path.name == 'verified-outputs.json':
            continue
        raw = path.read_bytes()
        hashes.setdefault(sha(raw), []).append(path)
        if path.suffix == '.json':
            try:
                obj = json.loads(raw)
                if isinstance(obj, dict):
                    objects.append((path, obj))
            except json.JSONDecodeError:
                continue  # Another reviewer may still be writing an unrelated report.
    lessons, missing = [], []
    for base in baseline['lessons']:
        n = base['number']
        output = normalized[n]
        candidates = []
        for acceptance_path, acceptance in objects:
            if acceptance.get('number') != n or acceptance.get('status') != 'passed' or not acceptance.get('outputFileSha256') or not acceptance.get('automatedReportSha256'):
                continue
            for qa_path in hashes.get(acceptance['automatedReportSha256'], []):
                qa = json.loads(qa_path.read_text())
                if qa.get('inputIdentity', {}).get('newUrlSha256') == sha(output['video'].encode()) and qa.get('replacement', {}).get('fileSha256') == acceptance['outputFileSha256']:
                    candidates.append((acceptance_path, acceptance, qa_path, qa))
                    break
        if not candidates:
            missing.append(n)
            continue
        if len(candidates) != 1:
            raise ValueError(f'Part {n} has multiple final acceptances; resolve them explicitly')
        acceptance_path, acceptance, qa_path, qa = candidates[0]
        job = jobs[n]
        captions = {'mode': 'unchanged', 'sha256': base['baselines']['captions']['file']['sha256']}
        if acceptance.get('captionReviewSha256'):
            patches = [p for p in hashes.get(acceptance['captionSha256'], []) if p.suffix == '.vtt']
            reviews = hashes.get(acceptance.get('captionReviewSha256'), [])
            if not patches or not reviews:
                raise ValueError(f'Part {n} lacks its accepted caption patch or review')
            captions = {'mode': 'reviewed-patch', 'originalSha256': captions['sha256'], 'file': record(patches[0]), 'review': record(reviews[0])}
        elif acceptance.get('captionSha256') not in (None, captions['sha256']):
            raise ValueError(f'Part {n} changes captions without a bound patch review')
        row = {'number': n, 'status': 'verified',
               'source': {'video': base['media']['video']['url'], 'editArchive': base['media']['editableArchive']['url'], 'durationSeconds': base['media']['durationSeconds']},
               'sourceFileSha256': qa['original']['fileSha256'],
               'output': {'video': output['video'], 'fileSha256': qa['replacement']['fileSha256'], 'durationSeconds': qa['replacement']['duration'], 'technical': qa['replacement']['technical']},
               'job': {'id': job['job_id'], 'model': job['model'], 'status': job['status'], 'voiceId': job['voice_id']},
               'captions': captions, 'qa': {'automatedReport': record(qa_path), 'acceptance': record(acceptance_path)}}
        if output.get('repairs'):
            row['output']['normalizationSource'] = output['normalizationSource']
            row['output']['repairs'] = output['repairs']
        if n == 1:
            row['preservedDialogue'] = {'start': 0, 'end': 12, 'speaker': 'Marcus'}
        lessons.append(row)
    progress = {'acceptedCount': len(lessons), 'accepted': [r['number'] for r in lessons], 'awaitingAcceptance': missing}
    if missing:
        print(json.dumps(progress))
        return 1
    envelope = {'schemaVersion': 1, 'baselineSha256': sha(baseline_path.read_bytes()),
                'voice': {'name': 'Zoe', 'voice_id': 'd0374db1-44b9-4f05-939e-0a9ae9dbbe6a', 'voice_type': 'preset'}, 'lessons': lessons}
    pending = DOCS / 'verified-outputs.json.pending'
    pending.write_text(json.dumps(envelope, indent=2) + '\n')
    pending.replace(DOCS / 'verified-outputs.json')
    print(json.dumps({**progress, 'written': 'docs/course/zoe-narration/verified-outputs.json', 'next': 'Run the strict integrator in its default read-only validation mode.'}))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
