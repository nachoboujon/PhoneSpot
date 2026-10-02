// Dry run by default; --apply uploads reviewed photos and imports available variants.
const fs=require('fs'),path=require('path'),{createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});const base=path.resolve(__dirname,'../../artifacts/categories-2026-10-02');
const rows=JSON.parse(fs.readFileSync(path.join(base,'selected.json')));
const assets=JSON.parse(fs.readFileSync(path.join(base,'image-manifest.json'))).assets;
const blocked=fs.existsSync(path.join(base,'photo-review-blocked.json'))?JSON.parse(fs.readFileSync(path.join(base,'photo-review-blocked.json'))):[];
const key=v=>[v.color,v.capacity,v.ram,v.batt||'',v.condition,v.configuration||''].join('|');
const grouped=new Map(),pending=[];
for(const row of rows){
 const expected=row.kind==='speakers'?Math.ceil(row.wholesaleUsd*1.5/10)*10:Math.floor((row.wholesaleUsd+({tablets:row.model.includes('iPad')?35:30,watches:25,consoles:55}[row.kind])+5)/10)*10;
 if(row.price!==expected||row.stock!==10||row.flags.includes('generic'))throw Error('Invalid scope/price: '+row.model);
 const reason=blocked.find(b=>b.model===row.model&&(!b.color||b.color===row.color));
 const matching=assets.filter(a=>a.model===row.model&&a.color===row.color);
 const exact=matching.filter(a=>a.configuration&&a.configuration===row.configuration);
 const photos=(exact.length?exact:matching.filter(a=>!a.configuration)).sort((a,b)=>a.index-b.index);
 if(reason||!photos.length){pending.push({...row,reason:reason?.reason||'Falta una foto validada del modelo y acabado exactos'});continue;}
 if(!grouped.has(row.model))grouped.set(row.model,[]);grouped.get(row.model).push({...row,photos});
}
fs.writeFileSync(path.join(base,'pending-import.json'),JSON.stringify(pending,null,2)+'\n');
console.log(`${grouped.size} models, ${[...grouped.values()].flat().length} variants ready; ${pending.length} variants need photos`);
if(!process.argv.includes('--apply'))return;
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY),prefix='wholesale-categories-2026-10-02';
const typeText={tablets:'Tablet para trabajo, estudio y entretenimiento.',speakers:'Equipo de audio. Consultá el modelo y la configuración elegida para coordinar tu pedido.',watches:'Reloj inteligente. Elegí el acabado y el tamaño disponibles.',consoles:'Equipo para videojuegos.'};
function describe(row){let text=typeText[row.kind];if(/Kindle/.test(row.model))text='Lector de libros electrónicos Kindle.';if(/Quest|PICO/.test(row.model))text='Visor de realidad virtual.';if(/Game Stick/.test(row.model))text='Equipo de juegos retro para conectar a un televisor.';if(/Band|Fit3/.test(row.model))text='Pulsera inteligente para uso diario.';if(row.model==='Sony PlayStation 5')text='Consola PlayStation 5. La edición Digital no incluye lector de discos; la edición con lector corresponde al paquete Fortnite indicado en la variante.';
 return `[Condición: Nuevo] ${text} Elegí la variante para ver color, capacidad, configuración, precio y stock. Fotos de referencia del modelo y acabado; el empaque puede variar según la región.`;}
async function main(){
 const current=[];for(let offset=0;;offset+=500){const {data,error}=await db.from('products').select('*').order('id').range(offset,offset+499);if(error)throw error;current.push(...data);if(data.length<500)break;}
 const snapshot=path.join(base,'before-import.json');if(!fs.existsSync(snapshot))fs.writeFileSync(snapshot,JSON.stringify(current.filter(p=>!p.archived_at),null,2)+'\n');
 const active=new Map(),archivedNames=new Set();for(const p of current){if(p.archived_at){archivedNames.add(p.name);continue;}if(active.has(p.name)&&grouped.has(p.name))throw Error('Duplicate model '+p.name);active.set(p.name,p);}
 const {data:listed,error:listError}=await db.storage.from('uploads').list(prefix,{limit:1000});if(listError)throw listError;const stored=new Set(listed.map(f=>f.name));
 const needed=[...new Set([...grouped.values()].flatMap(entries=>entries.flatMap(row=>row.photos.map(p=>p.file))))];
 const queue=[...needed];let uploaded=0;await Promise.all(Array.from({length:4},async()=>{while(queue.length){const file=queue.shift();if(!stored.has(file)){const {error}=await db.storage.from('uploads').upload(`${prefix}/${file}`,fs.readFileSync(path.join(base,'images',file)),{contentType:'image/webp',cacheControl:'31536000',upsert:false});if(error)throw Error(`${file}: ${error.message}`);}uploaded++;if(uploaded%50===0)console.log('Photos ready',uploaded,'/',needed.length);}}));
 const url=file=>db.storage.from('uploads').getPublicUrl(`${prefix}/${file}`).data.publicUrl;
 const resultPath=path.join(base,'import-result.json'),result=fs.existsSync(resultPath)?JSON.parse(fs.readFileSync(resultPath)):[];
 for(const [model,entries]of grouped){if(archivedNames.has(model)&&!active.has(model)){console.log(model,'archived; skipped');continue;}const existing=active.get(model),oldVariants=existing?(Array.isArray(existing.variants)?existing.variants:JSON.parse(existing.variants||'[]')):[],variants=[...oldVariants];let added=0;
 for(const row of entries){if(variants.some(v=>key(v)===key(row)))continue;const photos=[...new Set(row.photos.map(p=>url(p.file)))];variants.push({color:row.color,capacity:row.capacity,ram:row.ram,batt:row.batt,condition:row.condition,configuration:row.configuration,price:row.price,stock:10,image_url:photos[0],images:photos,...(row.photos[0].rgb?{color_hex:row.photos[0].rgb}:{})});added++;}
 if(!added){console.log(model,'already imported');continue;}
 const photos=[...new Set([...(existing?.images||[]),...variants.flatMap(v=>[v.image_url,...(v.images||[])])].filter(Boolean))];
 const product={name:model,description:existing?.description||describe(entries[0]),price:existing?.price||Math.min(...variants.map(v=>v.price)),image_url:existing?.image_url||photos[0],images:photos,brand:entries[0].brand,category:entries[0].category,stock:variants.reduce((s,v)=>s+Number(v.stock||0),0),variants,...(!existing?{is_offer:false}:{})};
 const q=existing?db.from('products').update(product).eq('id',existing.id).eq('stock',existing.stock).eq('variants',JSON.stringify(existing.variants)):db.from('products').insert(product);
 const {data:saved,error:saveError}=await q.select('id,name,variants,stock');if(saveError)throw Error(`${model}: ${saveError.message}`);if(saved?.length!==1)throw Error(`${model}: concurrent edit; retry with fresh data`);
 if(saved[0].variants.length!==variants.length||saved[0].stock!==product.stock)throw Error(model+': verification mismatch');
 result.push({id:saved[0].id,model,added,created:!existing});fs.writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n');console.log(model,`#${saved[0].id}: +${added} variants`);
 }
 console.log('Imported',new Set(result.map(r=>r.model)).size,'models;',result.reduce((s,r)=>s+r.added,0),'variants');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
