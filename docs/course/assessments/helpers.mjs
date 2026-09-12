// Each authored row has its own facts and reasoning; no generated stem variants.
// The correct option is first in source for editorial review; the build shuffles it.
export const item=(lesson,prompt,correct,a,b,c,explanation)=>({lesson:String(lesson).padStart(2,'0'),prompt,options:[correct,a,b,c],answer:0,explanation});
export const domains=['Maryland regulation','General insurance','Life foundations','Policy types','Provisions, options and riders','Annuities','Federal taxation','Qualified plans'];
export const blueprint=[24,8,14,8,11,7,6,2];
export const simulation=[2,2,2,1,1,1,1,0];
