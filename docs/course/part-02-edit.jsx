import { readFileSync } from 'node:fs';
const ROOT='/home/user/amg-part2-v2';
const T=JSON.parse(readFileSync(ROOT+'/timing.json','utf8'));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const cue=phrase=>{
  const target=phrase.split(/\s+/).map(norm), words=T.words;
  const i=words.findIndex((w,i)=>target.every((t,j)=>norm(words[i+j]?.word||'')===t));
  if(i<0) throw new Error('Missing narration cue: '+phrase);
  return words[i].start;
};
const STARTS=[0,cue('The answer starts'),T.sections[1].start,cue('Pooling does not'),T.sections[2].start,T.sections[3].start,cue("This year's count"),T.sections[4].start,T.sections[5].start,cue('Underwriting helps'),cue('Remember the distinctions')];
const END=Math.ceil(T.duration*24)/24;
export default async ({project})=>{
  const p=await project({dir:ROOT+'/project',size:'1920x1080',fps:24,background:'#f3f1eb'});
  const portrait=await p.add(ROOT+'/marcus.png'),logo=await p.add(ROOT+'/amg-mark.webp');
  const C={paper:'#f3f1eb',ink:'#112d35',muted:'#52666b',teal:'#087f8c',gold:'#b69a52',wash:'#e3ebe6',red:'#a34b37',line:'#bdcdc6',white:'#ffffff'};
  const txt=(x,y,w,h,value,size=42,color=C.ink,weight=500)=><text x={x} y={y} width={w} height={h} fontFamily="Montserrat" fontWeight={weight} fontSize={size} color={color}>{value}</text>;
  const box=(x,y,w,h,fill=C.white)=><rect x={x} y={y} width={w} height={h} radius={16} fill={fill}/>;
  const show=(at,children)=><frame width={1920} height={1080} layout="none" at={Math.max(0,at)} motion={{enter:{from:{opacity:0,y:12},duration:0.45}}}>{children}</frame>;
  const arrow=(x,y,w=105)=><path x={x} y={y} width={w} height={54} d="M 0 27 L 100 27 M 75 2 L 100 27 L 75 52" stroke={{color:C.teal,width:7,cap:'round'}}/>;
  const mark=()=> <media file={logo} x={70} y={814} width={146} height={137} fit="contain" mask={{shape:'ellipse',x:21.34,y:14.22,width:103.32,height:103.32}}/>;
  const scene=(i,label,title,children)=>{
    p.compose(<frame width={1920} height={1080} layout="none" background={C.paper}>
      <rect width={1920} height={12} fill={C.teal}/>
      {txt(100,60,1600,36,'AMG LIFE INSURANCE  /  PART 2  /  '+label.toUpperCase(),22,C.teal,700)}
      {txt(100,123,1720,115,title,67,C.ink,700)}
      {txt(1720,65,100,36,String(i+1).padStart(2,'0'),25,C.gold,700)}
      {children}{mark()}
    </frame>,{at:STARTS[i],dur:(STARTS[i+1]||END)-STARTS[i],name:label});
  };
  scene(0,'Marcus’s next question','One premium. A larger promise.',<>
    <media file={portrait} x={100} y={280} width={830} height={465} fit="contain"/>
    {box(1010,280,790,465,C.ink)}
    {txt(1054,323,700,48,'MARCUS ASKS',28,'#bde8dd',700)}
    {txt(1054,410,695,250,'How can a covered benefit\nbe larger than the\npremiums I have paid?',46,C.white,600)}
  </>);
  scene(1,'Risk pooling','Many exposures. Shared financial risk.',<>
    {[0,1,2,3,4,5].map(i=>show(i*.25,<>{box(100+(i%3)*230,286+Math.floor(i/3)*191,202,150,C.white)}{txt(120+(i%3)*230,332+Math.floor(i/3)*191,162,68,'Policy '+(i+1),28,C.ink,600)}</>))}
    {arrow(823,445)}
    {box(1000,286,800,341,C.ink)}{txt(1043,326,710,65,'THE INSURER',40,'#bde8dd',700)}
    {show(2,txt(1043,435,710,144,'Supports covered\nbenefits across the pool',44,C.white,600))}
    {show(6,txt(100,713,1680,64,'The policy contract determines the covered benefit.',37,C.teal,700))}
  </>);
  scene(2,'Financial support','More than one person’s premiums.',<>
    {box(100,289,670,407,C.white)}{txt(140,332,590,58,'MANY POLICYHOLDERS',32,C.teal,700)}
    {txt(140,460,590,118,'Premiums help fund\ninsurance obligations.',43,C.ink,600)}
    {arrow(830,468)}
    {show(2,<>{box(1030,289,770,407,C.ink)}{txt(1075,335,680,56,'ONE INSURANCE OPERATION',30,'#bde8dd',700)}{txt(1075,444,680,180,'Policies, financial resources\nand covered claims',44,C.white,600)}</>)}
    {show(7,txt(100,738,1700,50,'A life policy is not simply a personal savings account.',34,C.muted,600))}
  </>);
  scene(3,'What pooling does not do','Protection still has limits.',<>
    {['Prevent death','Require identical premiums','Eliminate uncertainty'].map((label,i)=>show(i*1.3,<>{box(100,284+i*143,1700,114,i%2?C.wash:C.white)}{txt(138,312+i*143,95,62,'×',50,C.red,600)}{txt(270,316+i*143,1460,64,label,42,C.ink,600)}</>))}
    {show(7,txt(100,751,1700,50,'Coverage amounts and risk classifications can differ.',33,C.teal,600))}
  </>);
  scene(4,'Law of large numbers','Better estimates for the group.',<>
    {['More exposures','Comparable risks','Largely independent losses'].map((label,i)=>show(i*2,<>{box(100+i*580,290,540,187,i===2?C.wash:C.white)}{txt(138+i*580,338,460,108,label,38,C.ink,600)}</>))}
    {show(7,<>{box(100,532,1700,136,C.ink)}{txt(142,564,1610,81,'A more predictable average loss experience',46,C.white,700)}</>)}
    {show(16,txt(100,723,1700,83,'More total claims can still occur. Individual outcomes remain unknown.',34,C.muted,600))}
  </>);
  scene(5,'Invented annual example','Calculate an expectation.',<>
    {box(100,290,1700,425,C.white)}
    {txt(146,333,1580,42,'ASSUMPTIONS FOR LEARNING ONLY',26,C.teal,700)}
    {txt(155,452,410,108,'1,000',91,C.ink,700)}{txt(155,590,410,60,'people',32,C.muted,600)}
    {txt(572,478,115,80,'×',67,C.gold,600)}
    {show(2,<>{txt(724,452,370,108,'1%',91,C.ink,700)}{txt(724,581,410,95,'annual claim\nprobability',30,C.muted,600)}</>)}
    {show(6,<>{txt(1140,478,105,80,'=',67,C.gold,600)}{txt(1320,452,360,108,'10',91,C.teal,700)}{txt(1320,583,370,85,'expected claims',30,C.muted,600)}</>)}
    {txt(100,753,1700,40,'Not mortality data or a premium quote.',29,C.muted)}
  </>);
  scene(6,'Expected versus actual','An average is not a promise.',<>
    {[8,10,12].map((n,i)=>show(i*.7,<>{box(100+i*580,293,540,360,i===1?C.wash:C.white)}{txt(148+i*580,340,440,59,'POSSIBLE COUNT',27,C.teal,700)}{txt(148+i*580,444,440,135,String(n),100,C.ink,700)}</>))}
    {txt(100,705,1700,89,'Actual results can be below or above 10.\nOther counts are possible, too.',35,C.muted,600)}
  </>);
  scene(7,'One extra claim','The same change. A different impact.',<>
    {box(100,285,800,460,C.white)}{box(1000,285,800,460,C.wash)}
    {txt(140,325,720,58,'100 PEOPLE',36,C.teal,700)}{txt(1040,325,720,58,'10,000 PEOPLE',36,C.teal,700)}
    {show(3,<>{txt(140,438,710,80,'1 → 2 claims',53,C.ink,600)}{txt(140,572,710,90,'1% → 2%',73,C.ink,700)}</>)}
    {show(cue('In a group of ten thousand')-STARTS[7],<>{txt(1040,438,710,80,'100 → 101 claims',53,C.ink,600)}{txt(1040,572,710,90,'1% → 1.01%',69,C.ink,700)}</>)}
    {txt(100,770,1700,38,'Same assumed 1% probability. Illustration of sensitivity; not a guarantee.',25,C.muted,600)}
  </>);
  scene(8,'Adverse selection','Who is especially eager to apply?',<>
    {box(100,286,800,430,C.ink)}{txt(144,335,710,66,'ONE STANDARD OFFER',34,'#bde8dd',700)}
    {txt(144,447,710,180,'Higher-risk people\nmay have greater\ninterest in coverage.',46,C.white,600)}
    {arrow(933,458)}
    {show(3,<>{box(1110,286,690,430,C.white)}{txt(1150,336,605,145,'ADVERSE\nSELECTION',55,C.teal,700)}{txt(1150,527,605,130,'A pattern in\nwho seeks coverage',37,C.ink,600)}</>)}
    {show(7,txt(100,755,1700,50,'This can happen even when everyone answers truthfully.',34,C.muted,600))}
  </>);
  scene(9,'Underwriting','Evaluate and classify the risk.',<>
    {['Application','Assessment','Risk classification'].map((label,i)=><>{box(100+i*610,325,480,290,i===1?C.ink:C.white)}{txt(138+i*610,406,405,128,label,41,i===1?C.white:C.ink,600)}{i<2?arrow(604+i*610,435):null}</>)}
    {txt(100,710,1700,98,'Use permitted information and rules.\nAssessment helps; uncertainty remains.',36,C.muted,600)}
  </>);
  scene(10,'Carry it forward','Three ideas. Three different jobs.',<>
    {[['Pooling','Spreads financial risk'],['Large numbers','Improves group estimates'],['Adverse selection','Who seeks coverage']].map((row,i)=>show(i*.6,<>{box(100,287+i*140,1700,113,i%2?C.wash:C.white)}{txt(137,312+i*140,565,71,row[0],38,C.teal,700)}{txt(740,316+i*140,1000,72,row[1],38,C.ink,600)}</>))}
    {show(Math.max(2,cue('Now answer the eight')-STARTS[10]),txt(100,756,1700,52,'Next: 8 required questions. Read, review and retry.',33,C.muted,600))}
  </>);
  await p.frame(STARTS[1]+8,'renders/poster.png');
  if(process.env.AMG_FRAMES_ONLY==='1'){
    for(let i=0;i<STARTS.length;i++)await p.frame(Math.min((STARTS[i+1]||END)-.25,STARTS[i]+Math.min(10,((STARTS[i+1]||END)-STARTS[i])*.7)),'renders/qa-'+i+'.png');
  }else await p.render('renders/picture.mp4',{bitrate:5000000,concurrency:3});
};
