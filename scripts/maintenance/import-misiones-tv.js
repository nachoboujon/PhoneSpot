// Source identity and price are reviewed in artifacts/misiones-tv-2026-10-05/source.json.
const fs=require('node:fs'),path=require('node:path'),{createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});
const base=path.resolve(__dirname,'../../artifacts/misiones-tv-2026-10-05');
const policy=require('../../config/misiones-supplier-policy.json');
const source=JSON.parse(fs.readFileSync(path.join(base,'source.json'),'utf8'));
const stockArg=process.argv.indexOf('--stock');
const initialStock=stockArg>=0?Number(process.argv[stockArg+1]):0;
if(!Number.isSafeInteger(initialStock)||initialStock<0)throw Error('Invalid initial stock');
if(source.sourceChat!==policy.sourceChat||!policy.televisions.allowedSizesInches.includes(source.screenInches)||!policy.televisions.brands.includes('Marson'))throw Error('Source outside authorized scope');
const price=Math.round((source.wholesaleUsd+policy.televisions.markupsUsdBySize[source.screenInches])*100)/100;
if(price!==143.8||price!==source.priceUsd)throw Error('Incorrect TV price');
async function main(){
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
 const {data:matches,error}=await db.from('products').select('*').ilike('name','%MAS32%');if(error)throw error;
 if(matches.some(p=>p.archived_at))throw Error('Model was archived; do not recreate');
 if(matches.length>1)throw Error('Duplicate model');
 console.log(JSON.stringify({model:'Marson MAS32 Smart TV 32"',price,existing:matches.map(p=>p.id),stock:matches[0]?.stock??initialStock,photos:4}));
 if(!process.argv.includes('--apply'))return;
 fs.writeFileSync(path.join(base,'before-import.json'),JSON.stringify(matches,null,2)+'\n');
 const prefix='misiones-tv-2026-10-05',urls=[];
 for(let i=1;i<=4;i++){
  const file='marson-mas32-'+String(i).padStart(2,'0')+'.webp';
  const {error:uploadError}=await db.storage.from('uploads').upload(prefix+'/'+file,fs.readFileSync(path.join(base,file)),{contentType:'image/webp',cacheControl:'31536000',upsert:false});
  if(uploadError&&!/already exists|duplicate/i.test(uploadError.message))throw uploadError;
  const url=db.storage.from('uploads').getPublicUrl(prefix+'/'+file).data.publicUrl;
  const response=await fetch(url);if(!response.ok||!(response.headers.get('content-type')||'').includes('image/webp'))throw Error('Photo readback failed');urls.push(url);
 }
 const images=[urls[2],urls[0],urls[1],urls[3]];
 const old=matches[0];
 if(old){
  const v=typeof old.variants==='string'?JSON.parse(old.variants):old.variants||[];
  if(v.length!==1||!String(v[0].configuration).includes('32'))throw Error('Existing variants need manual review');
  v[0].price=price;
  const {data,error:updateError}=await db.from('products').update({price,variants:v}).eq('id',old.id).is('archived_at',null).eq('price',old.price).eq('stock',old.stock).eq('variants',typeof old.variants==='string'?old.variants:JSON.stringify(old.variants)).select('id');
  if(updateError)throw updateError;if(data?.length!==1)throw Error('Concurrent change');
 }else{
  const variant={color:'Negro',capacity:'',ram:'',batt:'',condition:'Nuevo',configuration:'32 pulgadas · MAS32',price,stock:initialStock,image_url:images[0],images};
  const {data,error:insertError}=await db.from('products').insert({name:'Marson MAS32 Smart TV 32"',description:'[Condición: Nuevo] Smart TV Marson MAS32 de 32 pulgadas, en color negro. Pantalla LED HD y sistema Android. Conexiones HDMI y USB. Fotos de referencia del modelo. Consultá disponibilidad y condiciones de entrega antes de comprar.',price,brand:'Marson',category:'accesorios',stock:initialStock,variants:[variant],image_url:images[0],images,is_offer:false}).select('id').single();
  if(insertError)throw insertError;matches.push(data);
 }
 const id=matches[0].id;
 const {data:saved,error:readError}=await db.from('products').select('*').eq('id',id).single();if(readError)throw readError;
 const v=typeof saved.variants==='string'?JSON.parse(saved.variants):saved.variants;
 if(Number(saved.price)!==price||Number(v[0].price)!==price||saved.stock!==(old?old.stock:initialStock))throw Error('Product verification failed');
 if(!old&&saved.images.length!==4)throw Error('Missing gallery');
 fs.writeFileSync(path.join(base,'import-result.json'),JSON.stringify({id,created:!old,sourceAt:source.sourceAt,price,stock:saved.stock,images:saved.images,verified:true},null,2)+'\n');
 const ledgerPath=path.resolve(base,'../misiones-supplier-state.json');const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{};
 ledger[id+'|0']={sourceAt:source.sourceAt,filename:'WhatsApp TV MARSON 32 · 29/9/2026 12:11',wholesaleUsd:source.wholesaleUsd,price};
 fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
 console.log(JSON.stringify({id,price,stock:saved.stock,verified:true}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
