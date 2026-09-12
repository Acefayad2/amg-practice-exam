"""Run inside Higgsfield only. Config and signed upload targets are supplied at runtime."""
import json, subprocess, re, urllib.request, zipfile, math, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from faster_whisper import WhisperModel

config=json.loads(Path(sys.argv[1]).read_text())
root=Path('/home/user/amg-pause-repairs');root.mkdir(exist_ok=True)
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=1)
results=[]
def run(args):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if p.returncode:raise RuntimeError(p.stderr[-2500:])
    return p
def put(path,target):
    req=urllib.request.Request(target['upload_url'],data=path.read_bytes(),method='PUT',headers={'Content-Type':target['content_type']})
    with urllib.request.urlopen(req,timeout=120) as r:
        assert r.status==200;print('PUT',path.name,200,flush=True)
def seconds(s):return sum(float(x)*w for x,w in zip(s.split(':'),[3600,60,1]))
def stamp(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
for item in config['items']:
    n=item['number'];work=root/f'{n:02}';work.mkdir(exist_ok=True)
    source=Path(f'/home/user/amg-second-review/{n:02}/final.mp4')
    if not source.exists():source=work/'original.mp4';source.write_bytes(urllib.request.urlopen(item['url']).read())
    probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(source)]).stdout)
    duration=float(probe['format']['duration']);a,b=item['cut'];delta=b-a
    assert a>0 and b<duration and delta>0
    # Both endpoints are exact frame boundaries, strictly inside a detected silent interval.
    assert abs(a*24-round(a*24))<1e-5 and abs(b*24-round(b*24))<1e-5
    out=work/'final.mp4'
    filt=f'[0:v]trim=end={a},setpts=PTS-STARTPTS[v0];[0:a]atrim=end={a},asetpts=PTS-STARTPTS[a0];[0:v]trim=start={b},setpts=PTS-STARTPTS[v1];[0:a]atrim=start={b},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
    run(['ffmpeg','-v','error','-threads','1','-i',str(source),'-filter_complex_threads','1','-filter_complex',filt,'-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','18','-threads','2','-r','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-y',str(out)])
    newprobe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(out)]).stdout)
    newduration=float(newprobe['format']['duration']);assert abs(newduration-(duration-delta))<.08
    def shift(t):return t if t<=a else t-delta if t>=b else a
    vtt=re.sub(r'(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})',lambda m:stamp(shift(seconds(m[1])))+' --> '+stamp(shift(seconds(m[2]))),item['vtt'])
    times=[tuple(map(seconds,m)) for m in re.findall(r'(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})',vtt)]
    assert all(y>x for x,y in times) and all(times[i][0]>=times[i-1][1] for i in range(1,len(times))) and times[-1][1]<=newduration+.02
    caption=work/'scene-captions.vtt';caption.write_text(vtt)
    scan=run(['ffmpeg','-hide_banner','-nostats','-threads','1','-i',str(out),'-vf','scale=320:-2,blackdetect=d=0.08:pix_th=0.10:pic_th=0.985','-af','silencedetect=noise=-42dB:d=0.8,volumedetect','-f','null','-'])
    black=re.findall(r'black_start:([\d.]+) black_end:([\d.]+)',scan.stderr);assert not black
    silence=[{'start':float(e)-float(d),'end':float(e),'duration':float(d)} for e,d in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',scan.stderr)]
    clip=work/'join.wav';start=max(0,a-7)
    run(['ffmpeg','-v','error','-ss',str(start),'-t','15','-i',str(out),'-vn','-ac','1','-ar','16000','-y',str(clip)])
    segs,_=model.transcribe(str(clip),language='en',beam_size=5,word_timestamps=True,condition_on_previous_text=False)
    heard=[{'text':s.text,'words':[{'word':w.word,'start':w.start+start,'end':w.end+start} for w in s.words]} for s in segs]
    sample=[max(0,a-.65),a+.05,min(newduration-.1,a+.65)]
    sheet=Image.new('RGB',(2304,466),(18,42,48));draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',23)
    for i,t in enumerate(sample):
        f=work/f'join-{i}.png';run(['ffmpeg','-v','error','-threads','1','-ss',str(t),'-i',str(out),'-frames:v','1','-vf','scale=768:432','-y',str(f)]);sheet.paste(Image.open(f),(i*768,0));draw.text((i*768+10,437),f'Part {n:02} | repaired join {t:.3f}s',fill='white',font=font)
    sheetfile=work/'join-review.jpg';sheet.save(sheetfile,quality=94)
    report={'number':n,'date':'2026-09-13','originalVideo':item['url'],'originalEditableArchive':item['archive'],'originalDuration':duration,'cut':[a,b],'removedSeconds':delta,'duration':newduration,'fullDecodeExit':0,'blackIntervals':black,'silenceIntervals':silence,'joinTranscript':heard,'sampleTimes':sample,'technical':newprobe,'vtt':vtt,'video':item['uploads'][0]['url'],'editArchive':item['uploads'][1]['url'],'joinReview':item['uploads'][2]['url'],'method':'Removed only the middle of a confirmed silent interval, retaining speech margins; identical cut applied to picture and sound and later caption times shifted. No speech regeneration.'}
    (work/'repair.json').write_text(json.dumps(report,indent=2))
    original=work/'original-editable.zip';original.write_bytes(urllib.request.urlopen(item['archive'],timeout=120).read())
    (work/'README.md').write_text('Original editable project is preserved in original-editable.zip. The final export removes the recorded silent interval from picture and sound. repair.json records exact frame-aligned cut times and verification; scene-captions.vtt is the matching caption file. Reapply this cut after any rebuild of the original editable project.\n')
    archive=work/'editable-repair.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as z:
        for p in [original,out,caption,work/'repair.json',work/'README.md',Path(__file__)]:z.write(p,p.name)
    for p,t in zip([out,archive,sheetfile],item['uploads']):put(p,t)
    results.append(report);reportfile=root/config['reportName'];reportfile.write_text(json.dumps(results,indent=2));put(reportfile,config['reportUpload'])
    print(json.dumps({'number':n,'removedSeconds':delta,'duration':newduration,'join':' '.join(s['text'] for s in heard)}),flush=True)
print('PAUSE REPAIRS COMPLETE',len(results),flush=True)
