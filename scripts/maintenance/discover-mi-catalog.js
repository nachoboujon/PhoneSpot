const fs=require('fs');const base='artifacts/wholesale-2026-10-01';const rows=require('../../'+base+'/phones.json');
fs.mkdirSync(`${base}/mi-catalogs`,{recursive:true});
const slug=s=>s.toLowerCase().replace(/\+/g,' plus ').replace(/[^a-z0-9]+/g,'-');
const queue=[...new Set(rows.filter(r=>['Xiaomi','Redmi','POCO'].includes(r.brand)).map(r=>r.model))];
async function main(){await Promise.all(Array.from({length:5},async()=>{while(queue.length){const model=queue.shift();let tag=slug(model);if(model==='POCO X6 Pro 5G')tag='poco-x6-pro';if(model==='Redmi Note 14 Pro+ 5G')tag='redmi-note-14-pro-plus-5g';if(model==='Redmi Note 15 Pro+')tag='redmi-note-15-pro-plus-5g';
 for(const region of ['es','uk','de','fr','it']){try{const r=await fetch(`https://go.buy.mi.com/${region}/v2/item/productdetail?tag=${tag}&from=pc`,{signal:AbortSignal.timeout(18000)});const j=await r.json();const items=j.data?.item_detail?.spu_list?.flatMap(p=>p.item_list||[]);if(!items?.length)continue;fs.writeFileSync(`${base}/mi-catalogs/${slug(model)}.json`,JSON.stringify({model,tag,region,data:j.data},null,2));console.log(model,region,items.length,[...new Set(items.map(i=>i.item_name.replace(/\s+\d+\s*GB.*$/,'')))].join(' | '));break;}catch(e){console.log(model,region,e.message);}}
}}));}main();
