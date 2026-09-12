(() => {
 const rows=[...document.querySelectorAll('[data-lesson]')];
 function refresh(){
  let count=0,next=null,available=true;
  for(const row of rows){
   let saved=null;
   try{saved=JSON.parse(localStorage.getItem('amg-life-lesson-'+row.dataset.lesson+'-v'+row.dataset.version)||'null');}catch(_){available=false;}
   const complete=saved?.complete===true;
   row.classList.toggle('is-complete',complete);
   row.querySelector('.lesson-state').textContent=complete?'Complete ✓':'Open →';
   if(complete)count++;else next ||= row;
  }
  document.getElementById('course-progress').textContent=count+' of '+rows.length+' available lessons completed'+(available?' · Saved in this browser':' · Saved progress is unavailable');
  const link=document.getElementById('continue-course');
  if(next){link.href=next.querySelector('a').getAttribute('href');link.textContent=count?'Continue with Part '+Number(next.dataset.lesson)+' →':'Start with Part 1 →';}
  else{link.href='#lessons';link.textContent='Review your lessons →';}
 }
 window.addEventListener('pageshow',refresh);window.addEventListener('storage',refresh);refresh();
})();
