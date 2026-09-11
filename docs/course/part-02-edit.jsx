export default async ({ project }) => {
  const p = await project({dir:'/home/user/amg-part-02',size:'1920x1080',fps:24,background:'#112d35'});
  const scene = await p.add('/home/user/raw.mp4');
  p.cut(scene, {from:0,dur:15,at:0,fit:'contain'});
  p.compose(
    <frame width={1920} height={1080} layout="none">
      <rect x={64} y={808} width={228} height={104} fill="#112d35" radius={8} />
      <rect x={64} y={808} width={6} height={104} fill="#8ad4c3" />
      <text x={88} y={820} width={180} height={76} fontFamily="Montserrat" fontWeight={700} fontSize={62} color="#ffffff">AMG</text>
    </frame>, {at:0,dur:15,name:'AMG preview text mark — bottom left'}
  );
  const title = (at,dur,kicker,label) => p.compose(
    <frame width={1920} height={1080} layout="none" motion={{enter:{from:{opacity:0,y:8},duration:0.3},exit:{to:{opacity:0},duration:0.3,anchor:'end'}}}>
      <rect x={836} y={66} width={828} height={148} fill="#112d35" radius={8} />
      <text x={866} y={85} width={768} height={30} fontFamily="Montserrat" fontWeight={700} fontSize={20} letterSpacing={2} color="#bde8dd">{kicker}</text>
      <text x={866} y={125} width={768} height={62} fontFamily="Montserrat" fontWeight={700} fontSize={42} color="#ffffff">{label}</text>
    </frame>, {at,dur,name:label}
  );
  title(0.5,6.9,'PART 2 · HOW INSURANCE WORKS','Risk pooling');
  title(7.8,7.2,'PART 2 · GROUP PREDICTABILITY','Law of large numbers');
  await p.frame(2,'renders/poster.png');
  await p.render('renders/branded.mp4',{bitrate:8000000,concurrency:3});
};
