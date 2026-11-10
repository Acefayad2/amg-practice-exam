"""Publish only complete lessons with a verified recording for each section.

The selection records the original provider job and the hash of the mastered MP3.
Small disagreements go to the review queue unless the other transcription
confirms that part of the script or a reviewer records an explicit decision.
"""
import argparse, difflib, hashlib, importlib.util, json, re, shutil
from pathlib import Path

spec=importlib.util.spec_from_file_location("crosscheck",Path(__file__).with_name("crosscheck-narration.py"))
cross=importlib.util.module_from_spec(spec);spec.loader.exec_module(cross)
qa=cross.qa

def assess(expected,primary,secondary):
    a=qa.normalized(expected).split(); b=qa.normalized(primary).split()
    diffs=[(i,j,k,l) for op,i,j,k,l in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes()
           if op!='equal' and not cross.equivalent(' '.join(a[i:j]),' '.join(b[k:l]))]
    if not diffs:return "script matched",[]
    c=qa.normalized(secondary or "").split()
    match=difflib.SequenceMatcher(None,a,c,autojunk=False).get_matching_blocks()
    remaining=[]
    for i,j,k,l in diffs:
        # ASR writes $3,000 even when a speaker says "three thousand" in a
        # sentence about money. Only ignore the unit if the number still matches.
        numwords=set(qa.SMALL+qa.TENS+"hundred thousand million billion".split())
        if {''.join(a[i:j]),''.join(b[k:l])} in ({"","dollar"},{"","dollars"}) and i and k and a[i-1]==b[k-1] and a[i-1] in numwords:continue
        # For an extra word in the first reading require context on BOTH sides;
        # for a changed span require that the second reader recognized the span.
        lo,hi=(max(0,i-1),min(len(a),j+1)) if i==j else (i,j)
        if not any(m.a<=lo and m.a+m.size>=hi for m in match):
            remaining.append([' '.join(a[i:j]),' '.join(b[k:l])])
    return ("second transcription confirmed" if not remaining else "needs review"),remaining

def run():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument("--through",default=60,type=int);ap.add_argument("--output",type=Path,required=True)
    ap.add_argument("--report-only",action="store_true",help="Refresh the hold queue without copying assets or changing published selections")
    args=ap.parse_args(); out=args.output; root=qa.ROOT; docs=root/'docs/course/health'; public=root/'public/course/health/audio'; public.mkdir(parents=True,exist_ok=True)
    decisions_path=docs/'narration-decisions.json'
    decisions=json.loads(decisions_path.read_text()) if decisions_path.exists() else {}
    wording_path=docs/'narration-wording.json'
    revisions=json.loads(wording_path.read_text()) if wording_path.exists() else {}
    sources={}; candidates={}; decisions_used={}; waiting={}; selected=[]
    def load_receipt(path,folder,crossdir,original):
        r=json.loads(path.read_text()); by={x['index']:x['params']['prompt'] for x in r['params']}
        for job in r['jobs']:
            if not job.get('result_url') or job.get('status')!='completed':continue
            idx=job['index']; jid=job['job_id']
            revision=revisions.get(str(idx))
            if original:sources[idx]=revision['current_prompt'] if revision else by[idx]
            if idx//100>args.through:continue
            if revision and by[idx]!=revision['current_prompt']:
                waiting.setdefault(idx,[]).append({'job_id':jid,'differences':[],'flags':['superseded wording'],'wpm':None,'crosschecked':False})
                continue
            rf=folder/(str(idx)+'.json'); mf=out/'voice-masters'/(str(idx)+'-'+jid[:8]+'.json')
            if not rf.exists() or not mf.exists():continue
            report=json.loads(rf.read_text()); master=json.loads(mf.read_text())
            if report.get('job_id')!=jid or report.get('version')!=2:continue
            check_dir=crossdir
            if master.get('removed_duplicate_sec') or master.get('restored_prefix_from'):
                edited=out/'voice-edits'/(str(idx)+'.json')
                if not edited.exists():continue
                report=json.loads(edited.read_text())
                if report.get('job_id')!=jid:continue
                check_dir=out/'cross-edits'
            cf=check_dir/(str(idx)+'.json'); secondary=json.loads(cf.read_text()) if cf.exists() else {}
            if secondary.get('job_id')!=jid:secondary={}
            decision=decisions.get(jid,{})
            status,diffs=assess(sources.get(idx,by[idx]),report['transcript'],secondary.get('transcript'))
            problems=[f for f in report['flags'] if f in ('signal','flat pitch')]
            if not 110<=master['wpm']<=225:problems.append('pace after editing')
            if decision.get('action')=='reject':problems.append('rejected take')
            if decision.get('action')=='accept' and decision.get('reason'):status='reviewed: '+decision['reason'];diffs=[];problems=[]
            if diffs or problems:
                waiting.setdefault(idx,[]).append({'job_id':jid,'differences':diffs,'flags':problems,'wpm':master['wpm'],'crosschecked':bool(secondary)})
            else:candidates[idx]=(master,status)
    for f in sorted(docs.glob('audio-*-*.json')): load_receipt(f,out/'voice-qa',out/'voice-cross',True)
    for f in sorted(docs.glob('retakes-*.json')):
        roundnum=f.stem.split('-')[1];load_receipt(f,out/('retake-'+roundnum),out/('cross-retake-'+roundnum),False)
    for lesson in range(1,args.through+1):
        indices=[lesson*100+i for i in range(6)]
        if not all(i in candidates for i in indices):continue
        for idx in indices:
            m,status=candidates[idx]; asset='h%02d-%d-%s.mp3'%(lesson,idx%100+1,m['sha256'][:10]);source=out/'voice-masters'/m['file']
            if hashlib.sha256(source.read_bytes()).hexdigest()!=m['sha256']:raise ValueError('Master hash changed: '+str(idx))
            if not args.report_only and not (public/asset).exists():shutil.copyfile(source,public/asset)
            selected.append({'index':idx,'job_id':m['job_id'],'file':asset,'sha256':m['sha256'],'duration_sec':m['duration_sec'],'wpm':m['wpm'],'silence_removed_sec':m['silence_removed_sec'],**({'tempo_factor':m['tempo_factor']} if m.get('tempo_factor',1)!=1 else {}),'review':status})
    index_file=docs/'narration-reviewed.json'
    if not args.report_only and index_file.exists():
        previous=json.loads(index_file.read_text())['clips']
        new_ids={s['index'] for s in selected}
        if any(s['index'] not in new_ids for s in previous):raise ValueError('Refusing to silently withdraw published clips; review this change explicitly.')
        used={s['file'] for s in selected}
        for old in previous:
            if old['file'] not in used and re.fullmatch(r'h\d{2}-[1-6]-[0-9a-f]{10}\.mp3',old['file']):(public/old['file']).unlink(missing_ok=True)
    if not args.report_only:qa.atomic(index_file,{'version':1,'clips':selected})
    waiting={i:v for i,v in waiting.items() if i not in candidates}
    qa.atomic(out/'voice-review-queue.json',waiting)
    print('Published sections:',len(selected),'| complete lessons:',len(selected)//6,'| clips awaiting a decision:',len(waiting))

if __name__=='__main__':run()
