#!/usr/bin/env python3
"""Native Higgsfield sandbox only: normalize replacement narration, preserve picture."""
import argparse, json, pathlib, re, shutil, subprocess, time, urllib.request

def run(args):
    p=subprocess.run(args,capture_output=True,text=True)
    if p.returncode: raise RuntimeError('Media command failed: '+p.stderr[-1200:])
    return p.stdout,p.stderr

def probe(path):
    return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)])[0])

def video_hash(path):
    return run(['ffmpeg','-v','error','-i',str(path),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-'])[0].strip()

def download(url,path):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url,timeout=180) as response,path.open('wb') as output:
                shutil.copyfileobj(response,output)
            return
        except Exception:
            if attempt==3:raise RuntimeError('Input download failed after retries') from None
            time.sleep(2*(attempt+1))

def put(path,target):
    for attempt in range(4):
        try:
            req=urllib.request.Request(target['upload_url'],data=path.read_bytes(),method='PUT',headers={'Content-Type':target['content_type']})
            with urllib.request.urlopen(req,timeout=300) as response:
                if response.status!=200:raise RuntimeError('Upload did not return HTTP 200')
            return {'media_id':target['media_id'],'url':target.get('url'),'http_status':200}
        except Exception:
            if attempt==3:raise RuntimeError('Output upload failed after retries') from None
            time.sleep(2*(attempt+1))

def process(item,root):
    n=item['number']; folder=root/f'{n:02d}';folder.mkdir(parents=True,exist_ok=True)
    source=folder/'original.mp4';raw=folder/'voice-change.mp4';final=folder/'final.mp4'
    download(item['sourceUrl'],source);download(item['rawUrl'],raw)
    original=probe(source);rawprobe=probe(raw)
    video=next(s for s in original['streams'] if s['codec_type']=='video')
    duration=float(item['duration']);keep=float(item.get('keepOriginalAudioUntil',0))
    if keep<0 or keep>=duration:raise ValueError('Invalid preserved dialogue interval')
    if abs(float(rawprobe['format']['duration'])-duration)>.12:raise ValueError('Voice-change runtime differs materially')
    original_audio=next(s for s in original['streams'] if s['codec_type']=='audio')
    layout=original_audio.get('channel_layout') or ('mono' if original_audio.get('channels')==1 else 'stereo')
    head=f'atrim=start={keep}:end={duration},asetpts=PTS-STARTPTS,aformat=channel_layouts={layout},'
    _,measure=run(['ffmpeg','-hide_banner','-i',str(raw),'-vn','-af',head+'loudnorm=I=-18:TP=-2:LRA=7:print_format=json','-f','null','-'])
    measurement=json.loads(measure[measure.rfind('{'):])
    normalizer='loudnorm=I=-18:TP=-2:LRA=7:'+':'.join(f'{a}={measurement[b]}' for a,b in [('measured_I','input_i'),('measured_LRA','input_lra'),('measured_TP','input_tp'),('measured_thresh','input_thresh'),('offset','target_offset')])+':linear=true'
    tail=duration-keep
    audio=f'[1:a]{head}{normalizer},aresample=48000,aformat=channel_layouts={layout},apad=whole_dur={tail},atrim=duration={tail}[voice]'
    if keep:
        audio+=f';[0:a]atrim=end={keep},asetpts=PTS-STARTPTS,aresample=48000[intro];[intro][voice]concat=n=2:v=0:a=1[aout]'
    else:audio+=';[voice]anull[aout]'
    run(['ffmpeg','-hide_banner','-y','-i',str(source),'-i',str(raw),'-filter_complex',audio,'-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(final)])
    result=probe(final);oh=video_hash(source);fh=video_hash(final)
    if oh!=fh:raise ValueError('Original video stream was not preserved')
    if abs(float(result['format']['duration'])-duration)>.1:raise ValueError('Final duration mismatch')
    _,levels=run(['ffmpeg','-hide_banner','-i',str(final),'-vn','-af','volumedetect,ebur128=peak=true','-f','null','-'])
    volume={key:float(re.search(key+r':\s*(-?[\d.]+) dB',levels).group(1)) for key in ['mean_volume','max_volume']}
    if volume['max_volume']>-1 or volume['mean_volume']<-24:raise ValueError('Normalized audio outside review level limits')
    saved=put(final,item['output'])
    return {'number':n,'sourceVideo':item['sourceUrl'],'rawVoiceChangeVideo':item['rawUrl'],'duration':float(result['format']['duration']),'video':saved['url'],'mediaId':saved['media_id'],'uploadHttpStatus':200,'keepOriginalAudioUntil':keep,'originalVideoStreamHash':oh,'finalVideoStreamHash':fh,'pictureUnchanged':True,'loudnessTarget':{'integratedLUFS':-18,'truePeakDBTP':-2,'loudnessRangeLU':7},'normalizationInputMeasurement':measurement,'finalVolume':volume,'technical':result,'status':'normalized-awaiting-speech-review'}

def main():
    p=argparse.ArgumentParser();p.add_argument('config');args=p.parse_args()
    config=json.loads(pathlib.Path(args.config).read_text());root=pathlib.Path('/home/user/amg-zoe-normalize');root.mkdir(exist_ok=True)
    results=[]
    for item in config['items']:
        try:
            result=process(item,root)
            print(json.dumps({'number':result['number'],'status':result['status'],'duration':result['duration'],'volume':result['finalVolume'],'uploadHttpStatus':200}),flush=True)
        except Exception as error:
            result={'number':item['number'],'status':'normalization-failed','error':re.sub(r'https?://[^\s]+','[URL REDACTED]',str(error))[-1200:]}
            print(json.dumps(result),flush=True)
        results.append(result)
        (root/(config.get('reportName','normalization.json'))).write_text(json.dumps(results,indent=2)+'\n')
    report=root/(config.get('reportName','normalization.json'));report.write_text(json.dumps(results,indent=2)+'\n')
    if config.get('reportUpload'):print(json.dumps({'report':put(report,config['reportUpload'])}),flush=True)
    print('NORMALIZATION COMPLETE',sum(x['status']=='normalized-awaiting-speech-review' for x in results),'OF',len(results),flush=True)
    if any(x['status']=='normalization-failed' for x in results):raise SystemExit(1)
if __name__=='__main__':main()
