"""Prepare a measured, bounded Zoe speech patch inside native Higgsfield only.

Existing generated audio is required. This does not generate or upload media.
Config requires inputPath/inputFileSha256, generation, trimStart/trimEnd,
targetDuration, patchAt, channels (1/2), sampleRate (48000), and sentence.
All trim and placement choices must be based on actual audio review.
"""
import argparse
import gc
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Native speech preparation failed; inspect its known files safely')
    return result


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def recognize(model, path, offset):
    segments, _ = model.transcribe(str(path), language='en', beam_size=5,
        temperature=0, word_timestamps=True, vad_filter=False,
        condition_on_previous_text=False, initial_prompt=None)
    rows = [{'text': s.text.strip(), 'start': float(s.start) + offset,
        'end': float(s.end) + offset,
        'words': [{'word': w.word, 'start': float(w.start) + offset,
                   'end': float(w.end) + offset} for w in s.words or []]}
        for s in segments]
    return {'status': 'recognized-awaiting-review', 'text': ' '.join(s['text'] for s in rows), 'segments': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config')
    parser.add_argument('--output-dir', required=True)
    args = parser.parse_args()
    config_path = Path(args.config)
    c = json.loads(config_path.read_text())
    source, folder = Path(c['inputPath']), Path(args.output_dir)
    if not str(source).startswith('/home/user/') or not str(folder).startswith('/home/user/'):
        raise ValueError('Existing native sandbox input and output paths are required')
    assert sha(source) == c['inputFileSha256'], 'Generated audio identity mismatch'
    generation = c['generation']
    assert generation['status'] == 'completed' and generation['model'] == 'seed_audio'
    assert generation['voiceId'] == 'd0374db1-44b9-4f05-939e-0a9ae9dbbe6a'
    assert generation['voiceType'] == 'preset' and generation['jobId']
    assert c['channels'] in [1, 2] and c['sampleRate'] == 48000
    probe = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(source)]).stdout)
    duration = float(probe['format']['duration'])
    start, end, target, at = map(float, [c['trimStart'], c['trimEnd'], c['targetDuration'], c['patchAt']])
    assert 0 <= start < end <= duration + .001 and target > 0 and at >= 0
    tempo = (end - start) / target
    assert .80 <= tempo <= 1.20, 'Reconsider the wording or placement instead of extreme tempo changes'
    folder.mkdir(parents=True, exist_ok=False)
    layout = 'mono' if c['channels'] == 1 else 'stereo'
    head = f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS,atempo={tempo},aformat=channel_layouts={layout},'
    measurement_text = run(['ffmpeg', '-hide_banner', '-nostats', '-threads', '1', '-i', str(source), '-af', head + 'loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']).stderr
    measured = json.loads(measurement_text[measurement_text.rfind('{'):])
    normalizer = 'loudnorm=I=-18:TP=-2:LRA=7:' + ':'.join(f'{a}={measured[b]}' for a, b in [('measured_I', 'input_i'), ('measured_LRA', 'input_lra'), ('measured_TP', 'input_tp'), ('measured_thresh', 'input_thresh'), ('offset', 'target_offset')]) + ':linear=true'
    fade_in, fade_out = float(c.get('fadeIn', .010)), float(c.get('fadeOut', .025))
    assert 0 <= fade_in <= .030 and 0 <= fade_out <= .050 and fade_in + fade_out < target
    tail = f',aresample=48000,aformat=channel_layouts={layout},apad=whole_dur={target},atrim=duration={target},afade=t=in:d={fade_in},afade=t=out:st={target-fade_out}:d={fade_out}'
    pcm, wav = folder / 'prepared.f32', folder / 'prepared.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-threads', '1', '-i', str(source), '-af', head + normalizer + tail, '-ar', '48000', '-ac', str(c['channels']), '-f', 'f32le', str(pcm)])
    samples = pcm.stat().st_size // (4 * c['channels'])
    assert abs(samples / 48000 - target) <= 1 / 48000
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', '48000', '-ac', str(c['channels']), '-i', str(pcm), '-c:a', 'pcm_s16le', str(wav)])
    stats = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(wav), '-af', 'silencedetect=noise=-40dB:d=0.06,loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']).stderr
    loudness = json.loads(stats[stats.rfind('{'):])
    assert float(loudness['input_tp']) <= -1.0, 'Prepared speech peak needs correction'
    report = {'status': 'prepared-awaiting-recognition-and-review', 'createdAt': datetime.now(timezone.utc).isoformat(),
        'number': c['number'], 'sentence': c['sentence'], 'generation': generation,
        'generatedAudioFileSha256': sha(source), 'preparedPcmPath': str(pcm),
        'preparedPcmSha256': sha(pcm), 'preparedPcmChannels': c['channels'], 'preparedPcmSampleRate': 48000,
        'patchAt': at, 'patchDuration': samples / 48000, 'trimStart': start, 'trimEnd': end, 'tempo': tempo,
        'fadesSeconds': [fade_in, fade_out], 'normalizationInputMeasurement': measured,
        'preparedLoudness': loudness, 'audioStats': stats, 'configSha256': sha(config_path),
        'scriptSha256': sha(Path(__file__)), 'recognition': {}, 'recognitionPasses': 0,
        'limitations': 'Recognition and loudness do not establish acceptance. Review the sentence, pronunciation, timing and joins in the final MP4 separately.'}
    output = folder / 'preparation.json'
    def save():
        temporary = output.with_suffix('.tmp')
        temporary.write_text(json.dumps(report, indent=2) + '\n')
        temporary.replace(output)
    save()
    from faster_whisper import WhisperModel
    for name in ['base.en', 'small.en']:
        model = WhisperModel(name, device='cpu', compute_type='int8', cpu_threads=1, num_workers=1)
        report['recognition'][name] = {}
        for role, path, offset in [('generated', source, 0), ('prepared', wav, at)]:
            report['recognition'][name][role] = recognize(model, path, offset)
            report['recognitionPasses'] += 1
            save()
        del model
        gc.collect()
    report['status'] = 'prepared-and-recognized-awaiting-review'
    save()
    print(json.dumps({'number': c['number'], 'status': report['status'], 'preparedPcmSha256': report['preparedPcmSha256'], 'recognitionPasses': report['recognitionPasses'], 'patchDuration': report['patchDuration'], 'tempo': tempo}))


if __name__ == '__main__':
    main()
