(() => {
 const rows=[...document.querySelectorAll('[data-lesson]')];
 function refresh(){
  let count=0,next=null,available=true;
  for(const row of rows){
   let saved=null;
   try{saved=JSON.parse(localStorage.getItem('amg-life-lesson-'+row.dataset.lesson+'-v'+row.dataset.version)||'null');}catch(_){available=false;}
   const keys=row.dataset.answers.split(',').map(Number);
   const complete=saved?.complete===true && (saved.videoEnded===true||saved.transcriptRead===true) && Array.isArray(saved.answers) && saved.answers.length===keys.length && saved.answers.every((a,i)=>a===keys[i]);
   row.classList.toggle('is-complete',complete);
   row.querySelector('.lesson-state').textContent=complete?'Complete ✓':'Open →';
   if(complete)count++;else next ||= row;
  }
  document.getElementById('course-progress').textContent=count+' of '+rows.length+' available lessons completed'+(available?' · Saved in this browser':' · Saved progress is unavailable');
  const link=document.getElementById('continue-course');
  if(next){link.href=next.querySelector('a').getAttribute('href');link.textContent=count?'Continue with Part '+Number(next.dataset.lesson)+' →':'Start with Part 1 →';}
  else{link.href='/course/assessments/';link.textContent='Open practice and review →';}
 }
 window.addEventListener('pageshow',refresh);window.addEventListener('storage',refresh);refresh();
})();
