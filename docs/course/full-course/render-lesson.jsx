// Native Higgsedit source. The job runner supplies lesson.json, timing.json and media.
import {readFileSync} from 'node:fs';
const ROOT=process.env.AMG_LESSON_DIR;
if(!ROOT)throw new Error('AMG_LESSON_DIR is required');
const L=JSON.parse(readFileSync(ROOT+'/lesson.json','utf8'));
const T=JSON.parse(readFileSync(ROOT+'/timing.json','utf8'));
const END=Math.ceil(T.duration*24)/24;
const C={paper:'#f3f1eb',ink:'#112d35',muted:'#52666b',teal:'#087f8c',gold:'#b69a52',wash:'#e3ebe6',white:'#ffffff',line:'#bdcdc6'};
export default async({project})=>{
 const p=await project({dir:ROOT+'/project',size:'1920x1080',fps:24,background:C.paper});
 const logo=await p.add(ROOT+'/amg-mark.webp');
 const text=(x,y,w,h,s,size=40,color=C.ink,weight=600)=><text x={x} y={y} width={w} height={h} fontFamily="Montserrat" fontWeight={weight} fontSize={size} color={color}>{s}</text>;
 const rect=(x,y,w,h,color=C.white)=><rect x={x} y={y} width={w} height={h} fill={color} radius={16}/>;
 const appear=(at,children)=><frame width={1920} height={1080} layout="none" at={at} motion={{enter:{from:{y:14,opacity:0},duration:0.5}}}>{children}</frame>;
 const arrow=(x,y,w)=><path x={x} y={y} width={w} height={44} d="M 0 22 L 90 22 M 68 2 L 90 22 L 68 42" stroke={{color:C.teal,width:6,cap:'round'}}/>;
 const wrap=(s,limit)=>{
  const lines=[];let line='';
  for(const word of s.split(/\s+/)){if(line&&(line+' '+word).length>limit){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
  if(line)lines.push(line);return lines.join('\n');
 };
 const layout=(v)=>{
  const items=v.items;if(items.length<1||items.length>5)throw new Error('Unsupported item count');
  if(v.type==='recap'||items.length>3){
   const rh=Math.min(124,500/items.length);
   return items.map(([a,b],j)=>appear(j*1.2,<>
    {rect(100,278+j*(rh+10),1720,rh,j%2?C.wash:C.white)}
    {text(130,306+j*(rh+10),80,60,String(j+1).padStart(2,'0'),28,C.gold,700)}
    {text(245,294+j*(rh+10),540,rh-16,wrap(a,23),35,C.teal,700)}
    {text(827,294+j*(rh+10),940,rh-16,wrap(b,43),34,C.ink,500)}
   </>));
  }
  if(v.type==='flow'){
   const gap=100,w=(1720-gap*(items.length-1))/items.length;
   return items.map(([a,b],j)=>appear(j*1.6,<>
    {rect(100+j*(w+gap),304,w,393,j===1?C.ink:C.white)}
    {text(136+j*(w+gap),340,w-72,50,String(j+1).padStart(2,'0'),27,j===1?'#bde8dd':C.gold,700)}
    {text(136+j*(w+gap),414,w-72,128,wrap(a,w>700?30:21),w>700?49:(wrap(a,21).split('\n').length>2?35:42),j===1?C.white:C.ink,700)}
    {text(136+j*(w+gap),568,w-72,106,wrap(b,w>700?37:25),32,j===1?'#bde8dd':C.muted,500)}
    {j<items.length-1?arrow(117+j*(w+gap)+w,476,gap-34):null}
   </>));
  }
  if(v.type==='calculation'){
   return items.map(([a,b],j)=>appear(j*1.6,<>
    {rect(100+j*(1740/items.length),296,1700/items.length-20,430,j%2?C.wash:C.white)}
    {text(136+j*(1740/items.length),345,1700/items.length-92,145,wrap(a,14),63,C.ink,700)}
    {text(136+j*(1740/items.length),551,1700/items.length-92,143,wrap(b,23),32,C.teal,600)}
   </>));
  }
  const gap=40,w=(1720-gap*(items.length-1))/items.length;
  return items.map(([a,b],j)=>appear(j*1.5,<>
   {rect(100+j*(w+gap),290,w,432,j%2?C.wash:C.white)}
   <rect x={100+j*(w+gap)} y={290} width={w} height={9} fill={j%2?C.gold:C.teal}/>
   {text(140+j*(w+gap),344,w-80,160,wrap(a,w>700?29:19),w>700?52:43,C.ink,700)}
   {text(140+j*(w+gap),544,w-80,148,wrap(b,w>700?39:24),34,C.muted,500)}
  </>));
 };
 for(let i=0;i<L.blocks.length;i++){
  const b=L.blocks[i],start=T.sections[i].start,end=T.sections[i+1]?.start||END;
  const photoDuration=b.visual.photo?Math.min(8,(end-start)/3):0;
  if(photoDuration){
   const photograph=await p.add(ROOT+'/'+b.visual.photo);
   p.compose(<frame width={1920} height={1080} layout="none" clip={true} background={C.ink}>
    <frame width={1920} height={1080} origin="center" layout="none" duration={photoDuration} motion={{enter:{from:{scale:1},to:{scale:1.035},duration:photoDuration,easing:'linear'}}}>
     <media file={photograph} x={0} y={0} width={1920} height={1080} fit="cover"/>
    </frame>
    <rect x={0} y={0} width={590} height={1080} fill={C.ink}/>
    {text(64,84,466,58,'AMG LIFE  /  PART '+L.number,24,'#d6bd7a',700)}
    <frame width={590} height={1080} layout="none" duration={photoDuration} motion={{enter:{from:{y:18,opacity:0},duration:0.6}}}>
     {text(64,220,466,345,wrap(b.title,18),49,C.white,700)}
     {text(64,622,466,130,wrap(b.visual.photoCaption||'Follow the people.\nUnderstand the decision.',25),28,'#bde8dd',500)}
    </frame>
    <media file={logo} x={34} y={814} width={146} height={137} fit="contain" mask={{shape:'ellipse',x:21.34,y:14.22,width:103.32,height:103.32}}/>
   </frame>,{at:start,dur:photoDuration,name:'Scenario '+(i+1)});
  }
  p.compose(<frame width={1920} height={1080} layout="none" background={C.paper}>
   <rect width={1920} height={12} fill={C.teal}/>
   {text(100,61,1610,42,'AMG LIFE INSURANCE  /  PART '+L.number+'  /  '+String(i+1).padStart(2,'0'),23,C.teal,700)}
   {text(100,124,1720,154,wrap(b.title,45),wrap(b.title,45).includes('\n')?54:65,C.ink,700)}
   {layout(b.visual)}
   <media file={logo} x={70} y={814} width={146} height={137} fit="contain" mask={{shape:'ellipse',x:21.34,y:14.22,width:103.32,height:103.32}}/>
  </frame>,{at:start+photoDuration,dur:end-start-photoDuration,name:'Section '+(i+1)+' '+b.title});
 }
 await p.frame(L.blocks[0].visual.photo?3:9,'renders/poster.png');
 if(process.env.AMG_FRAMES_ONLY==='1'){
  for(let i=0;i<L.blocks.length;i++){
   const start=T.sections[i].start,end=T.sections[i+1]?.start||END;
   if(L.blocks[i].visual.photo){
    for(const [label,time] of [['photo',start+3],['photo-end',start+7.8],['diagram-enter',start+8.25],['diagram-settled',start+17]])await p.frame(Math.min(time,end-.25),'renders/qa-'+i+'-'+label+'.png');
   }
   for(const [label,time] of [['enter',start+.25],['settled',Math.min(start+9,end-.5)],['end',end-.2]])await p.frame(time,'renders/qa-'+i+'-'+label+'.png');
  }
 }else await p.render('renders/picture.mp4',{bitrate:5000000,concurrency:3});
};
