// Read-only checks of the published notebook import and public photo files.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});
const base='artifacts/earphones-2026-10-01';
const rows=JSON.parse(fs.readFileSync(`${base}/earphones.json`));
const imported=JSON.parse(fs.readFileSync(`${base}/import-result.json`));
const before=JSON.parse(fs.readFileSync(`${base}/before-import.json`));
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
const key=v=>[v.color,v.capacity,v.ram,v.configuration].join('|');
async function main(){
 const {data:products,error}=await db.from('products').select('*').is('archived_at',null);if(error)throw error;
 const photos=new Set();let verified=0;
 for(const row of rows){
  const matches=products.filter(p=>p.name===row.model);assert.equal(matches.length,1,row.model);
  const p=matches[0];assert.equal(p.category,'accesorios');
  const variants=typeof p.variants==='string'?JSON.parse(p.variants):p.variants;
  assert.equal(new Set(variants.map(key)).size,variants.length,`${p.name}: unique configurations`);
  const v=variants.find(v=>key(v)===key(row));assert.ok(v,`${p.name}: configuration missing`);
  assert.equal(v.price,Math.floor((row.wholesaleUsd+23)/10)*10);assert.equal(v.stock,10);
  assert.equal(v.condition,'Nuevo');assert.ok(v.images.length>=1);
  assert.equal(v.image_url,v.images[0]);assert.equal(new Set(v.images).size,v.images.length);
  assert.ok(p.images.length>=2);assert.ok(!p.description.includes('\uFFFD'));assert.equal(p.stock,variants.reduce((s,v)=>s+v.stock,0));
  v.images.forEach(u=>{assert.ok(u.includes('/wholesale-earphones-2026-10-01/'));photos.add(u);});verified++;
 }
 // Import never updates unrelated products. Stock may change through genuine purchases.
 for(const old of before.filter(p=>!imported.some(i=>i.model===p.name))){
  const current=products.find(p=>p.id===old.id);assert.ok(current,`Preexisting product ${old.id}`);
  for(const field of ['name','price','image_url','images','description','category','brand'])assert.deepEqual(current[field],old[field],`Unrelated product ${old.id}: ${field}`);
 }
 let checked=0;for(const url of photos){
  let response;for(let attempt=0;attempt<4;attempt++){
   response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
   if(response.status!==429)break;await new Promise(r=>setTimeout(r,3000));
  }
  assert.equal(response.status,200,url);assert.match(response.headers.get('content-type'),/image\/webp/);
  assert.ok(Number(response.headers.get('content-length'))>1000,url);checked++;
  if(checked%50===0)console.log(`Public photos checked ${checked}/${photos.size}`);
  await new Promise(r=>setTimeout(r,120));
 }
 const result={verifiedAt:new Date().toISOString(),models:imported.length,variants:verified,photos:checked,stockPerVariant:10,markupUsd:18,roundToUsd:10,condition:'Nuevo',unrelatedProductsPreserved:true};
 fs.writeFileSync(`${base}/verification.json`,JSON.stringify(result,null,2)+'\n');console.log(result);
}
main().catch(e=>{console.error(e);process.exitCode=1});
