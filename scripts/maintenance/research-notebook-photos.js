const fs=require('node:fs');
const base='artifacts/notebooks-2026-10-01';
const pages=JSON.parse(fs.readFileSync(`${base}/photo-pages.json`));
async function main(){
const result=await Promise.all(pages.map(async p=>{
 const file=`${base}/page-${p.key}.html`;
 let html;
 if(fs.existsSync(file))html=fs.readFileSync(file,'utf8');else{
 let r;try{r=await fetch(p.page,{signal:AbortSignal.timeout(15000)});}catch(e){return {...p,error:e.message};}
  if(!r.ok)return {...p,error:`HTTP ${r.status}`};
  html=await r.text();fs.writeFileSync(file,html);
 }
 const clean=html.replace(/\\\//g,'/').replace(/\\u002F/g,'/').replace(/&amp;/g,'&');
 const images=[...new Set(clean.match(/https?:[^\s"'<>\\]+(?:\.(?:png|jpg|jpeg|webp)|\/is\/image\/)[^\s"'<>\\]*/gi)||[])];
 return {...p,images};
}));
fs.writeFileSync(`${base}/photo-candidates.json`,JSON.stringify(result,null,2)+'\n');
for(const p of result) console.log(p.key,p.error||`${p.images.length} image candidates`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
