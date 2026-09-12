export const source=(title,url)=>({title,url}); // Actual verification is recorded in the source ledger.
export const statute=(section)=>source('Maryland Insurance §'+section,'https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gin&section='+section);
export const rule=(section)=>source('COMAR '+section,'https://regs.maryland.gov/us/md/exec/comar/'+section);
export const block=(title,narration,visual,topics=[])=>({title,narration,visual,topics});
export const q=(id,prompt,options,answer,explanations,topics,review=0)=>({id,prompt,options,answer,explanations,topics,review});
export const note=(title,text,example,topics)=>({title,text,example,topics});
export const lesson=(number,data)=>({number,id:String(number).padStart(2,'0'),version:1,...data});
