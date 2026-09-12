"""Run inside Higgsfield only. Trim one independently confirmed duplicate phrase.

Runtime config supplies source URLs, captions, exact cut and signed output targets.
Signed targets are never included in reports or the editable archive.
"""
import json
import re
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from faster_whisper import WhisperModel


def run(args):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-3000:])
    return result


def download(url, path):
    with urllib.request.urlopen(url, timeout=120) as response:
        path.write_bytes(response.read())


def put(path, target):
    request = urllib.request.Request(target['upload_url'], data=path.read_bytes(), method='PUT',
                                    headers={'Content-Type': target['content_type']})
    with urllib.request.urlopen(request, timeout=120) as response:
        assert response.status == 200
    print('PUT', path.name, 200, flush=True)


def seconds(value):
    return sum(float(x) * w for x, w in zip(value.split(':'), [3600, 60, 1]))


def stamp(value):
    ms = round(value * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}.{ms % 1000:03}'


def silence_intervals(log, offset=0):
    return [{'start': float(end) - float(duration) + offset,
             'end': float(end) + offset, 'duration': float(duration)}
            for end, duration in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)', log)]


def caption_text(vtt):
    return ' '.join(line.strip() for line in vtt.splitlines()
                    if line.strip() and line != 'WEBVTT' and '-->' not in line and not line.isdigit())


def main():
    config = json.loads(Path(sys.argv[1]).read_text())
    root = Path('/home/user/amg-part60-duplicate-repair')
    root.mkdir(exist_ok=True)
    source = root / 'original.mp4'
    download(config['url'], source)
    original_archive = root / 'original-editable.zip'
    download(config['archive'], original_archive)
    probe = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(source)]).stdout)
    duration = float(probe['format']['duration'])
    start, end = config['cut']
    removed = end - start
    assert 0 < start < end < duration
    assert abs(start * 24 - round(start * 24)) < 1e-5
    assert abs(end * 24 - round(end * 24)) < 1e-5

    # The removed interval contains redundant speech. Only its two endpoints are quiet.
    scan_start = start - 2
    boundary_scan = run(['ffmpeg', '-hide_banner', '-nostats', '-ss', str(scan_start), '-t', str(removed + 4),
                         '-i', str(source), '-vn', '-af', 'silencedetect=noise=-40dB:d=0.08', '-f', 'null', '-'])
    boundary_quiet = silence_intervals(boundary_scan.stderr, scan_start)
    assert all(any(gap['start'] < point < gap['end'] for gap in boundary_quiet) for point in [start, end]), boundary_quiet

    out = root / 'final.mp4'
    filters = (f'[0:v]trim=end={start},setpts=PTS-STARTPTS[v0];'
               f'[0:a]atrim=end={start},asetpts=PTS-STARTPTS[a0];'
               f'[0:v]trim=start={end},setpts=PTS-STARTPTS[v1];'
               f'[0:a]atrim=start={end},asetpts=PTS-STARTPTS[a1];'
               '[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]')
    run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(source), '-filter_complex_threads', '1',
         '-filter_complex', filters, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'fast',
         '-crf', '18', '-threads', '2', '-r', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
         '-ar', '48000', '-movflags', '+faststart', '-y', str(out)])
    newprobe = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(out)]).stdout)
    newduration = float(newprobe['format']['duration'])
    assert abs(newduration - (duration - removed)) < .08
    before_video = next(x for x in probe['streams'] if x['codec_type'] == 'video')
    after_video = next(x for x in newprobe['streams'] if x['codec_type'] == 'video')
    assert int(before_video['nb_frames']) - int(after_video['nb_frames']) == round(removed * 24)

    def shift(t):
        return t if t <= start else t - removed if t >= end else start

    vtt = re.sub(r'(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})',
                 lambda m: stamp(shift(seconds(m[1]))) + ' --> ' + stamp(shift(seconds(m[2]))), config['vtt'])
    times = [tuple(map(seconds, match)) for match in re.findall(r'(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})', vtt)]
    assert all(b > a for a, b in times)
    assert all(times[i][0] >= times[i-1][1] for i in range(1, len(times)))
    assert times[-1][1] <= newduration + .02
    assert caption_text(vtt) == caption_text(config['vtt'])
    caption = root / 'scene-captions.vtt'
    caption.write_text(vtt)

    scan = run(['ffmpeg', '-hide_banner', '-nostats', '-threads', '1', '-i', str(out),
                '-vf', 'scale=320:-2,blackdetect=d=0.08:pix_th=0.10:pic_th=0.985',
                '-af', 'silencedetect=noise=-42dB:d=0.8,volumedetect', '-f', 'null', '-'])
    black = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', scan.stderr)
    assert not black
    clip = root / 'join.wav'
    clip_start = start - 7
    run(['ffmpeg', '-v', 'error', '-ss', str(clip_start), '-t', '22', '-i', str(out), '-vn', '-ac', '1', '-ar', '16000', '-y', str(clip)])
    transcripts = []
    for name in ['small.en', 'base.en']:
        model = WhisperModel(name, device='cpu', compute_type='int8', cpu_threads=1)
        segments, info = model.transcribe(str(clip), language='en', beam_size=5, word_timestamps=True,
                                          condition_on_previous_text=False)
        heard = [{'text': segment.text,
                  'words': [{'word': word.word, 'start': word.start + clip_start, 'end': word.end + clip_start}
                            for word in segment.words]} for segment in segments]
        joined = ' '.join(segment['text'] for segment in heard)
        normalized = re.sub(r'[^a-z0-9 ]', ' ', joined.lower())
        transcripts.append({'model': name, 'segments': heard, 'lifeOptionOccurrences': len(re.findall(r'life\s+option', normalized))})
        print('JOIN_ASR', name, joined, flush=True)
        del model

    audio_preview = root / 'join.mp3'
    run(['ffmpeg', '-v', 'error', '-i', str(clip), '-c:a', 'libmp3lame', '-b:a', '192k', '-y', str(audio_preview)])

    samples = [('before source', source, start-.35), ('after source', source, end+.05),
               ('repaired before join', out, start-.35), ('repaired after join', out, start+.05),
               ('repaired sentence', out, start+1), ('repaired sentence', out, start+4)]
    width, height, bar = 960, 540, 34
    sheet = Image.new('RGB', (width*2, (height+bar)*3), '#112d35')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
    for i, (label, video, t) in enumerate(samples):
        frame = root / f'join-{i:02}.png'
        run(['ffmpeg', '-v', 'error', '-threads', '1', '-ss', str(t), '-i', str(video), '-frames:v', '1',
             '-vf', f'scale={width}:{height}', '-y', str(frame)])
        x, y = i%2*width, i//2*(height+bar)
        sheet.paste(Image.open(frame), (x, y))
        draw.text((x+12, y+height+5), f'PART 60 | {label} | {t:.3f}s', fill='white', font=font)
    sheetfile = root / 'join-review.jpg'
    sheet.save(sheetfile, quality=94)
    report = {'number': 60, 'date': '2026-09-13', 'originalVideo': config['url'],
              'originalEditableArchive': config['archive'], 'originalDuration': duration, 'cut': [start, end],
              'removedSeconds': removed, 'removedVideoFrames': round(removed*24), 'duration': newduration,
              'method': 'Removed only the first duplicated spoken phrase "A life option"; retained the full second sentence. Both endpoints lie in quiet gaps. Identical frame-aligned cut applied to picture and sound. Caption word sequence preserved and later times shifted. No generated speech.',
              'boundaryQuietIntervals': boundary_quiet, 'fullDecodeExit': 0, 'blackIntervals': black,
              'silenceIntervals': silence_intervals(scan.stderr), 'joinTranscripts': transcripts,
              'samples': [{'label': label, 'time': t} for label, video, t in samples],
              'technical': newprobe, 'originalTechnical': probe, 'vtt': vtt,
              'captionTextUnchanged': True, 'captionCueCount': len(times), 'generationCalls': 0,
              'video': config['uploads'][0]['url'], 'editArchive': config['uploads'][1]['url'],
              'joinReview': config['uploads'][2]['url'], 'joinAudio': config['uploads'][4]['url']}
    report_path = root / 'repair.json'
    report_path.write_text(json.dumps(report, indent=2)+'\n')
    (root / 'README.md').write_text('AMG Part 60 duplicate-phrase correction.\n\n'
        'The original editable project is preserved unchanged in original-editable.zip. The final export removes only '
        'the first duplicated spoken phrase "A life option" at original seconds 157.875–159.000 from picture and sound. '
        'This is a duplicate-speech repair, not removal of a silent interval. Both cut endpoints are in quiet gaps. '
        'repair.json records exact timings, technical checks, joined-speech transcripts and matching captions. '
        'Reapply this recorded cut after rebuilding the original editable project; do not regenerate narration. '
        'The reusable repair script takes a runtime JSON config with the original URLs, original VTT and cut values; '
        'upload slots must be supplied separately and are deliberately omitted from this archive.\n')
    archive = root / 'editable-duplicate-repair.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as handle:
        for path in [original_archive, out, caption, report_path, root/'README.md', Path(__file__)]:
            handle.write(path, path.name)
    for path, target in zip([out, archive, sheetfile, report_path, audio_preview], config['uploads']):
        put(path, target)
    print(json.dumps({'number': 60, 'duration': newduration, 'removedSeconds': removed,
                      'audioModels': [x['model'] for x in transcripts],
                      'lifeOptionOccurrences': [x['lifeOptionOccurrences'] for x in transcripts]}), flush=True)


if __name__ == '__main__':
    main()
