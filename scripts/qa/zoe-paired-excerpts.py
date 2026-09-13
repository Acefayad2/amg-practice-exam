"""Native Higgsfield-only paired source/Zoe recognition for explicit candidate windows.

python3 zoe-paired-excerpts.py config.json --output-dir /home/user/amg-zoe-pairs
Config: {number, originalPath, newPath, windows:[{id,start,end,reason}],
         originalFileSha256?:..., newFileSha256?:...}.
Inputs must already exist in the native sandbox. No download, upload, generation,
caption edit or automatic acceptance. Keep each batch within the sandbox lease.
"""
import argparse
import gc
import hashlib
import json
import math
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def stamp():
    return datetime.now(timezone.utc).isoformat()


def clean_error(value):
    value = re.sub(r'https?://[^\s<>"\x27]+', '[URL REDACTED]', str(value))
    return value[-1600:]


def run(command):
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(clean_error(result.stderr))
    return result


def save(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + '\n')
    temporary.replace(path)


def file_hash(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def probe(path):
    data = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]).stdout)
    audio = next(s for s in data['streams'] if s.get('codec_type') == 'audio')
    offset = float(audio['start_time']) - float(data['format']['start_time'])
    if abs(offset) > .001:
        raise ValueError('Nonzero audio/container start offset requires an explicitly adjusted extraction plan.')
    return {'duration': float(data['format']['duration']), 'audioTimelineOffsetSeconds': offset}


def quiet_intervals(wav, start, end):
    log = run(['ffmpeg', '-hide_banner', '-nostats', '-threads', '1', '-i', str(wav),
               '-af', 'silencedetect=noise=-40dB:d=0.06', '-f', 'null', '-']).stderr
    intervals, begin = [], None
    for line in log.splitlines():
        a = re.search(r'silence_start: ([-\d.]+)', line)
        b = re.search(r'silence_end: ([-\d.]+) \| silence_duration: ([-\d.]+)', line)
        if a:
            begin = float(a[1])
        if b:
            finish, duration = float(b[1]), float(b[2])
            local_start = begin if begin is not None else max(0, finish - duration)
            intervals.append({'start': start + local_start, 'end': start + finish, 'duration': duration})
            begin = None
    if begin is not None:
        intervals.append({'start': start + begin, 'end': end, 'duration': end - start - begin})
    return intervals


def recognize(model, wav, start):
    segments, _ = model.transcribe(str(wav), language='en', beam_size=5, temperature=0,
        word_timestamps=True, vad_filter=False, condition_on_previous_text=False, initial_prompt=None)
    rows = []
    for segment in segments:
        rows.append({'start': float(segment.start) + start, 'end': float(segment.end) + start,
            'text': segment.text.strip(), 'avgLogProbability': float(segment.avg_logprob),
            'noSpeechProbability': float(segment.no_speech_prob),
            'words': [{'word': word.word, 'start': float(word.start) + start,
                       'end': float(word.end) + start, 'probability': float(word.probability)}
                      for word in segment.words or []]})
    return {'status': 'recognized-awaiting-review', 'text': ' '.join(row['text'] for row in rows),
            'segments': rows, 'recognizedAt': stamp()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config')
    parser.add_argument('--output-dir', required=True)
    args = parser.parse_args()
    if not Path('/home/user').is_dir():
        raise RuntimeError('Run this media tool only inside the native Higgsfield sandbox.')
    config_path = Path(args.config)
    config = json.loads(config_path.read_text())
    number, windows = config['number'], config['windows']
    if not isinstance(number, int) or not 1 <= number <= 60:
        raise ValueError('Invalid lesson number.')
    if not isinstance(windows, list) or not windows:
        raise ValueError('Explicit nonempty candidate windows are required.')
    inputs = {'original': Path(config['originalPath']).resolve(), 'new': Path(config['newPath']).resolve()}
    for media in inputs.values():
        if not str(media).startswith('/home/user/') or not media.is_file():
            raise ValueError('Existing native sandbox input paths are required.')
    output = Path(args.output_dir).resolve()
    if not str(output).startswith('/home/user/'):
        raise ValueError('The output directory must be inside the native sandbox.')
    output.mkdir(parents=True, exist_ok=True)
    report_path = output / 'excerpts.json'
    if report_path.exists():
        raise ValueError('Use a fresh output directory; existing evidence is not overwritten.')
    probes = {role: probe(media) for role, media in inputs.items()}
    hashes = {role: file_hash(media) for role, media in inputs.items()}
    for field, role in [('originalFileSha256', 'original'), ('newFileSha256', 'new')]:
        if config.get(field) and config[field] != hashes[role]:
            raise ValueError('Input file hash mismatch: ' + role)
    ids = set()
    for window in windows:
        identifier = window['id']
        if not isinstance(identifier, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', identifier) or identifier in ids:
            raise ValueError('Window IDs must be unique simple names.')
        ids.add(identifier)
        if not finite(window['start']) or not finite(window['end']) or not 0 <= window['start'] < window['end'] <= min(p['duration'] for p in probes.values()):
            raise ValueError('Window boundaries must be inside both videos.')
        if not isinstance(window.get('reason'), str) or not window['reason'].strip():
            raise ValueError('Each candidate window requires a reason.')
    report = {'schemaVersion': 1, 'number': number, 'status': 'running', 'startedAt': stamp(),
        'inputIdentity': {'configSha256': file_hash(config_path), 'originalFileSha256': hashes['original'], 'newFileSha256': hashes['new']},
        'probes': probes, 'recognitionSettings': {'models': ['base.en', 'small.en'], 'language': 'en', 'beamSize': 5,
            'temperature': 0, 'vadFilter': False, 'conditionOnPreviousText': False, 'cpuThreads': 1},
        'quietGapSettings': {'thresholdDb': -40, 'minimumSeconds': .06},
        'cases': [{**window, 'original': {}, 'new': {}} for window in windows], 'passes': [], 'failures': [],
        'limitations': 'Recognition and quiet intervals are review evidence only. Timestamps are approximate. No result is automatically accepted or excluded; record actual adjudication separately.'}
    save(report_path, report)
    wavs = {}
    for case in report['cases']:
        for role, media in inputs.items():
            wav = output / (case['id'] + '-' + role + '.wav')
            try:
                run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(media), '-ss', str(case['start']),
                     '-t', str(case['end'] - case['start']), '-vn', '-ac', '1', '-ar', '16000', '-y', str(wav)])
                case[role]['quietIntervals'] = quiet_intervals(wav, case['start'], case['end'])
                wavs[(case['id'], role)] = wav
            except Exception as error:
                case[role]['extractionFailure'] = clean_error(error)
                report['failures'].append({'case': case['id'], 'role': role, 'stage': 'extraction', 'detail': clean_error(error)})
            save(report_path, report)
    from faster_whisper import WhisperModel
    for model_name in ['base.en', 'small.en']:
        try:
            model = WhisperModel(model_name, device='cpu', compute_type='int8', cpu_threads=1, num_workers=1)
        except Exception as error:
            report['failures'].append({'stage': 'model-load', 'model': model_name, 'detail': clean_error(error)})
            save(report_path, report)
            continue
        for case in report['cases']:
            for role in ['original', 'new']:
                wav = wavs.get((case['id'], role))
                if wav is None:
                    continue
                entry = {'case': case['id'], 'role': role, 'model': model_name}
                try:
                    recognized = recognize(model, wav, case['start'])
                    case[role][model_name] = recognized
                    entry.update({'status': recognized['status'], 'recognizedAt': recognized['recognizedAt']})
                except Exception as error:
                    entry.update({'status': 'failed', 'detail': clean_error(error)})
                    case[role][model_name] = dict(entry)
                    report['failures'].append(dict(entry))
                report['passes'].append(entry)
                save(report_path, report)
                print(json.dumps({'number': number, **entry}), flush=True)
        del model
        gc.collect()
    report['status'] = 'recognition-complete-awaiting-review' if not report['failures'] else 'review-incomplete'
    report['finishedAt'] = stamp()
    report['recognitionPasses'] = len(report['passes'])
    report['successfulRecognitionPasses'] = sum(row['status'] == 'recognized-awaiting-review' for row in report['passes'])
    save(report_path, report)
    print(json.dumps({'number': number, 'status': report['status'], 'windows': len(windows),
                      'recognitionPasses': report['recognitionPasses'], 'successfulRecognitionPasses': report['successfulRecognitionPasses']}), flush=True)
    return 1 if report['failures'] else 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({'status': 'failed', 'detail': clean_error(error)}), flush=True)
        raise SystemExit(1)
