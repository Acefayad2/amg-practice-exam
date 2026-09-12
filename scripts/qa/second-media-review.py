"""Run in the Higgsfield sandbox with a supplied config; no local media processing."""
import json, os, re, subprocess, time, urllib.request, concurrent.futures, threading, difflib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from faster_whisper import WhisperModel

root=Path('/home/user/amg-second-review');root.mkdir(exist_ok=True)
config=json.loads(Path('/home/user/amg-second-review-config.json').read_text())
results=[];lock=threading.Lock();started=time.time()
def download(url,path):
    with urllib.request.urlopen(url,timeout=120) as response: path.write_bytes(response.read())
def upload(path, target):
    req=urllib.request.Request(target['upload_url'],data=path.read_bytes(),method='PUT',headers={'Content-Type':target['content_type']})
    with urllib.request.urlopen(req,timeout=120) as response:
        if response.status!=200:raise RuntimeError('Output PUT failed: '+str(response.status))
def run(args):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    return p
def tokens(s):return re.findall(r"[a-z0-9]+(?:'[a-z]+)?",s.lower().replace('’',"'"))
print('Loading independent small.en speech model',flush=True)
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=2,num_workers=2)
print('Speech model ready',flush=True)
def inspect(item):
    n=item['number'];work=root/f'{n:02}';work.mkdir(exist_ok=True);movie=work/'final.mp4';caption=work/'final.vtt'
    download(item['url'],movie);download(item['captionUrl'],caption)
    probe=run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(movie)])
    if probe.returncode:raise RuntimeError('probe failed '+str(n))
    info=json.loads(probe.stdout);duration=float(info['format']['duration'])
    scan=run(['ffmpeg','-hide_banner','-nostats','-threads','1','-i',str(movie),'-vf','scale=320:-2,blackdetect=d=0.08:pix_th=0.10:pic_th=0.985','-af','silencedetect=noise=-42dB:d=0.8,volumedetect','-f','null','-'])
    log=scan.stderr;(work/'decode.log').write_text(log)
    black=[{'start':float(a),'end':float(b),'duration':float(c)} for a,b,c in re.findall(r'black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)',log)]
    silence=[{'end':float(a),'duration':float(b),'start':float(a)-float(b)} for a,b in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',log)]
    vol={a:float(b) for a,b in re.findall(r'(mean_volume|max_volume): ([-\d.]+) dB',log)}
    errors=[l for l in log.splitlines() if re.search(r'Error|Invalid|corrupt|non.monoton|missing picture|failed',l,re.I)]
    wav=work/'speech.wav';extract=run(['ffmpeg','-v','error','-threads','1','-i',str(movie),'-vn','-ac','1','-ar','16000','-y',str(wav)])
    if extract.returncode:raise RuntimeError('audio extraction failed '+str(n))
    segs,meta=model.transcribe(str(wav),language='en',beam_size=5,word_timestamps=True,vad_filter=False,condition_on_previous_text=False)
    speech=[{'start':s.start,'end':s.end,'text':s.text.strip(),'avg_logprob':s.avg_logprob,'no_speech_prob':s.no_speech_prob,'words':[{'start':w.start,'end':w.end,'word':w.word,'probability':w.probability} for w in (s.words or [])]} for s in segs]
    said=' '.join(s['text'] for s in speech)
    cues=[]
    for chunk in re.split(r'\n\s*\n',caption.read_text()):
        if '-->' not in chunk:continue
        cues.append(' '.join(l for l in chunk.splitlines() if not re.match(r'^\d+$',l.strip()) and '-->' not in l))
    expected=' '.join(cues);a,b=tokens(expected),tokens(said);matcher=difflib.SequenceMatcher(None,a,b,autojunk=False)
    differences=[]
    for tag,i,j,k,l in matcher.get_opcodes():
        if tag!='equal':differences.append({'kind':tag,'caption':' '.join(a[max(0,i-3):min(len(a),j+3)]),'heard':' '.join(b[max(0,k-3):min(len(b),l+3)]),'captionWords':j-i,'heardWords':l-k})
    times=sorted(set([0.6,min(9.5,duration/2)]+[round(duration*x/10,2) for x in range(1,10)]+[round(duration-0.7,2)]))
    sheet=Image.new('RGB',(2304,4*466),(18,42,48));draw=ImageDraw.Draw(sheet)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',23)
    for i,t in enumerate(times):
        frame=work/f'frame-{i}.png';shot=run(['ffmpeg','-v','error','-threads','1','-ss',str(t),'-i',str(movie),'-frames:v','1','-vf','scale=768:432','-y',str(frame)])
        if shot.returncode:raise RuntimeError('frame failed '+str(n))
        image=Image.open(frame);x=(i%3)*768;y=(i//3)*466;sheet.paste(image,(x,y));draw.text((x+10,y+435),f'Part {n:02}  |  {t:.2f} / {duration:.2f}s',fill='white',font=font)
    sheetpath=work/'contact.jpg';sheet.save(sheetpath,quality=92)
    upload(sheetpath,item['sheetUpload'])
    result={'number':n,'sourceVideo':item['url'],'sourceCaptions':item['captionUrl'],'duration':duration,'streams':[{k:s.get(k) for k in ['codec_type','codec_name','width','height','r_frame_rate','sample_rate','channels','start_time','duration']} for s in info['streams']],'fullDecodeExit':scan.returncode,'decodeErrors':errors,'blackIntervals':black,'silenceIntervals':silence,'volumeDb':vol,'asrModel':'small.en','captionAsrSimilarity':matcher.ratio(),'differences':differences,'transcript':speech,'contactSheetUrl':item['sheetUpload'].get('url'),'contactSheetMediaId':item['sheetUpload']['media_id'],'sampleTimes':times}
    with lock:
        results.append(result);report=root/'report.json';report.write_text(json.dumps({'reviewDate':'2026-09-13','method':'Independent whole-file decode, audio/black-screen scan, full small.en transcription comparison and 12-frame contact sheet per video. ASR differences are candidates, not automatically errors. Static diagrams are intentional.','completed':sorted(results,key=lambda x:x['number'])},indent=2));upload(report,config['reportUpload'])
        print(json.dumps({'lesson':n,'duration':duration,'decode':scan.returncode,'black':black,'longSilences':[s for s in silence if s['duration']>1.6],'volume':vol,'asrSimilarity':round(matcher.ratio(),4),'diffCount':len(differences),'elapsed':round(time.time()-started)}),flush=True)
    return n
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    futures={pool.submit(inspect,item):item['number'] for item in config['items']}
    for f in concurrent.futures.as_completed(futures):
        try:f.result()
        except Exception as e:print('FAILED '+str(futures[f])+' '+repr(e),flush=True);raise
print('BATCH COMPLETE '+str(len(results)),flush=True)
