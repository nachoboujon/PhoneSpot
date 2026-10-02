const fs=require('fs'),base='artifacts/categories-2026-10-02';
async function main(){
 let sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));
 for(const s of sets){if(s.model==='Apple Watch Ultra 3')s.color='Titanio Negro';if(s.model==='Blulory RTS')s.sources=s.sources.slice(0,1);if(s.model==='Hotwav R10 Pro')s.model='Hotwav Tab R10 Pro';if(s.model==='Mox MO-TP1082')s.model='MOX pro MO-TP1082';if(s.model==='Xiaomi Watch S5')s.sources=s.sources.slice(0,2);if(s.model==='JBL PartyBox On the Go 2 Plus')s.sources.sort((a,b)=>Number(/FRONT/i.test(b))-Number(/FRONT/i.test(a)));}
 function save(s){sets=sets.filter(a=>a.model!==s.model||a.color!==s.color||(a.configuration||'')!==(s.configuration||''));sets.push(s);}
 const hot=sets.find(s=>s.model==='REVIEW Hotwav R10');
 if(hot)save({model:'Hotwav Tab R10 Pro',color:'Negro',sourceType:'manufacturer',page:hot.page,sources:hot.sources.filter(u=>/R10_Black/i.test(u))});
 const candidates=JSON.parse(fs.readFileSync(`${base}/research/mega-candidates.json`));
 for(const [id,model,color] of [['1479430','G-Tide R6 Pro','Negro'],['1479447','G-Tide R6 Pro','Gris'],['1580778','Blackview W90 Pro','Plata'],['1665345','MOX pro MO-TP1082','Azul']]){
  const page=Object.values(candidates).flat().find(u=>u.includes('/'+id+'/'));if(!page)continue;
  const f=`${base}/research/mega-${id}.html`;try{let h;if(fs.existsSync(f))h=fs.readFileSync(f,'utf8');else{const r=await fetch(page,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(r.status);h=await r.text();fs.writeFileSync(f,h);}
   const sources=[...new Set([...h.matchAll(/https:\/\/resource\.megaeletronicos\.com\/uploads\/Product\/[^"\s<>]+/g)].map(m=>m[0]).filter(u=>u.includes('/'+id.slice(0,-1)+'/')))];
   if(sources.length){save({model,color,page,sourceType:'retailer',sources});console.log(model,color,sources.length);}
  }catch(e){console.log(model,e.message);}
 }
 sets=sets.filter(s=>!s.model.startsWith('REVIEW'));
 fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1});
