"""Download only completed receipt outputs; decode and independently transcribe them.

Run with a local MLX Whisper snapshot, ffmpeg, ffprobe, numpy and scipy installed.
Reports and MP3s stay outside the published classroom. Flags are review candidates.
"""
import argparse
import difflib
import json
import math
import re
import subprocess
import time
import unicodedata
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

import mlx_whisper
import numpy as np
from scipy.signal import find_peaks

ROOT = Path(__file__).resolve().parents[2]
SMALL = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "zero ten twenty thirty forty fifty sixty seventy eighty ninety".split()

def number(n):
    if n < 20: return SMALL[n]
    if n < 100: return TENS[n // 10] + (" " + SMALL[n % 10] if n % 10 else "")
    for scale, noun in ((1000000000, "billion"), (1000000, "million"), (1000, "thousand"), (100, "hundred")):
        if n >= scale: return number(n // scale) + " " + noun + (" " + number(n % scale) if n % scale else "")

def normalized(s):
    s = unicodedata.normalize("NFKC", s).lower().replace("’","'").replace("‑","-").replace("&", " and ")
    s = re.sub(r"(?<=\d),(?=\d{3}\b)", "", s)
    def digits(m):
        v = m[1].replace(",", ""); a, _, b = v.partition(".")
        return number(int(a)) + (" point " + " ".join(SMALL[int(d)] for d in b) if b else "")
    def ordinal(m):
        value=number(int(m[1])).split()
        last=value[-1]; irregular={"one":"first","two":"second","three":"third","five":"fifth","eight":"eighth","nine":"ninth","twelve":"twelfth"}
        value[-1]=irregular.get(last,last[:-1]+"ieth" if last.endswith("y") else last+"th")
        return " ".join(value)
    def statutory(m):
        tail=m[2];pair=int(tail[-2:])
        return number(int(m[1]))+" dash "+number(int(tail[:-2]))+" "+("hundred" if not pair else ("oh " if pair<10 else "")+number(pair))
    s=re.sub(r"\b(\d{1,2})[-–—](\d{3,4})\b",statutory,s)
    s = re.sub(r"\b(\d+)(?:st|nd|rd|th)\b",ordinal,s)
    months=r"(january|february|march|april|may|june|july|august|september|october|november|december)"
    s = re.sub(r"\b"+months+r"\s+(\d{1,2})\b",lambda m:m[1]+" "+re.sub(r"(\d+)",ordinal,m[2]),s)
    s = re.sub(r"\$(\d+(?:\.\d+)?)\s+(million|billion|thousand)\b",lambda m:digits(m)+" "+m[2]+" dollars",s)
    s = re.sub(r"\$(\d[\d,]*(?:\.\d+)?)", lambda m: digits(m) + " dollars ", s)
    s = re.sub(r"\b(\d[\d,]*(?:\.\d+)?)\s*%", lambda m: digits(m) + " percent ", s)
    s = re.sub(r"\b(19\d{2}|20[1-9]\d)\b",lambda m:number(int(m[1][:2]))+" "+("hundred" if m[1][2:]=="00" else ("oh " if m[1][2]=="0" else "")+number(int(m[1][2:]))),s)
    s = re.sub(r"\b(\d+(?:\.\d+)?)\b", digits, s)
    s = s.replace("cannot", "can not").replace("can't", "can not").replace("won't", "will not")
    s = s.replace("n't", " not").replace("'re", " are").replace("'ll", " will").replace("'ve", " have").replace("'s", "s")
    s=re.sub(r"\ba[ .-]+m[ .-]+gs\b","amgs",s)
    for term in ("amg","hmo","ppo","irs","hras","hra","hsa","hmos","aca","esrd","naic","qsehra","pcp","ipa","pos","epo","hdhp","usc","mia","mib","fsas","fsa","hiv","aps","ucr","hhs","std","ltd","boe","nih"):
        s=re.sub(r"(?<![a-z])"+r"[ .-]+".join(term)+r"(?![a-z])",term,s)
    words = re.findall(r"[a-z]+", s)
    return " ".join(words)

def atomic(path,obj):
    tmp = path.with_suffix(".part"); tmp.write_text(json.dumps(obj,indent=2)+"\n"); tmp.replace(path)

def audit(job, prompt, model, dest):
    idx = job["index"]; stem = dest / str(idx); mp3 = stem.with_suffix(".mp3")
    url = urlsplit(job["result_url"])
    if url.scheme != "https" or not (url.hostname or "").endswith((".cloudfront.net",".higgsfield.ai")):
        raise ValueError("unexpected media host")
    if not mp3.exists():
        tmp = mp3.with_suffix(".download")
        with urllib.request.urlopen(job["result_url"],timeout=40) as response: tmp.write_bytes(response.read())
        tmp.replace(mp3)
    info = json.loads(subprocess.check_output(["ffprobe","-v","error","-select_streams","a:0","-show_streams","-show_format","-of","json",str(mp3)]))
    stream = info["streams"][0]
    raw = np.frombuffer(subprocess.check_output(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(mp3),"-f","f32le","-"]),np.float32).reshape(-1,stream["channels"])
    rate=int(stream["sample_rate"])
    # An automatic stereo-to-mono filter can add 3 dB for identical channels.
    # Measure the delivered channels at their native sample rate before mixing.
    peak=float(np.max(np.abs(raw))); duration=len(raw)/rate; flags=[]
    from scipy.signal import resample_poly
    d=math.gcd(rate,16000); pcm=resample_poly(raw.mean(axis=1),16000//d,rate//d)
    if stream["codec_name"]!="mp3" or not 10<=duration<=100 or not 0.02<=peak<1.001: flags.append("signal")
    wpm = 60*len(prompt.split())/duration
    if not 115<=wpm<=215: flags.append("pace")
    pitches=[]
    for off in range(0,len(pcm)-640,800):
        f=pcm[off:off+640].astype(float); f-=f.mean()
        if np.sqrt(np.mean(f*f))<0.017: continue
        c=np.correlate(f,f,"full")[639:]; peaks,_=find_peaks(c[40:190])
        if not len(peaks): continue
        lag=40+peaks[np.argmax(c[40+peaks])]
        if c[lag]/max(c[0],1e-12)>.62: pitches.append(16000/lag)
    pitch_range = float(12*math.log2(np.percentile(pitches,90)/np.percentile(pitches,10))) if pitches else 0
    if pitch_range<2: flags.append("flat pitch")
    decoded=mlx_whisper.transcribe(str(mp3),path_or_hf_repo=model,language="en",temperature=0,word_timestamps=True,condition_on_previous_text=False)
    # Some decoders invent an outro in the final zero-padded frame. Exclude only
    # words whose timestamps are too short to be spoken, and retain them for review.
    ws=[w for seg in decoded["segments"] for w in seg.get("words",[])]
    padding=[w for w in ws if float(w["start"])>=duration-.15 and float(w["end"])-float(w["start"])<=.05]
    spoken="".join(w["word"] for w in ws if w not in padding).strip()
    a=normalized(prompt); b=normalized(spoken); aa=a.split(); bb=b.split()
    edits=[[" ".join(aa[i:j])," ".join(bb[k:l])] for op,i,j,k,l in difflib.SequenceMatcher(None,aa,bb,autojunk=False).get_opcodes() if op!="equal"]
    similarity=difflib.SequenceMatcher(None,a.replace(" ",""),b.replace(" ",""),autojunk=False).ratio()
    if similarity < .97: flags.append("script divergence")
    return {"version":2,"index":idx,"job_id":job["job_id"],"duration_sec":round(duration,2),"codec":stream["codec_name"],"sample_rate":rate,"channels":stream["channels"],"peak_db":round(20*math.log10(max(peak,1e-8)),1),"rms_db":round(10*math.log10(max(float(np.mean(raw*raw)),1e-12)),1),"wpm":round(wpm),"pitch_span_semitones":round(pitch_range,1),"similarity":round(similarity,4),"differences":edits,"padding_words":[w["word"].strip() for w in padding],"transcript":spoken,"flags":flags}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model",required=True); p.add_argument("--out",type=Path,required=True)
    p.add_argument("--receipts",default="audio-*-*.json",help="Receipt filename or glob under docs/course/health")
    p.add_argument("--watch",action="store_true"); p.add_argument("--max-idle",type=int,default=900)
    args=p.parse_args(); dest=args.out;dest.mkdir(parents=True,exist_ok=True)
    if not Path(args.model).is_dir(): raise SystemExit("Provide a local model snapshot.")
    last=time.time()
    while True:
        count=0
        for receipt in sorted((ROOT/"docs/course/health").glob(args.receipts)):
            r=json.loads(receipt.read_text()); prompts={x["index"]:x["params"]["prompt"] for x in r["params"]}
            for j in r["jobs"]:
                if j.get("status")!="completed" or not j.get("result_url"): continue
                final=dest/(str(j["index"])+".json")
                old=json.loads(final.read_text()) if final.exists() else {}
                if old.get("job_id")!=j["job_id"] or old.get("version")!=2:
                    if old and old["job_id"]!=j["job_id"]: (dest/(str(j["index"])+".mp3")).unlink(missing_ok=True)
                    result=audit(j,prompts[j["index"]],args.model,dest); atomic(final,result);last=time.time()
                    print(j["index"],result["wpm"],result["similarity"],",".join(result["flags"]) or "ok",flush=True)
                count+=1
        if count==360 or not args.watch or time.time()-last>args.max_idle: break
        time.sleep(4)
    print("Reviewed",count,"confirmed outputs",flush=True)

if __name__=="__main__": main()
