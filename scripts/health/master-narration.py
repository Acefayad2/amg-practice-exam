"""Prepare same-origin speech files: shorten only extended silence, set consistent levels, full-decode the result."""
import argparse, hashlib, json, math, re, subprocess, time
from pathlib import Path
import numpy as np

def decode(file):
    return np.frombuffer(subprocess.check_output(["ffmpeg","-v","error","-nostdin","-xerror","-i",str(file),"-ac","2","-ar","24000","-f","f32le","-"]),np.float32).reshape(-1,2)

def master(src,r,out):
    rate=24000; step=480; original=decode(src)
    x=original.mean(axis=1)
    if np.mean(x*x) < .4*np.mean(original*original): raise ValueError("Potential stereo phase cancellation")
    padded=np.pad(x,(0,(-len(x))%step)).reshape(-1,step)
    quiet=np.sqrt(np.mean(padded*padded,axis=1))<10**(-48/20)
    edge=np.flatnonzero(np.diff(np.r_[False,quiet,False].astype(int)))
    cuts=[]; gaps=[]
    for i,j in zip(edge[::2],edge[1::2]):
        a=int(i)*step;b=min(len(x),int(j)*step);sec=(b-a)/rate
        if a==0 and sec>.25: cuts.append((a,b-int(.18*rate)))
        elif b==len(x) and sec>.38: cuts.append((a+int(.26*rate),b))
        elif sec>1.6: cuts.append((a+int(.39*rate),b-int(.39*rate)));gaps.append(sec)
    parts=[];prev=0
    for a,b in cuts:parts.append(x[prev:a]);prev=b
    parts.append(x[prev:]); y=np.concatenate(parts)
    voiced=padded[~quiet]
    rms=math.sqrt(float(np.mean(voiced*voiced))); peak=float(np.max(np.abs(y)))
    gain=min(10**(-19/20)/max(rms,1e-8),10**(-2.2/20)/max(peak,1e-8),1.8)
    stem=str(r["index"])+"-"+r["job_id"][:8]; target=out/(stem+".mp3"); temp=out/(stem+".tmp.mp3")
    # Most sections already sit comfortably at their natural pace. Only slow a
    # rushed take; FFmpeg's overlap-add tempo filter preserves the speaker's pitch.
    words=r["wpm"]*r["duration_sec"]/60
    pace=words*60*rate/len(y)
    tempo=max(.85,188/pace) if pace>195 else 1.
    tempo_filter=["-af",f"atempo={tempo:.6f}"] if tempo<1 else []
    subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-f","f32le","-ar",str(rate),"-ac","1","-i","pipe:0",*tempo_filter,"-map_metadata","-1","-codec:a","libmp3lame","-q:a","4",str(temp)],input=(y*gain).astype(np.float32).tobytes(),check=True)
    # Decode as mono to compare actual output samples without a stereo mix gain.
    rendered=np.frombuffer(subprocess.check_output(["ffmpeg","-v","error","-nostdin","-xerror","-i",str(temp),"-ac","1","-ar",str(rate),"-f","f32le","-"]),np.float32)
    seconds=len(rendered)/rate; pk=float(max(abs(rendered)))
    if abs(seconds-len(y)/rate/tempo)>(.16 if tempo<1 else .055) or pk>=1.001 or np.sqrt(np.mean(rendered**2))<.018:
        raise ValueError("Master validation failed: "+str(r["index"]))
    temp.replace(target)
    d={"index":r["index"],"job_id":r["job_id"],"file":target.name,"sha256":hashlib.sha256(target.read_bytes()).hexdigest(),"duration_sec":round(seconds,2),"original_sec":r["duration_sec"],"silence_removed_sec":round((len(x)-len(y))/rate,2),"long_gaps_shortened":len(gaps),"longest_gap_before_sec":round(max(gaps,default=0),2),"peak_db":round(20*math.log10(pk),1),"wpm":round(r["wpm"]*r["duration_sec"]/seconds),"gain_db":round(20*math.log10(gain),1),"tempo_factor":round(tempo,4)}
    meta=out/(stem+".json"); t=meta.with_suffix(".tmp");t.write_text(json.dumps(d,indent=2)+"\n");t.replace(meta)

if __name__=="__main__":
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument("--source",type=Path,required=True);ap.add_argument("--out",type=Path,required=True)
    ap.add_argument("--watch",action="store_true");args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    while True:
        reports=list(args.source.glob("[0-9]*.json"))
        for f in reports:
            r=json.loads(f.read_text());jid=r['job_id']
            if not re.fullmatch(r"[0-9a-f-]{36}",jid):raise ValueError("Invalid receipt ID")
            if r.get("version")!=2:continue
            meta=args.out/(str(r['index'])+"-"+jid[:8]+".json")
            if meta.exists():
                existing=json.loads(meta.read_text())
                if existing.get("tempo_factor") or existing.get("wpm",0)<=195 or existing.get("removed_duplicate_sec") or existing.get("restored_prefix_from"):continue
            master(f.with_suffix(".mp3"),r,args.out)
        if len(reports)==360 or not args.watch:break
        time.sleep(4)
