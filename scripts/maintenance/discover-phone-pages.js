const fs=require('node:fs');
const base='artifacts/wholesale-2026-10-01';const rows=require('../../'+base+'/phones.json');
const models=[...new Set(rows.filter(r=>['Xiaomi','Redmi','POCO','Motorola','Infinix','Itel','Realme','Apple','CAT','Nokia','UR','Cubot'].includes(r.brand)).map(r=>r.model))];
fs.mkdirSync(`${base}/pages`,{recursive:true});
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const queue=[...models];
async function main(){await Promise.all(Array.from({length:5},async()=>{while(queue.length){const model=queue.shift();
 let url;if(/^(Xiaomi|Redmi|POCO) /.test(model))url=`https://www.mi.com/global/product/${slug(model)}/specs/`;
 else if(model.startsWith('Motorola'))url=`https://www.motorola.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(model.replace('Motorola','moto'))}`;
 else if(model.startsWith('iPhone'))url=`https://www.apple.com/shop/buy-iphone/${slug(model)}`;
 else if(model.startsWith('Itel'))url='https://www.itel-life.com/products/phone/a-series/a200';
 else if(model.startsWith('Infinix'))url=`https://www.infinixmobility.com/${slug(model.replace('Infinix ',''))}`;
 else continue;
 try{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});const text=await r.text();fs.writeFileSync(`${base}/pages/${slug(model)}.html`,text);console.log(model,r.status,text.length);}catch(e){console.log(model,e.message);}
}}));}
main();
