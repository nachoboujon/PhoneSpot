const fs=require('fs'),assert=require('node:assert/strict'),{createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});const base='artifacts/categories-2026-10-02';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
const key=v=>[v.color,v.capacity,v.ram,v.batt||'',v.condition,v.configuration||''].join('|');
async function main(){
 const rows=JSON.parse(fs.readFileSync(`${base}/selected.json`)),pending=JSON.parse(fs.readFileSync(`${base}/pending-import.json`));
 const ready=rows.filter(r=>!pending.some(p=>p.kind===r.kind&&p.model===r.model&&key(p)===key(r)));
 const before=JSON.parse(fs.readFileSync(`${base}/before-import.json`));
 const products=[];for(let offset=0;;offset+=500){const {data,error}=await db.from('products').select('*').order('id').range(offset,offset+499);if(error)throw error;products.push(...data);if(data.length<500)break;}
 const urls=new Set();let checked=0;
 for(const row of ready){const matches=products.filter(p=>p.name===row.model);assert.equal(matches.length,1,row.model+' unique product');const p=matches[0];const v=p.variants.find(v=>key(v)===key(row));assert.ok(v,row.model+' variant');assert.equal(Number(v.price),row.price,row.model+' price');assert.equal(Number(v.stock),10,row.model+' initial stock');assert.ok(v.images?.length,row.model+' gallery');v.images.forEach(u=>urls.add(u));assert.equal(p.stock,p.variants.reduce((n,v)=>n+Number(v.stock),0));checked++;}
 for(const old of before){const current=products.find(p=>p.id===old.id);assert.ok(current,'Existing product '+old.id);assert.equal(current.price,old.price,'Existing price '+old.id);for(const v of old.variants||[]){const unchanged=current.variants.find(x=>key(x)===key(v));assert.deepEqual(unchanged,v,'Existing variant '+old.id);}}
 // Validate every uploaded object in one inventory read instead of issuing hundreds
 // of public HEAD requests, which triggered the provider's 429 rate limit.
 const {data:stored,error:storageError}=await db.storage.from('uploads').list('wholesale-categories-2026-10-02',{limit:1000});if(storageError)throw storageError;
 const byName=new Map(stored.map(a=>[a.name,a]));
 for(const u of urls){const name=decodeURIComponent(new URL(u).pathname.split('/').pop()),object=byName.get(name);assert.ok(object,name+' exists');assert.equal(object.metadata.mimetype,'image/webp');assert.ok(object.metadata.size>0,name+' nonempty');assert.equal(object.metadata.size,fs.statSync(`${base}/images/${name}`).size,name+' complete upload');}
 const models=[...new Set(ready.map(r=>r.model))],archivedAfterImport=products.filter(p=>models.includes(p.name)&&p.archived_at).map(p=>({id:p.id,model:p.name,archivedAt:p.archived_at,variants:p.variants.length}));
 const summary={verifiedAt:new Date().toISOString(),models:models.length,variants:checked,images:urls.size,imageCheck:'All referenced storage objects verified by MIME type and byte size; real browser image loads checked separately',existingProductsPreserved:before.length,pendingPhotos:pending.length,pendingIdentification:3,archivedAfterImport,visibleModels:models.length-archivedAfterImport.length,visibleVariants:checked-archivedAfterImport.reduce((n,p)=>n+p.variants,0)};fs.writeFileSync(`${base}/verification.json`,JSON.stringify(summary,null,2)+'\n');console.log(summary);
}
main().catch(e=>{console.error(e);process.exitCode=1});
