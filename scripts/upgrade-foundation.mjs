import fs from 'node:fs';
const shared=fs.readFileSync('public/course/shared/lesson.js','utf8');
const caption=fs.readFileSync('public/course/lesson-02/index.html','utf8').match(/<div id="inline-captions"[\s\S]*?<\/div><p id="inline-caption-text"[\s\S]*?<\/p><\/div>/)?.[0];
if(!caption)throw Error('Caption markup unavailable');
for(const id of ['01','02']){
 const base='public/course/lesson-'+id+'/';
 const old=fs.readFileSync(base+'lesson.js','utf8');
 const terms=old.slice(old.indexOf('  function selectTerm('),old.indexOf('  function update()'));
 const pool=id==='02'?old.slice(old.indexOf('  function updatePool()'),old.indexOf('  update();\n})();')):'';
 const title=id==='01'?'Risk, perils and hazards':'Pooling, large numbers and adverse selection';
 // Preserve both legacy data names for the foundation map and existing links.
 fs.writeFileSync(base+'foundation.js',`(() => {const data=window.LESSON${id};window.AMG_LESSON={...data,id:'${id}',number:${Number(id)},title:${JSON.stringify(title)},duration:${id==='01'?256:199}};const $=id=>document.getElementById(id);function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}\n${terms}${pool}\n})();\n`);
 if(fs.readFileSync(base+'index.html','utf8').includes('src="foundation.js"'))continue;
 let html=fs.readFileSync(base+'index.html','utf8').replace('<script src="lesson.js" defer></script>','<script src="foundation.js" defer></script><script src="/course/shared/lesson.js" defer></script>');
 if(id==='01')html=html.replace('</video>','</video>'+caption).replace('<link rel="stylesheet" href="lesson.css">','<link rel="stylesheet" href="lesson.css"><link rel="stylesheet" href="/course/lesson-02/lesson.css">');
 html=html.replace('</head>','<link rel="stylesheet" href="/course/shared/lesson.css"></head>').replace('<p id="transcript"></p>','<p id="transcript"></p><p>You may study the complete transcript as an alternative. The same required questions apply.</p><button id="transcript-ready" type="button">I’ve read the lesson — open questions</button>').replaceAll('Questions unlock when the video finishes.','Questions unlock after the video or transcript study.');
 fs.writeFileSync(base+'index.html',html);
}
fs.writeFileSync('public/course/shared/lesson.js',shared.replace("review.href = '#section-' + question.review;","review.href = '#' + (typeof question.review === 'number' ? 'section-' + question.review : question.review);"));
