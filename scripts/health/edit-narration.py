"""Restore a sentence or remove a duplicate in verified quiet gaps, then transcribe the finished MP3."""
import argparse, importlib.util, json, shutil, subprocess, tempfile
from pathlib import Path
import numpy as np

def module(name):
    s=importlib.util.spec_from_file_location(name,Path(__file__).with_name(name+".py"));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def quiet(wave, boundary):
    if not 240<=boundary<=len(wave)-240 or np.sqrt(np.mean(wave[boundary-240:boundary+240]**2))>.009:
        raise ValueError('Edit boundary is not quiet')

if __name__=="__main__":
    qa=module("review-narration"); mastering=module("master-narration")
    a=argparse.ArgumentParser(description=__doc__);a.add_argument("--output",type=Path,required=True);a.add_argument("--model",required=True);a.add_argument("--index",type=int);args=a.parse_args()
    docs=qa.ROOT/'docs/course/health';out=args.output;ed=out/'voice-edits';ed.mkdir(parents=True,exist_ok=True)
    jobs={}
    for file in sorted(list(docs.glob('audio-*-*.json'))+list(docs.glob('retakes-*.json'))):
        r=json.loads(file.read_text()); original=file.name.startswith('audio-')
        folder=out/('voice-qa' if original else 'retake-'+file.stem.split('-')[1])
        for j in r['jobs']:
            if j['status']=='completed':
                p=next(x['params'] for x in r['params'] if x['index']==j['index'])
                jobs[j['job_id']]=(j,p,folder)
    for jid,edit in json.loads((docs/'narration-edits.json').read_text()).items():
        i=edit['index']
        if args.index is not None and i!=args.index:continue
        j,params,folder=jobs[jid]
        if j['index']!=i:raise ValueError('Wrong recording')
        expected=params['prompt']
        raw=mastering.decode(folder/(str(i)+'.mp3'));r=json.loads((folder/(str(i)+'.json')).read_text())
        parts=[];prev=0;removed=0;prefix=edit.get('prefix')
        if prefix:
            other,other_params,other_folder=jobs[prefix['job_id']]
            if other['index']!=i or other_params['voice_id']!=params['voice_id']:raise ValueError('Incompatible source sentence')
            src=mastering.decode(other_folder/(str(i)+'.mp3'))
            end=round(prefix['end']*24000);prev=round(prefix['resume']*24000)
            quiet(src,end);quiet(raw,prev);parts.append(src[:end])
        for start,end in edit.get('cuts',[]):
            lo,hi=round(start*24000),round(end*24000)
            if not prev<=lo<hi<len(raw):raise ValueError('Edit falls outside the recording')
            quiet(raw,lo);quiet(raw,hi);parts.append(raw[prev:lo]);prev=hi;removed+=hi-lo
        parts.append(raw[prev:]);pcm=np.concatenate(parts);base=str(i)+'-'+jid[:8]
        if prefix:r={**r,'duration_sec':len(pcm)/24000,'wpm':60*len(expected.split())/(len(pcm)/24000)}
        with tempfile.TemporaryDirectory() as folder:
            wav=Path(folder)/'edit.wav'
            subprocess.run(['ffmpeg','-v','error','-f','f32le','-ar','24000','-ac','2','-i','pipe:0','-c:a','pcm_f32le',str(wav)],input=pcm.astype(np.float32).tobytes(),check=True)
            mastering.master(wav,r,out/'voice-masters')
        meta=out/'voice-masters'/(base+'.json');info=json.loads(meta.read_text())
        if removed:info['removed_duplicate_sec']=round(removed/24000,2)
        if prefix:info['restored_prefix_from']=prefix['job_id']
        qa.atomic(meta,info)
        shutil.copyfile(out/'voice-masters'/(base+'.mp3'),ed/(str(i)+'.mp3'))
        result=qa.audit(j,expected,args.model,ed);qa.atomic(ed/(str(i)+'.json'),result);print(i,result['similarity'],result['differences'],flush=True)
