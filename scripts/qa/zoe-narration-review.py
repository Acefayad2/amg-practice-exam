"""Review voice-replacement exports in the Higgsfield sandbox only.

Usage: python3 zoe-narration-review.py config.json --output-dir /home/user/amg-zoe-qa
Config: a JSON list, or {"items": [...]}, with each item containing number,
originalVideo, newVideo, originalVtt, expectedDuration, and optional expectedNarration.
Video fields are independently downloadable HTTP(S) URLs. originalVtt is either
complete WEBVTT text or its HTTP(S) URL. expectedDuration is original seconds.
If expectedNarration is omitted, use parsed original caption text as the intended
sequence; this requires the caller to have verified source/caption word parity.

No generation, upload, caption edits or production changes. Each lesson saves
review.json and transcript.json; the root report is updated after each lesson.
Run small batches within the sandbox lease. ASR differences and timing drift
are review candidates, never an automatic guarantee of accurate speech.
"""
import argparse
import difflib
import hashlib
import html
import json
import math
import re
import shutil
import subprocess
import time
import traceback
import urllib.request
from datetime import datetime, timezone
from fractions import Fraction
from pathlib import Path
from urllib.parse import urlsplit


class ReviewFailure(Exception):
    def __init__(self, stage, detail):
        self.stage = stage
        self.detail = redact(detail)


def redact(text):
    text = re.sub(r'https?://[^\s<>"\x27]+', '[URL REDACTED]', str(text))
    return re.sub(r'(?i)(authorization|bearer|api[_-]?key|token)\s*[:=]?\s+\S+',
                  r'\1 [REDACTED]', text)[-1800:]


def run(args, stage):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise ReviewFailure(stage, result.stderr)
    return result


def save_json(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False,
                                    allow_nan=False) + '\n')
    temporary.replace(path)


def download(url, path):
    temporary = path.with_suffix(path.suffix + '.download')
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as response, temporary.open('wb') as out:
                shutil.copyfileobj(response, out)
            if not temporary.stat().st_size:
                raise ValueError('Empty download')
            temporary.replace(path)
            return
        except Exception:
            temporary.unlink(missing_ok=True)
            if attempt < 3:
                time.sleep(2 ** attempt)
    raise ReviewFailure('download', 'Input download failed after four attempts; URL omitted.')


def is_url(value):
    return isinstance(value, str) and urlsplit(value).scheme in ('http', 'https')


def tokens(text):
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text.lower().replace('’', "'"))


def seconds(value):
    parts = value.split(':')
    return sum(float(part) * (60 ** index) for index, part in enumerate(reversed(parts)))


def parse_vtt(text):
    cues = []
    for block in re.split(r'\n\s*\n', text.replace('\r', '').lstrip('\ufeff').strip()):
        lines = block.splitlines()
        if not lines or lines[0].startswith(('NOTE', 'STYLE', 'REGION')):
            continue
        timing = next((i for i, line in enumerate(lines) if '-->' in line), None)
        if timing is None:
            continue
        match = re.match(r'((?:\d+:)?\d{2}:\d{2}\.\d{3})\s+-->\s+'
                         r'((?:\d+:)?\d{2}:\d{2}\.\d{3})(?:\s|$)', lines[timing])
        if not match:
            raise ReviewFailure('captions', 'Invalid VTT timing line.')
        body = html.unescape(re.sub(r'<[^>]+>', '', ' '.join(lines[timing + 1:])))
        cues.append({'id': lines[timing - 1] if timing else str(len(cues) + 1),
                     'start': seconds(match[1]), 'end': seconds(match[2]),
                     'text': ' '.join(body.split())})
    if not cues:
        raise ReviewFailure('captions', 'No VTT cues found.')
    return cues


def probe(path):
    result = run(['ffprobe', '-v', 'error', '-show_format', '-show_streams',
                  '-of', 'json', str(path)], 'probe')
    value = json.loads(result.stdout)
    streams = [{key: s.get(key) for key in ('codec_type', 'codec_name', 'width', 'height',
                'pix_fmt', 'r_frame_rate', 'avg_frame_rate', 'time_base', 'sample_rate',
                'channels', 'start_time', 'duration', 'nb_frames')}
               for s in value['streams']]
    if not all(any(s['codec_type'] == kind for s in streams) for kind in ('audio', 'video')):
        raise ReviewFailure('probe', 'A required audio or video stream is missing.')
    return {'duration': float(value['format']['duration']),
            'startTime': numeric(value['format'].get('start_time')), 'streams': streams,
            'technical': value}


def numeric(value):
    try:
        number = float(value)
        return number if math.isfinite(number) else value
    except (TypeError, ValueError):
        return None


def silence_stats(log, duration):
    intervals = []
    start = None
    for line in log.splitlines():
        begin = re.search(r'silence_start: ([-\d.]+)', line)
        finish = re.search(r'silence_end: ([-\d.]+) \| silence_duration: ([-\d.]+)', line)
        if begin:
            start = float(begin[1])
        if finish:
            end, length = float(finish[1]), float(finish[2])
            intervals.append({'start': start if start is not None else max(0, end - length),
                              'end': end, 'duration': length})
            start = None
    if start is not None:
        intervals.append({'start': start, 'end': duration, 'duration': duration - start})
    return intervals


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def bitstream_sha256(path, label):
    return run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0',
                '-c:v', 'copy', '-f', 'hash', '-hash', 'sha256', '-'],
               'video-bitstream-hash-' + label).stdout.strip().split('=')[-1]


def stream_identity(old_probe, new_probe, old_hash, new_hash):
    a = next(s for s in old_probe['streams'] if s['codec_type'] == 'video')
    b = next(s for s in new_probe['streams'] if s['codec_type'] == 'video')
    keys = ('codec_name', 'width', 'height', 'pix_fmt', 'nb_frames', 'duration',
            'start_time', 'r_frame_rate', 'avg_frame_rate', 'time_base')
    return old_hash == new_hash and all(a[k] is not None and a[k] == b[k] for k in keys)


def full_decode(path, work, label, duration, need_frames):
    # The fallback writes every decoded picture's hash during the whole audio scan.
    framefile = work / (label + '-frames.sha256')
    command = ['ffmpeg', '-hide_banner', '-nostats', '-xerror', '-threads', '1', '-i', str(path)]
    if need_frames:
        command += ['-map', '0:v:0', '-an', '-c:v', 'rawvideo',
                  '-threads', '1', '-fps_mode', 'passthrough', '-f', 'framehash',
                  '-hash', 'sha256', '-y', str(framefile), '-map', '0:a:0', '-vn',
                  '-af', 'silencedetect=noise=-42dB:d=0.8,volumedetect',
                  '-f', 'null', '-']
    else:
        command += ['-map', '0:v:0', '-map', '0:a:0', '-af',
                    'silencedetect=noise=-42dB:d=0.8,volumedetect', '-f', 'null', '-']
    result = run(command, 'full-decode-' + label)
    volume = {name: numeric(value) for name, value in re.findall(
        r'(mean_volume|max_volume): ([\w.+-]+) dB', result.stderr)}
    errors = [redact(line) for line in result.stderr.splitlines()
              if re.search(r'error|invalid|corrupt|non.monoton|missing picture|failed', line, re.I)]
    frames = []
    timebase = None
    for line in framefile.read_text().splitlines() if need_frames else []:
        if line.startswith('#tb 0:'):
            timebase = Fraction(line.split(':', 1)[1].strip())
        elif line.strip() and not line.startswith('#'):
            fields = [part.strip() for part in line.split(',')]
            if len(fields) != 6 or timebase is None:
                raise ReviewFailure('framehash', 'Unexpected decoded-frame hash format.')
            frames.append({'pts': int(fields[2]) * timebase,
                           'duration': int(fields[3]) * timebase, 'sha256': fields[5]})
    if need_frames and not frames:
        raise ReviewFailure('framehash', 'No decoded video frames found.')
    return {'fullDecodeExit': 0, 'decodeWarnings': errors, 'volumeDb': volume,
            'silenceIntervals': silence_stats(result.stderr, duration)}, frames


def compare_frames(original, replacement, old_probe, new_probe):
    old_hashes = [f['sha256'] for f in original]
    new_hashes = [f['sha256'] for f in replacement]
    same_pixels = old_hashes == new_hashes
    old_times = [(f['pts'], f['duration']) for f in original]
    new_times = [(f['pts'], f['duration']) for f in replacement]
    old_video = next(s for s in old_probe['streams'] if s['codec_type'] == 'video')
    new_video = next(s for s in new_probe['streams'] if s['codec_type'] == 'video')
    dimensions_match = all(old_video[k] == new_video[k] for k in ('width', 'height', 'pix_fmt'))
    stream_start_matches = old_video['start_time'] is not None and old_video['start_time'] == new_video['start_time']
    mismatch = [i for i, (a, b) in enumerate(zip(old_hashes, new_hashes)) if a != b]
    return {'originalFrames': len(original), 'newFrames': len(replacement),
            'decodedFramePixelsIdentical': same_pixels,
            'decodedFrameTimingIdentical': old_times == new_times,
            'dimensionsAndPixelFormatIdentical': dimensions_match,
            'streamStartTimeIdentical': stream_start_matches,
            'unchangedVisualsVerified': same_pixels and old_times == new_times and dimensions_match and stream_start_matches,
            'sameIndexDifferentFrames': len(mismatch), 'firstDifferentFrameIndices': mismatch[:20],
            'originalFrameSequenceSha256': hashlib.sha256('\n'.join(old_hashes).encode()).hexdigest(),
            'newFrameSequenceSha256': hashlib.sha256('\n'.join(new_hashes).encode()).hexdigest(),
            'interpretation': 'Exact decoded equality verifies picture preservation. A mismatch requires visual review; lossy re-encoding alone can change hashes.'}


def recognize(model, path, work, audio_offset):
    wav = work / 'new-speech.wav'
    run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(path), '-vn',
         '-ac', '1', '-ar', '16000', '-y', str(wav)], 'audio-extraction')
    segments, metadata = model.transcribe(str(wav), language='en', beam_size=5,
        temperature=0, word_timestamps=True, vad_filter=False,
        condition_on_previous_text=False, initial_prompt=None)
    transcript = []
    anchors = []
    for s in segments:
        words = [{'word': w.word, 'start': float(w.start) + audio_offset, 'end': float(w.end) + audio_offset,
                  'probability': float(w.probability)} for w in (s.words or [])]
        transcript.append({'start': float(s.start) + audio_offset, 'end': float(s.end) + audio_offset, 'text': s.text.strip(),
                           'avgLogProbability': float(s.avg_logprob),
                           'noSpeechProbability': float(s.no_speech_prob), 'words': words})
        for word in words:
            anchors.extend({'token': token, **word} for token in tokens(word['word']))
    if not anchors:
        raise ReviewFailure('recognition', 'No recognized word anchors.')
    return transcript, anchors


def speech_differences(expected, anchors):
    a, b = tokens(expected), [w['token'] for w in anchors]
    matcher = difflib.SequenceMatcher(None, a, b, autojunk=False)
    differences = []
    for tag, i, j, k, end in matcher.get_opcodes():
        if tag == 'equal':
            continue
        before = anchors[max(0, k - 1)]
        after = anchors[min(len(anchors) - 1, end)]
        differences.append({'kind': tag, 'expectedIndex': [i, j], 'recognizedIndex': [k, end],
            'expected': ' '.join(a[i:j]), 'recognized': ' '.join(b[k:end]),
            'expectedContext': ' '.join(a[max(0, i - 5):j + 5]),
            'recognizedContext': ' '.join(b[max(0, k - 5):end + 5]),
            'windowStart': max(0, before['start'] - 3), 'windowEnd': after['end'] + 3,
            'containsNumericTokens': any(t.isdigit() for t in a[i:j] + b[k:end])})
    return {'similarity': matcher.ratio(), 'expectedTokenCount': len(a),
            'recognizedTokenCount': len(b), 'candidateCount': len(differences),
            'differences': differences}


def caption_alignment(cues, anchors, video_duration, threshold):
    expected = []
    ranges = []
    for cue in cues:
        begin = len(expected)
        expected.extend(tokens(cue['text']))
        ranges.append((begin, len(expected)))
    heard = [w['token'] for w in anchors]
    matcher = difflib.SequenceMatcher(None, expected, heard, autojunk=False)
    aligned = {}
    for block in matcher.get_matching_blocks():
        aligned.update((block.a + i, block.b + i) for i in range(block.size))
    results = []
    for index, (cue, (begin, end)) in enumerate(zip(cues, ranges)):
        matches = [i for i in range(begin, end) if i in aligned]
        coverage = len(matches) / (end - begin) if end > begin else 0
        boundaries = begin in aligned and end - 1 in aligned
        confident = coverage >= .7 and boundaries
        start = float(anchors[aligned[begin]]['start']) if begin in aligned else None
        finish = float(anchors[aligned[end - 1]]['end']) if end - 1 in aligned else None
        delta_start = start - cue['start'] if start is not None else None
        delta_end = finish - cue['end'] if finish is not None else None
        drift = bool(confident and max(abs(delta_start), abs(delta_end)) > threshold)
        results.append({'cue': index + 1, 'id': cue['id'], 'start': cue['start'], 'end': cue['end'],
            'matchedTokenFraction': round(coverage, 4), 'bothBoundaryWordsMatched': boundaries,
            'sufficientAnchorEvidence': confident, 'recognizedStart': start, 'recognizedEnd': finish,
            'startDeltaSeconds': delta_start, 'endDeltaSeconds': delta_end,
            'driftCandidate': drift, 'outsideNewVideo': cue['start'] < 0 or cue['end'] > video_duration,
            'invalidOriginalTiming': cue['end'] <= cue['start'] or
                (index > 0 and cue['start'] < cues[index - 1]['end'])})
    confident_rows = [r for r in results if r['sufficientAnchorEvidence']]
    deltas = sorted(abs(r[key]) for r in confident_rows for key in ('startDeltaSeconds', 'endDeltaSeconds'))
    drift_count = sum(r['driftCandidate'] for r in results)
    return {'cueCount': len(cues), 'thresholdSeconds': threshold,
            'sufficientlyAnchoredCues': len(confident_rows),
            'insufficientAnchorCues': len(results) - len(confident_rows),
            'driftCandidateCues': drift_count,
            'outsideNewVideoCues': sum(r['outsideNewVideo'] for r in results),
            'invalidOriginalTimingCues': sum(r['invalidOriginalTiming'] for r in results),
            'p95AbsoluteBoundaryDeltaSeconds': deltas[math.ceil(.95 * len(deltas)) - 1] if deltas else None,
            'maximumAbsoluteBoundaryDeltaSeconds': max(deltas) if deltas else None,
            'status': 'drift-candidates' if drift_count else
                'incomplete-evidence' if len(confident_rows) < len(cues) else 'no-threshold-crossing',
            'method': 'Global normalized word-sequence matching to NEW full-file ASR. Cue boundaries require both words matched and >=70% token coverage. Positive delta means new speech is later than the original caption. Recognition timing is approximate; candidates require review, never automatic caption edits.',
            'cues': results}


def inspect(item, root, model, threshold):
    work = root / f"{item['number']:02}"
    work.mkdir(parents=True, exist_ok=True)
    original, replacement = work / 'original.mp4', work / 'new.mp4'
    download(item['originalVideo'], original)
    download(item['newVideo'], replacement)
    if is_url(item['originalVtt']):
        download(item['originalVtt'], work / 'original.vtt')
        vtt = (work / 'original.vtt').read_text(encoding='utf-8-sig')
    else:
        vtt = item['originalVtt']
    cues = parse_vtt(vtt)
    expected = item.get('expectedNarration', ' '.join(c['text'] for c in cues))
    old_probe, new_probe = probe(original), probe(replacement)
    old_hash, new_hash = bitstream_sha256(original, 'original'), bitstream_sha256(replacement, 'new')
    identical_stream = stream_identity(old_probe, new_probe, old_hash, new_hash)
    old_scan, old_frames = full_decode(original, work, 'original', old_probe['duration'], not identical_stream)
    new_scan, new_frames = full_decode(replacement, work, 'new', new_probe['duration'], not identical_stream)
    old_scan['videoBitstreamSha256'], new_scan['videoBitstreamSha256'] = old_hash, new_hash
    if identical_stream:
        visuals = {'unchangedVisualsVerified': True, 'method': 'exact-compressed-stream-identity',
                   'decodedFrameComparison': 'skipped: identical compressed stream hash and nonmissing video frame count, duration, dimensions, format, start and frame/time-base metadata',
                   'interpretation': 'The video stream was preserved exactly; container/audio changes are assessed separately.'}
    else:
        visuals = compare_frames(old_frames, new_frames, old_probe, new_probe)
        visuals['method'] = 'full-decoded-frame-comparison'
    visuals['compressedVideoBitstreamIdentical'] = old_hash == new_hash
    audio = next(s for s in new_probe['streams'] if s['codec_type'] == 'audio')
    video = next(s for s in new_probe['streams'] if s['codec_type'] == 'video')
    audio_start = numeric(audio['start_time'])
    video_start = numeric(video['start_time'])
    known_offset = isinstance(audio_start, (float, int)) and isinstance(new_probe['startTime'], (float, int))
    audio_offset = audio_start - new_probe['startTime'] if known_offset else 0
    transcript, anchors = recognize(model, replacement, work, audio_offset)
    speech = speech_differences(expected, anchors)
    alignment = caption_alignment(cues, anchors, new_probe['duration'], threshold)
    av_delta = (numeric(audio['duration']) - numeric(video['duration'])
                if isinstance(numeric(audio['duration']), (float, int)) and
                isinstance(numeric(video['duration']), (float, int)) else None)
    flags = []
    if not known_offset:
        flags.append('Audio/container start offset unavailable; caption timestamps need independent verification.')
    if isinstance(audio_start, (float, int)) and isinstance(video_start, (float, int)) and abs(audio_start - video_start) > .1:
        flags.append('Output audio/video stream start times differ by more than0.1s.')
    if not visuals['unchangedVisualsVerified']:
        flags.append('Unchanged visuals not verified; inspect decoded-frame/timing mismatch.')
    if abs(old_probe['duration'] - item['expectedDuration']) > .1:
        flags.append('Downloaded original differs from expectedDuration by more than0.1s.')
    if abs(new_probe['duration'] - old_probe['duration']) > .1:
        flags.append('Output container duration differs from original by more than0.1s.')
    if av_delta is not None and abs(av_delta) > .1:
        flags.append('Output audio/video stream durations differ by more than0.1s.')
    if old_scan['decodeWarnings'] or new_scan['decodeWarnings']:
        flags.append('Decode diagnostic warnings require review.')
    peak = new_scan['volumeDb'].get('max_volume')
    mean = new_scan['volumeDb'].get('mean_volume')
    if isinstance(peak, (float, int)) and peak >= -.1:
        flags.append('Near-full-scale sample peak requires clipping review; peak alone does not prove clipping.')
    if mean == '-inf' or (isinstance(mean, (float, int)) and mean < -24):
        flags.append('Low output mean level requires loudness review; volumedetect dBFS is not integrated LUFS.')
    if any(s['duration'] > 2.5 for s in new_scan['silenceIntervals']):
        flags.append('Output silence longer than2.5s requires contextual comparison with original.')
    if speech['candidateCount']:
        flags.append('Recognition differences require contextual review; may be ASR errors.')
    if alignment['driftCandidateCues'] or alignment['outsideNewVideoCues']:
        flags.append('Original captions have timing drift or out-of-bounds candidates.')
    if alignment['insufficientAnchorCues'] or alignment['invalidOriginalTimingCues']:
        flags.append('Caption alignment evidence is incomplete or original timing is invalid.')
    original_file_hash, new_file_hash = file_sha256(original), file_sha256(replacement)
    report = {'number': item['number'], 'status': 'review-candidates' if flags else 'automated-checks-clear',
              'reviewedAtUtc': datetime.now(timezone.utc).isoformat(),
              'expectedNarrationSource': 'config' if 'expectedNarration' in item else 'parsed-original-captions',
              'inputIdentity': {'originalFileSha256': original_file_hash,
                                'newFileSha256': new_file_hash,
                                'originalUrlSha256': hashlib.sha256(item['originalVideo'].encode()).hexdigest(),
                                'newUrlSha256': hashlib.sha256(item['newVideo'].encode()).hexdigest(),
                                'expectedNarrationSha256': hashlib.sha256(expected.encode()).hexdigest(),
                                'originalVttSha256': hashlib.sha256(vtt.encode()).hexdigest()},
              'expectedDuration': item['expectedDuration'],
              'original': {**old_probe, **old_scan, 'fileSha256': original_file_hash},
              'replacement': {**new_probe, **new_scan, 'fileSha256': new_file_hash}, 'visuals': visuals,
              'newMinusOriginalSeconds': new_probe['duration'] - old_probe['duration'],
              'newAudioMinusVideoStreamSeconds': av_delta, 'speech': speech,
              'asrAudioTimelineOffsetSeconds': audio_offset,
              'asrAudioTimelineOffsetVerified': known_offset,
              'captionAlignment': alignment, 'flags': flags,
              'limitations': 'ASR and technical checks do not certify pronunciation, voice preference, teaching accuracy or perceptual synchronization. No caption or media changes were made.',
              'transcriptFile': f"{item['number']:02}/transcript.json"}
    save_json(work / 'transcript.json', {'model': 'small.en', 'language': 'en',
        'audioTimelineOffsetSeconds': audio_offset, 'audioTimelineOffsetVerified': known_offset,
        'initialPrompt': None, 'text': ' '.join(s['text'] for s in transcript), 'segments': transcript})
    save_json(work / 'review.json', report)
    return {'number': item['number'], 'status': report['status'],
            'duration': new_probe['duration'], 'visualsUnchanged': visuals['unchangedVisualsVerified'],
            'asrCandidateCount': speech['candidateCount'], 'asrSimilarity': speech['similarity'],
            'captionDriftCandidates': alignment['driftCandidateCues'],
            'captionInsufficientAnchors': alignment['insufficientAnchorCues'],
            'longSilenceCount': sum(s['duration'] > 2.5 for s in new_scan['silenceIntervals']),
            'volumeDb': new_scan['volumeDb'], 'flags': flags,
            'reviewFile': f"{item['number']:02}/review.json", 'transcriptFile': report['transcriptFile']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config')
    parser.add_argument('--output-dir', default='/home/user/amg-zoe-qa')
    parser.add_argument('--caption-drift-seconds', type=float, default=.75)
    args = parser.parse_args()
    root = Path(args.output_dir).resolve()
    if not Path('/home/user').is_dir() or not root.is_relative_to('/home/user'):
        raise ReviewFailure('environment', 'Run media review in Higgsfield under /home/user only.')
    config = json.loads(Path(args.config).read_text())
    items = config['items'] if isinstance(config, dict) else config
    required = {'number', 'originalVideo', 'newVideo', 'originalVtt', 'expectedDuration'}
    if not isinstance(items, list) or not items:
        raise ReviewFailure('config', 'Config needs a nonempty items list.')
    numbers = set()
    for item in items:
        if not isinstance(item, dict) or not required.issubset(item):
            raise ReviewFailure('config', 'An item is missing required fields.')
        n = item['number']
        if isinstance(n, bool) or not isinstance(n, int) or not 1 <= n <= 60 or n in numbers:
            raise ReviewFailure('config', 'Lesson numbers must be unique integers1–60.')
        numbers.add(n)
        if not is_url(item['originalVideo']) or not is_url(item['newVideo']):
            raise ReviewFailure('config', 'Both video fields must be HTTP(S) URLs.')
        if 'expectedNarration' in item and (not isinstance(item['expectedNarration'], str) or not tokens(item['expectedNarration'])):
            raise ReviewFailure('config', 'Expected narration must contain text.')
        if not isinstance(item['originalVtt'], str) or not (is_url(item['originalVtt']) or
                item['originalVtt'].lstrip('\ufeff\r\n ').startswith('WEBVTT')):
            raise ReviewFailure('config', 'originalVtt must be WEBVTT text or an HTTP(S) URL.')
        if isinstance(item['expectedDuration'], bool) or not isinstance(item['expectedDuration'], (float, int)) or not math.isfinite(item['expectedDuration']) or item['expectedDuration'] <= 0:
            raise ReviewFailure('config', 'expectedDuration must be positive finite seconds.')
    if not math.isfinite(args.caption_drift_seconds) or args.caption_drift_seconds <= 0:
        raise ReviewFailure('config', 'Caption drift threshold must be positive finite seconds.')
    root.mkdir(parents=True, exist_ok=True)
    from faster_whisper import WhisperModel
    model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=1, num_workers=1)
    started = time.time()
    report = {'startedAtUtc': datetime.now(timezone.utc).isoformat(), 'complete': False,
              'method': 'Independent original/output download, full decode and video frame hashes, audio statistics, full small.en word recognition and caption-to-new-speech alignment. CPU1, sequential. No uploads or edits.',
              'completed': []}
    save_json(root / 'report.json', report)
    for item in items:
        try:
            result = inspect(item, root, model, args.caption_drift_seconds)
        except ReviewFailure as error:
            result = {'number': item['number'], 'status': 'failed', 'stage': error.stage, 'detail': error.detail}
        except Exception as error:
            frames = traceback.extract_tb(error.__traceback__)
            result = {'number': item['number'], 'status': 'failed', 'stage': 'unexpected',
                      'detail': type(error).__name__ + '; config, URLs and exception payload omitted.',
                      'codeLocations': [{'function': f.name, 'line': f.lineno} for f in frames]}
        report['completed'].append(result)
        report['elapsedSeconds'] = round(time.time() - started, 2)
        save_json(root / 'report.json', report)
        print(json.dumps({'lesson': item['number'], 'status': result['status'],
                          'elapsedSeconds': report['elapsedSeconds']}), flush=True)
    report['complete'] = True
    report['finishedAtUtc'] = datetime.now(timezone.utc).isoformat()
    save_json(root / 'report.json', report)
    return 1 if any(r['status'] == 'failed' for r in report['completed']) else 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except ReviewFailure as error:
        print(json.dumps({'status': 'failed', 'stage': error.stage, 'detail': error.detail}), flush=True)
        raise SystemExit(1)
    except Exception:
        print(json.dumps({'status': 'failed', 'stage': 'setup', 'detail': 'Setup failed; config and URLs omitted.'}), flush=True)
        raise SystemExit(1)
