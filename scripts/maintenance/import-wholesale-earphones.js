// Dry run: node scripts/maintenance/import-wholesale-earphones.js
// Publish verified variants: node scripts/maintenance/import-wholesale-earphones.js --apply
const fs=require('fs');const path=require('path');const {createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});const base=path.resolve(__dirname,'../../artifacts/earphones-2026-10-01');
const rows=JSON.parse(fs.readFileSync(path.join(base,'earphones.json')));
const images=JSON.parse(fs.readFileSync(path.join(base,'image-manifest.json'))).assets;
const key=v=>[v.color,v.capacity,v.ram,v.batt||'',v.condition,v.configuration||''].join('|');
const grouped=new Map(),pending=[];
for(const row of rows){const photos=images.filter(a=>a.model===row.model&&a.color===row.color).sort((a,b)=>a.index-b.index);if(photos.length<1||!photos.some(p=>p.index===0)){pending.push(row);continue;}
if(row.price!==Math.floor((row.wholesaleUsd+23)/10)*10||row.stock!==10)throw new Error('Invalid import rules');
if(!grouped.has(row.model))grouped.set(row.model,[]);grouped.get(row.model).push({...row,photos});}
fs.writeFileSync(path.join(base,'pending-earphones.json'),JSON.stringify(pending,null,2)+'\n');
console.log(`${grouped.size} models, ${[...grouped.values()].flat().length} verified variants; ${pending.length} variants awaiting reviewed galleries`);
if(rows.length!==41||grouped.size!==24||pending.length)throw new Error('Complete all 41 color variants and 24 reviewed galleries before publishing');
if(!process.argv.includes('--apply'))return;
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
const features={"JBL Endurance Pace": "Auriculares deportivos inalámbricos de oído abierto con banda de sujeción.", "JBL Endurance Peak 4": "Auriculares deportivos inalámbricos con ganchos de sujeción y estuche de carga.", "JBL Live Buds 3": "Auriculares inalámbricos intraaurales con estuche de carga inteligente.", "JBL Sense Lite": "Auriculares inalámbricos de oído abierto con ganchos y estuche de carga.", "JBL Sense Pro": "Auriculares inalámbricos de oído abierto con ganchos y estuche de carga.", "JBL Soundgear Clips": "Auriculares inalámbricos de oído abierto con diseño de clip y estuche de carga.", "JBL Tune 110": "Auriculares intraaurales con cable, conector de 3,5 mm y micrófono.", "JBL Tune 520C": "Auriculares con diadema y conexión por cable USB-C.", "Samsung Type-C": "Auriculares intraaurales con cable USB-C y micrófono. Consultá la compatibilidad de audio USB-C de tu dispositivo.", "Sony PULSE Explore": "Auriculares inalámbricos para PlayStation con estuche de carga y conexión PlayStation Link.", "JBL Tune 510BT": "Auriculares inalámbricos con diadema y conexión Bluetooth.", "JBL Tune 520BT": "Auriculares inalámbricos con diadema y conexión Bluetooth.", "JBL Tune 530BT": "Auriculares inalámbricos con diadema y conexión Bluetooth.", "JBL Tune 720BT": "Auriculares inalámbricos con diadema y conexión Bluetooth.", "JBL Tune 730BT": "Auriculares inalámbricos con diadema y conexión Bluetooth.", "JBL Tune 770NC": "Auriculares inalámbricos con diadema y cancelación activa de ruido.", "JBL Tune 780NC": "Auriculares inalámbricos con diadema y cancelación activa de ruido.", "JBL Tune Buds 2": "Auriculares inalámbricos con cancelación de ruido y estuche de carga.", "JBL Tune Flex 2": "Auriculares inalámbricos con cancelación de ruido y estuche de carga.", "JBL Wave Buds 2": "Auriculares inalámbricos con cancelación de ruido y estuche de carga.", "Redmi Buds 6 Play": "Auriculares inalámbricos Bluetooth con estuche de carga.", "Redmi Buds 8 Active": "Auriculares inalámbricos Bluetooth con estuche de carga.", "Redmi Buds 8 Lite": "Auriculares inalámbricos Bluetooth con estuche de carga.", "Redmi Buds 8 Pro": "Auriculares inalámbricos Bluetooth con estuche de carga."};
const prefix='wholesale-earphones-2026-10-01';
async function main(){
const {data:current,error}=await db.from('products').select('*').is('archived_at',null);if(error)throw error;
const snapshot=path.join(base,'before-import.json');if(!fs.existsSync(snapshot))fs.writeFileSync(snapshot,JSON.stringify(current,null,2)+'\n');
const active=new Map();for(const p of current){if(active.has(p.name)&&grouped.has(p.name))throw new Error(`Duplicate active model ${p.name}`);active.set(p.name,p);}
const {data:listed,error:listError}=await db.storage.from('uploads').list(prefix,{limit:1000});if(listError)throw listError;
const stored=new Set(listed.map(f=>f.name));
const needed=[...new Set([...grouped.values()].flatMap(r=>r.flatMap(r=>r.photos.map(p=>p.file))))];
for(const [index,file]of needed.entries()){if(!stored.has(file)){const {error}=await db.storage.from('uploads').upload(`${prefix}/${file}`,fs.readFileSync(path.join(base,'images',file)),{contentType:'image/webp',cacheControl:'31536000',upsert:false});if(error)throw new Error(`${file}: ${error.message}`);}if(index%50===0)console.log(`Photos ready ${index+1}/${needed.length}`);}
const url=file=>db.storage.from('uploads').getPublicUrl(`${prefix}/${file}`).data.publicUrl;
const resultPath=path.join(base,'import-result.json');
const result=fs.existsSync(resultPath)?JSON.parse(fs.readFileSync(resultPath)):[];
for(const [model,entries]of grouped){const existing=active.get(model);const oldVariants=existing?(Array.isArray(existing.variants)?existing.variants:JSON.parse(existing.variants||'[]')):[];
const variants=[...oldVariants];let added=0;
for(const row of entries){if(variants.some(v=>key(v)===key(row)))continue;const photos=row.photos.map(p=>url(p.file));variants.push({color:row.color,capacity:row.capacity,ram:row.ram,batt:row.batt,condition:row.condition,configuration:row.configuration,processor:row.processor,screen:row.screen,touch:row.touch,gpu:row.gpu,os:row.os,price:row.price,stock:10,image_url:photos[0],images:photos,...(row.photos[0].rgb?{color_hex:row.photos[0].rgb}:{})});added++;}
if(!added){console.log(model,'already imported');continue;}
const photos=[...new Set([...(existing?.images||[]),...variants.flatMap(v=>[v.image_url,...(v.images||[])])].filter(Boolean))];
const conditions=[...new Set(variants.map(v=>v.condition).filter(Boolean))];
const description=`[Condición: ${conditions.join(' / ')}] ${model}. ${features[model]} Elegí el color disponible para consultar su precio y stock. Fotos de referencia del modelo y acabado; el diseño del empaque puede variar según la región.`;
const product={name:model,description,price:existing?.price||Math.min(...variants.map(v=>v.price)),image_url:existing?.image_url||photos[0],images:photos,brand:entries[0].brand,category:'accesorios',stock:variants.reduce((sum,v)=>sum+Number(v.stock||0),0),variants,...(!existing?{is_offer:false}:{})};
let q=existing?db.from('products').update(product).eq('id',existing.id).eq('stock',existing.stock).eq('variants',JSON.stringify(existing.variants)):db.from('products').insert(product);
const {data:saved,error:saveError}=await q.select('id,name,variants,stock');if(saveError)throw new Error(`${model}: ${saveError.message}`);if(saved?.length!==1)throw new Error(`${model}: concurrent edit, retry from fresh data`);
if(saved[0].variants.length!==variants.length||saved[0].stock!==product.stock)throw new Error(`${model}: verification mismatch`);
result.push({id:saved[0].id,model,added,created:!existing});console.log(model,`#${saved[0].id}: +${added} variants`);
fs.writeFileSync(path.join(base,'import-result.json'),JSON.stringify(result,null,2)+'\n');
}
console.log('Verified import complete:',new Set(result.map(r=>r.model)).size,'models;',result.reduce((s,r)=>s+r.added,0),'new variants');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
