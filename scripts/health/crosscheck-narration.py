"""Second ASR reading of nontrivial differences; never changes any source or bills credits."""
import argparse, difflib, importlib.util, json, time
from pathlib import Path
import mlx_whisper

base=Path(__file__).with_name("review-narration.py")
spec=importlib.util.spec_from_file_location("audio_review",base)
qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa)

def changes(a,b):
    aa=qa.normalized(a).split(); bb=qa.normalized(b).split()
    return [[" ".join(aa[i:j])," ".join(bb[k:l])] for op,i,j,k,l in difflib.SequenceMatcher(None,aa,bb,autojunk=False).get_opcodes() if op!="equal"]

def equivalent(a,b):
    if {a,b} in ({"buy","by"},{"adviser","advisor"}):return True
    def simple(s):
        s=s.replace(" ","")
        for x,y in {"guaranty":"guarantee","guaranties":"guarantees","judgement":"judgment","insures":"ensures","insured":"ensured","cancellable":"cancelable","marcuss":"marcus","denniss":"dennis","dollars":"dollar"}.items():s=s.replace(x,y)
        return s
    return simple(a)==simple(b)

if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("--model",required=True);ap.add_argument("--source",type=Path,required=True)
    ap.add_argument("--out",type=Path,required=True);ap.add_argument("--watch",action="store_true");args=ap.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    prompts={v["index"]:v["params"]["prompt"] for p in (qa.ROOT/"docs/course/health").glob("audio-*-*.json") for v in json.loads(p.read_text())["params"]}
    while True:
        reports=list(args.source.glob("[0-9]*.json"))
        for f in reports:
            data=json.loads(f.read_text()); dest=args.out/f.name
            if data.get("version")!=2 or dest.exists() or not any(not equivalent(*pair) for pair in data["differences"]):continue
            decoded=mlx_whisper.transcribe(str(f.with_suffix(".mp3")),path_or_hf_repo=args.model,language="en",temperature=0,condition_on_previous_text=False)
            ds=changes(prompts[data["index"]],decoded["text"])
            qa.atomic(dest,{"index":data["index"],"job_id":data["job_id"],"differences":ds,"transcript":decoded["text"].strip()})
        if len(reports)>=360 or not args.watch:break
        time.sleep(5)
