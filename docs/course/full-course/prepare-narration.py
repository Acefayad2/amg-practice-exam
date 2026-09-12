import json,subprocess,re,difflib,wave
from pathlib import Path
from faster_whisper import WhisperModel
requests=json.loads(Path('narration-input.json').read_text())
model=WhisperModel('base.en',device='cpu',compute_type='int8')
def norm(s):return re.sub(r'[^a-z0-9]','',s.lower())
def stamp(v):
 m,s=divmod(round(v*1000),60000); h,m=divmod(m,60);return f'{h:02d}:{m:02d}:{s//1000:02d}.{s%1000:03d}'
allwords=[]; paragraphs=[]; offset=0.; metrics=[]; waves=[]
for i,item in enumerate(requests):
 f=f'audio-{i}.mp3'
 subprocess.run(['curl','-fsSL',item['url'],'-o',f],check=True)
 out=f'audio-{i}.wav'
 subprocess.run(['ffmpeg','-y','-v','error','-i',f,'-ar','48000','-ac','1','-c:a','pcm_s16le',out],check=True)
 with wave.open(out,'rb') as w: frames=w.readframes(w.getnframes()); dur=w.getnframes()/w.getframerate()
 waves.append(frames)
 segments,_=model.transcribe(out,language='en',word_timestamps=True,beam_size=5)
 heard=[{'word':w.word.strip(),'start':w.start,'end':w.end} for seg in segments for w in seg.words]
 original=item['text'].split()
 matcher=difflib.SequenceMatcher(None,[norm(w) for w in original],[norm(w['word']) for w in heard],autojunk=False)
 starts=[None]*len(original); ends=[None]*len(original)
 for tag,a,b,c,d in matcher.get_opcodes():
  if tag=='equal':
   for n,j in zip(range(a,b),range(c,d)):starts[n]=heard[j]['start'];ends[n]=heard[j]['end']
  elif b>a:
   left=heard[c]['start'] if c<len(heard) else dur
   right=heard[d-1]['end'] if d>c else left+0.15*(b-a)
   right=min(dur,right)
   for n in range(a,b):
    starts[n]=left+(right-left)*(n-a)/(b-a);ends[n]=left+(right-left)*(n-a+1)/(b-a)
 aligned=[{'word':word,'start':offset+starts[j],'end':offset+ends[j]} for j,word in enumerate(original)]
 allwords+=aligned
 cursor=0
 for p in item['text'].split('\n\n'):
  count=len(p.split())
  paragraphs.append({'text':p,'start':aligned[cursor]['start'],'end':aligned[cursor+count-1]['end']})
  cursor+=count
 metrics.append({'index':i,'start':offset,'duration':dur,'match_ratio':round(matcher.ratio(),3),'heard':' '.join(w['word'] for w in heard)})
 print('SECTION',i,'DURATION',dur,'MATCH',round(matcher.ratio(),3),flush=True)
 offset+=dur+0.45
# Include a short pause between narration sections.
with wave.open('narration.wav','wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000)
 for i,frames in enumerate(waves):
  w.writeframes(frames)
  if i<len(waves)-1:w.writeframes(bytes(round(0.45*48000)*2))
offset-=0.45
groups=[]; current=[]
for word in allwords:
 if current and (len(current)>=11 or len(' '.join(x['word'] for x in current))+len(word['word'])>76 or word['start']-current[0]['start']>5):
  groups.append(current);current=[]
 current.append(word)
 if word['word'].endswith(('.', '?', '!')) and len(current)>=4:groups.append(current);current=[]
if current:groups.append(current)
vtt='WEBVTT\n\n'
for i,g in enumerate(groups):
 end=min(g[-1]['end']+0.08,groups[i+1][0]['start'] if i+1<len(groups) else offset)
 vtt+=f"{i+1}\n{stamp(g[0]['start'])} --> {stamp(max(end,g[0]['start']+0.1))}\n"+' '.join(x['word'] for x in g)+'\n\n'
Path('narration.vtt').write_text(vtt)
timing={'opening_duration':0,'duration':offset+1.2,'sections':metrics,'paragraphs':paragraphs,'words':allwords}
Path('timing.json').write_text(json.dumps(timing,indent=2))
print(json.dumps({'duration':timing['duration'],'sections':metrics},indent=2))
