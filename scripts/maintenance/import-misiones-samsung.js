// Only imports normalized supplier rows with visually reviewed official model/color photos.
const fs=require('node:fs'),path=require('node:path'),{createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});
const base=path.resolve(__dirname,'../../artifacts/misiones-samsung-2026-10-05');
const rows=JSON.parse(fs.readFileSync(path.join(base,'ready.json')));
const stockArg=process.argv.indexOf('--stock'),initialStock=stockArg<0?0:Number(process.argv[stockArg+1]);
if(!Number.isSafeInteger(initialStock)||initialStock<0)throw Error('Invalid stock');
const norm=s=>String(s||'').toLowerCase().replace(/\s/g,'');
const key=v=>[v.color,v.capacity,v.ram,v.condition,v.configuration||''].map(norm).join('|');
const groups=new Map();for(const r of rows){if(Math.round((r.wholesaleUsd+30)*100)/100!==r.price||r.sourceAt!=='2026-10-05T09:32'||!r.photos.length)throw Error('Invalid source/price/photos');if(!groups.has(r.model))groups.set(r.model,[]);groups.get(r.model).push(r);}
async function main(){
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
 const products=[];for(let offset=0;;offset+=500){const {data,error}=await db.from('products').select('*').order('id').range(offset,offset+499);if(error)throw error;products.push(...data);if(data.length<500)break;}
 console.log(JSON.stringify({models:groups.size,variants:rows.length,newModels:[...groups.keys()].filter(n=>!products.some(p=>p.name===n)).length,initialStock}));
 if(!process.argv.includes('--apply'))return;
 const snapshot=path.join(base,'before-import.json');if(!fs.existsSync(snapshot))fs.writeFileSync(snapshot,JSON.stringify(products,null,2)+'\n');
 const prefix='misiones-samsung-2026-10-05',urls=new Map();
 const {data:stored,error:listError}=await db.storage.from('uploads').list(prefix,{limit:1000});if(listError)throw listError;
 const present=new Set(stored.map(f=>f.name));
 for(const file of new Set(rows.flatMap(r=>r.photos.map(p=>p.file)))){
  if(!present.has(file)){const {error}=await db.storage.from('uploads').upload(prefix+'/'+file,fs.readFileSync(path.join(base,file)),{contentType:'image/jpeg',cacheControl:'31536000',upsert:false});if(error&&!/duplicate|already exists/i.test(error.message))throw error;}
  urls.set(file,db.storage.from('uploads').getPublicUrl(prefix+'/'+file).data.publicUrl);
 }
 const appliedPath=path.join(base,'applied.json');const applied=fs.existsSync(appliedPath)?JSON.parse(fs.readFileSync(appliedPath)):[];
 const ledgerPath=path.resolve(base,'../misiones-supplier-state.json');const ledger=JSON.parse(fs.readFileSync(ledgerPath));
 for(const [name,entries]of groups){
  const all=products.filter(p=>p.name===name);if(all.length>1)throw Error('Duplicate product '+name);const existing=all[0];if(existing?.archived_at){console.log(name,'archived; preserved');continue;}
  const variants=structuredClone(existing?(typeof existing.variants==='string'?JSON.parse(existing.variants):existing.variants||[]):[]);
  let added=0,changed=0;
  for(const r of entries){
   const photos=r.photos.map(p=>urls.get(p.file)),index=variants.findIndex(v=>key(v)===key(r));
   if(index>=0){if(Number(variants[index].price)!==r.price){variants[index].price=r.price;changed++;}continue;}
   variants.push({color:r.color,capacity:r.capacity,ram:r.ram,batt:'',condition:r.condition,configuration:'',price:r.price,stock:initialStock,image_url:photos[0],images:photos,...(r.colorHex?{color_hex:r.colorHex}:{})});added++;
  }
  if(!added&&!changed)continue;
  const images=[...new Set([...(existing?.images||[]),...variants.flatMap(v=>[v.image_url,...(v.images||[])])].filter(Boolean))];
  const payload={price:Math.min(...variants.map(v=>Number(v.price))),stock:variants.reduce((s,v)=>s+Number(v.stock||0),0),variants,images,image_url:existing?.image_url||images[0]};
  let query;
  if(existing)query=db.from('products').update(payload).eq('id',existing.id).is('archived_at',null).eq('price',existing.price).eq('stock',existing.stock).eq('variants',typeof existing.variants==='string'?existing.variants:JSON.stringify(existing.variants));
  else query=db.from('products').insert({...payload,name,brand:'Samsung',category:'celulares',description:'[Condición: Nuevo] '+name+'. Elegí la variante para ver capacidad, RAM, color y precio. Fotos oficiales de referencia del modelo y acabado. Consultá disponibilidad y condiciones de entrega.',is_offer:false});
  const {data,error}=await query.select('id,name,variants,stock,price');if(error)throw error;if(data?.length!==1)throw Error('Concurrent edit '+name);
  if(data[0].variants.length!==variants.length||data[0].stock!==payload.stock)throw Error('Write verification mismatch');
  for(const r of entries){const index=variants.findIndex(v=>key(v)===key(r));ledger[data[0].id+'|'+index]={sourceAt:r.sourceAt,filename:r.filename,wholesaleUsd:r.wholesaleUsd,price:r.price};}
  fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
  applied.push({id:data[0].id,name,added,changed,created:!existing});fs.writeFileSync(appliedPath,JSON.stringify(applied,null,2)+'\n');console.log(name,added,'new variants');
 }
 const verification=[];
 for(const p of new Map(applied.map(p=>[p.id,p])).values()){const {data,error}=await db.from('products').select('id,name,variants,price,stock,images').eq('id',p.id).single();if(error)throw error;
  for(const r of groups.get(p.name)){const v=data.variants.find(v=>key(v)===key(r));if(!v||Number(v.price)!==r.price||v.images.length<r.photos.length)throw Error('Readback mismatch '+p.name);}
  const publicResponse=await fetch('https://www.phonespot.site/api/products/'+p.id);if(!publicResponse.ok)throw Error('Live store readback failed');const live=await publicResponse.json();if(Number(live.price)!==Number(data.price))throw Error('Live price mismatch');verification.push({id:p.id,name:p.name,price:data.price,variants:data.variants.length,publicVerified:true});
 }
 fs.writeFileSync(path.join(base,'verification.json'),JSON.stringify(verification,null,2)+'\n');
 fs.writeFileSync(path.resolve(base,'../misiones-sync-2026-10-05/reviewed-templates.json'),JSON.stringify(rows,null,2)+'\n');
 console.log(JSON.stringify({modelsVerified:verification.length,variantsAdded:applied.reduce((s,p)=>s+p.added,0)}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
