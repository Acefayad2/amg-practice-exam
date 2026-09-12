const STARTS = [12,32.58,58.29,79.61,100.884,122.304,145.182,160.022,186.96,223.17,244.59];
const END = 256.02600000000007;
export default async ({ project }) => {
  const p = await project({dir:'/home/user/amg-part1-film',size:'1920x1080',fps:24,background:'#f3f1eb'});
  const film = await p.add('/home/user/part1-render/opening-clean.mp4');
  const portrait = await p.add('/home/user/part1-render/marcus.png');
  const logo = await p.add('/home/user/part1-render/amg-mark.webp');
  const C={paper:'#f3f1eb',ink:'#112d35',muted:'#52666b',teal:'#087f8c',gold:'#b69a52',wash:'#e3ebe6',red:'#a34b37',line:'#bdcdc6',white:'#ffffff'};
  const txt=(x,y,w,h,value,size=42,color=C.ink,weight=500)=> <text x={x} y={y} width={w} height={h} fontFamily="Montserrat" fontWeight={weight} fontSize={size} color={color}>{value}</text>;
  const box=(x,y,w,h,fill=C.white)=> <rect x={x} y={y} width={w} height={h} radius={14} fill={fill}/>;
  const line=(x,y,w,fill=C.teal)=> <rect x={x} y={y} width={w} height={5} fill={fill}/>;
  const show=(at,children)=> <frame width={1920} height={1080} layout="none" at={at} motion={{enter:{from:{opacity:0,y:14},duration:0.5}}}>{children}</frame>;
  const arrow=(x,y)=> <path x={x} y={y} width={110} height={55} d="M 0 27 L 100 27 M 75 2 L 100 27 L 75 52" stroke={{color:C.teal,width:7,cap:'round'}}/>;
  const heading=(n,label,title)=> <>
    <rect x={0} y={0} width={1920} height={12} fill={C.teal}/>
    {txt(100,60,1640,36,'AMG LIFE INSURANCE  /  PART 1  /  '+label.toUpperCase(),22,C.teal,700)}
    {txt(100,122,1720,116,title,72,C.ink,700)}
    {txt(1720,66,100,36,n,25,C.gold,700)}
  </>;
  const footer=()=> <>
    <media file={logo} x={70} y={814} width={146} height={137} fit="contain" mask={{shape:"ellipse",x:21.34,y:14.22,width:103.32,height:103.32}}/>
  </>;
  const scene=(i,label,title,children)=> {
    const at=STARTS[i], dur=(STARTS[i+1]||END)-at;
    p.compose(<frame width={1920} height={1080} layout="none" background={C.paper}>{heading(String(i+1).padStart(2,'0'),label,title)}{children}{footer()}</frame>,{at,dur,name:label});
  };
  p.cut(film,{from:0,dur:12,at:0,fit:'cover'});
  p.compose(<frame width={1920} height={1080} layout="none">
    <media file={logo} x={64} y={729} width={195} height={183} fit="contain" mask={{shape:"ellipse",x:28.5,y:19,width:138,height:138}}/>
    {box(1020,60,800,126,C.ink)}
    {txt(1050,78,740,32,'PART 1  /  MEET MARCUS',22,'#bde8dd',700)}
    {txt(1050,122,740,47,'A family. A financial responsibility.',31,C.white,600)}
  </frame>,{at:0,dur:12,name:'Marcus opening'});
  scene(0,'The starting point','One family. Five connected ideas.',<>
    <media file={portrait} x={100} y={265} width={810} height={453} fit="contain"/>
    {txt(120,732,750,50,'MARCUS  /  Working father',27,C.muted,600)}
    {['Risk','Exposure','Peril','Hazard','Loss'].map((word,i)=>show(2+i*2.6,<>{box(1030,265+i*99,730,82,i%2?C.wash:C.white)}{txt(1060,281+i*99,660,54,word,38,C.ink,600)}</>))}
  </>);
  scene(1,'Risk','Uncertainty about a loss.',<>
    {txt(100,270,1700,80,'The timing is uncertain—even when death is eventually certain.',36,C.muted)}
    {line(280,582,1340)}
    {[280,750,1180,1620].map((x,i)=> <><rect x={x-10} y={571} width={25} height={25} radius={13} fill={C.teal}/>{txt(x-100,630,350,48,['Today','Family depends','Future','Later'][i],27,C.muted,600)}</>)}
    {show(4,<>{box(610,369,700,147,C.ink)}{txt(652,393,620,100,'WHEN?',76,C.white,700)}</>)}
    {show(10,<>{box(100,713,1700,80,C.wash)}{txt(130,731,1630,48,'Life insurance addresses financial consequences.',32,C.ink,600)}</>)}
  </>);
  scene(2,'Exposure','What is vulnerable?',<>
    {box(100,306,565,390,C.ink)}{txt(140,345,480,60,'MARCUS’S INCOME',32,'#bde8dd',700)}
    {txt(140,434,470,150,'Financial support\nfor his household',48,C.white,600)}
    {arrow(728,482)}
    {['Housing','Everyday expenses','Children’s needs'].map((word,i)=>show(2+i*3,<>{box(920,292+i*144,850,113,C.white)}{txt(962,322+i*144,760,58,word,38,C.ink,600)}</>))}
    {show(11,txt(100,745,1700,48,'Exposure exists before a loss occurs.',34,C.teal,700))}
  </>);
  scene(3,'Peril and loss','The event and its consequences.',<>
    {box(100,307,733,392,C.white)}{txt(142,350,645,56,'PERIL',34,C.teal,700)}
    {show(1,txt(142,453,635,125,'Marcus’s death',57,C.ink,700))}
    {arrow(895,478)}
    {show(6,<>{box(1070,307,730,392,C.wash)}{txt(1113,350,640,56,'LOSS',34,C.teal,700)}{txt(1113,447,625,156,'Lost ongoing\nfinancial support',49,C.ink,700)}</>)}
    {show(12,txt(100,746,1700,50,'Cause of loss  →  Resulting financial harm',36,C.muted,600))}
  </>);
  scene(4,'The policy benefit','The contract controls the payment.',<>
    {box(100,278,745,502,C.white)}{txt(142,312,662,55,'EXAMPLE POLICY',28,C.teal,700)}
    {line(142,390,650,C.line)}{txt(142,435,650,125,'$500,000',87,C.ink,700)}
    {txt(142,590,655,65,'Covered death benefit',33,C.muted,600)}
    {show(4,<>{box(965,296,830,190,C.ink)}{txt(1006,326,745,135,'The stated benefit\nis governed by the policy.',38,C.white,600)}</>)}
    {show(10,<>{box(965,524,830,216,C.wash)}{txt(1006,555,745,140,'It does not promise\nunlimited future expenses.',38,C.ink,600)}</>)}
    {txt(248,794,1500,35,'Illustrative amount. Actual benefits depend on the contract.',22,C.muted)}
  </>);
  scene(5,'Physical hazard','A condition that increases danger.',<>
    {box(100,284,728,470,C.white)}
    <path x={300} y={346} width={290} height={305} d="M 10 0 L 10 300 L 250 300 L 250 0 M 10 80 L 115 165 M 148 192 L 250 270 M 250 80 L 148 165 M 115 192 L 10 270" stroke={{color:C.ink,width:22,cap:'round'}}/>
    {txt(140,681,650,48,'DEFECTIVE SAFETY EQUIPMENT',27,C.red,700)}
    {arrow(876,487)}
    {show(5,<>{box(1040,305,735,175,C.wash)}{txt(1078,340,650,100,'The condition exists\nbefore an accident.',36,C.ink,600)}</>)}
    {show(10,<>{txt(1040,539,730,55,'Greater likelihood or severity',30,C.muted,600)}<rect x={1040} y={633} width={705} height={34} radius={17} fill={C.line}/><rect x={1040} y={633} width={705} height={34} radius={17} fill={C.red} animate={[{property:'scaleX',from:0.2,to:1,at:0,duration:2}]}/></>)}
  </>);
  scene(6,'Moral hazard','Deliberate deception.',<>
    {box(100,285,760,490,C.white)}{txt(147,327,664,90,'MORAL',72,C.ink,700)}
    {[460,519,578].map((y,i)=>line(149,y,570-i*72,C.line))}
    {show(2,<>{box(142,625,650,92,C.red)}{txt(177,647,595,55,'INTENTIONAL FALSIFICATION',28,C.white,700)}</>)}
    {show(4,<>{txt(1000,318,795,155,'Dishonesty to obtain\nan insurance payment',44,C.ink,600)}{txt(1000,556,795,158,'An accidental mistake\nis a different situation.',36,C.muted)}</>)}
  </>);
  scene(7,'Morale hazard','A careless attitude.',<>
    {box(100,285,800,235,C.ink)}{txt(146,328,715,118,'MORALE',84,C.white,700)}
    {show(2,<>{box(1000,286,785,235,C.white)}{txt(1045,328,690,145,'“Insurance will\ntake care of it.”',45,C.ink,600)}</>)}
    {show(8,txt(100,582,1670,90,'Carelessness or indifference because of insurance.',41,C.muted,500))}
    {show(15,<>{box(100,696,800,103,C.white)}{txt(133,721,736,58,'MORAL  =  Dishonesty',35,C.ink,700)}{box(1000,696,785,103,C.wash)}{txt(1033,721,725,58,'MORALE  =  Carelessness',34,C.ink,700)}</>)}
  </>);
  scene(8,'Pure and speculative risk','Does the event offer a chance of gain?',<>
    {box(100,283,800,440,C.white)}{txt(140,319,725,60,'PURE RISK',37,C.teal,700)}
    {show(2,<>{txt(140,424,710,95,'Loss or no loss',54,C.ink,700)}{txt(140,579,710,100,'Possible loss of a parent’s\nfinancial support',33,C.muted)}</>)}
    {show(15,<>{box(1000,283,800,440,C.wash)}{txt(1040,319,718,60,'SPECULATIVE RISK',37,C.teal,700)}{txt(1040,424,710,95,'Gain or loss',54,C.ink,700)}{txt(1040,579,710,100,'A stock can rise\nor fall in value.',33,C.muted)}</>)}
    {show(28,txt(100,761,1700,50,'Pure risk does not automatically mean insurable.',35,C.red,700))}
  </>);
  scene(9,'Connect the ideas','Recognize what the question describes.',<>
    {['Risk|Uncertainty','Exposure|Family’s financial vulnerability','Peril|Death','Loss|Lost financial support','Hazard|A condition that increases danger'].map((row,i)=>{
      const [word,meaning]=row.split('|');
      return show(i*2.9,<>{box(100,264+i*104,1700,88,i%2?C.wash:C.white)}{txt(133,282+i*104,335,56,word,37,C.teal,700)}{txt(510,282+i*104,1240,56,meaning,37,C.ink,600)}</>);
    })}
  </>);
  scene(10,'Apply what you learned','Complete the lesson questions.',<>
    <media file={portrait} x={100} y={283} width={805} height={451} fit="contain"/>
    {box(1010,283,790,451,C.ink)}
    {txt(1052,331,698,85,'8 questions',62,C.white,700)}
    {show(1,txt(1052,454,698,160,'Read the feedback.\nRetry missed answers.',39,C.white,500))}
    {show(5,txt(1052,650,698,52,'Then finish Part 1.',34,'#bde8dd',700))}
  </>);
  await p.frame(22,'renders/poster.png');
  if (process.env.AMG_FRAMES_ONLY === '1') {
    for (const t of [3,22,44,68,91,111,135,154,177,211,237,251]) await p.frame(t,'renders/qa-'+t+'.png');
  } else await p.render('renders/picture.mp4',{bitrate:5000000,concurrency:3});
};
