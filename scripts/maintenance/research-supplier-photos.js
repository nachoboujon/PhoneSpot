const fs=require('fs');const base='artifacts/categories-2026-10-02';
const rows=JSON.parse(fs.readFileSync(`${base}/selected.json`));const sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const queries=[...new Set([...rows.map(r=>r.brand),'Galaxy','Tab','Watch','Game Stick','Virtual','Xiaoxin','Pad',...rows.filter(r=>!sets.some(s=>s.model===r.model&&s.color===r.color)).map(r=>r.model.replace(r.brand+' ',''))])];const candidates=[];
async function search(q){const file=`${base}/research/supplier-query-${normalize(q)}.json`;if(fs.existsSync(file)){candidates.push(...JSON.parse(fs.readFileSync(file)).data);return;}const response=await fetch(`https://misioneselectronica.com/api/v1/public/products/search?q=${encodeURIComponent(q)}&limit=100`,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(response.status);const data=await response.json();fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');candidates.push(...data.data);}
async function main(){await Promise.all(Array.from({length:4},async()=>{while(queries.length){const q=queries.shift();try{await search(q);}catch(e){console.log(q,e.message);}}}));
 const unique=[...new Map(candidates.map(p=>[p.slug,p])).values()];
 const added=[],pending=[];
 for(const row of rows){if(sets.some(s=>s.model===row.model&&s.color===row.color&&(!s.configuration||s.configuration===row.configuration)))continue;
  const raw=normalize(row.sourceText.split('USD')[0]);
  const matches=unique.filter(p=>!/(?:nsg|generico)/i.test(p.name+' '+p.slug)&&raw.startsWith(normalize(p.name))&&(row.flags.includes('color-unspecified')||!row.color||normalize(p.slug).includes(normalize(row.color)))&&(!row.capacity||normalize(p.slug).includes(normalize(row.capacity))));
  if(matches.length!==1){pending.push({...row,reason:matches.length?'Ambiguous supplier match':'No exact supplier model/color found'});continue;}
  const p=matches[0];const parts=p.image_url.split('/');const source=`https://misioneselectronica.com/api/v1/admin/serve-image/${parts.at(-2)}/${parts.at(-1)}?v=${p.image_version}`;
  const set={model:row.model,color:row.color,...(row.model==='Sony PlayStation 5'?{configuration:row.configuration}:{}),page:`https://misioneselectronica.com/catalogo/producto/${p.slug}`,sourceType:'retailer',supplierName:p.name,supplierSlug:p.slug,sources:[source]};sets.push(set);added.push(set);
 }
 fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');fs.writeFileSync(`${base}/pending-supplier-photos.json`,JSON.stringify(pending,null,2)+'\n');
 console.log({publicCatalogProducts:unique.length,exactPhotoMatches:added.length,pendingVariants:pending.length});
}
main().catch(e=>{console.error(e);process.exitCode=1});
