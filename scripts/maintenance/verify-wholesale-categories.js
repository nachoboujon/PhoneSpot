const fs=require('fs'),assert=require('node:assert/strict'),{createClient}=require('@supabase/supabase-js');
require('dotenv').config({quiet:true});const base='artifacts/categories-2026-10-02';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
const key=v=>[v.color,v.capacity,v.ram,v.batt||'',v.condition,v.configuration||''].join('|');
async function main(){
 const rows=JSON.parse(fs.readFileSync(`${base}/selected.json`)),pending=JSON.parse(fs.readFileSync(`${base}/pending-import.json`));
 const ready=rows.filter(r=>!pending.some(p=>p.kind===r.kind&&p.model===r.model&&key(p)===key(r)));
 const before=JSON.parse(fs.readFileSync(`${base}/before-import.json`));
 const products=[];for(let offset=0;;offset+=500){const {data,error}=await db.from('products').select('*').is('archived_at',null).order('id').range(offset,offset+499);if(error)throw error;products.push(...data);if(data.length<500)break;}
 const urls=new Set();let checked=0;
 for(const row of ready){const matches=products.filter(p=>p.name===row.model);assert.equal(matches.length,1,row.model+' unique product');const p=matches[0];const v=p.variants.find(v=>key(v)===key(row));assert.ok(v,row.model+' variant');assert.equal(Number(v.price),row.price,row.model+' price');assert.equal(Number(v.stock),10,row.model+' initial stock');assert.ok(v.images?.length,row.model+' gallery');v.images.forEach(u=>urls.add(u));assert.equal(p.stock,p.variants.reduce((n,v)=>n+Number(v.stock),0));checked++;}
 for(const old of before){const current=products.find(p=>p.id===old.id);assert.ok(current,'Existing product '+old.id);assert.equal(current.price,old.price,'Existing price '+old.id);for(const v of old.variants||[]){const unchanged=current.variants.find(x=>key(x)===key(v));assert.deepEqual(unchanged,v,'Existing variant '+old.id);}}
 const queue=[...urls];let images=0;await Promise.all(Array.from({length:3},async()=>{while(queue.length){const u=queue.shift();let valid=false,status;for(let attempt=0;attempt<3&&!valid;attempt++){const r=await fetch(u,{method:'HEAD',signal:AbortSignal.timeout(20000)});status=r.status;valid=r.ok&&r.headers.get('content-type')?.includes('image/');if(!valid)await new Promise(resolve=>setTimeout(resolve,2000));}assert.ok(valid,`${status}: ${u}`);images++;}}));
 const summary={verifiedAt:new Date().toISOString(),models:new Set(ready.map(r=>r.model)).size,variants:checked,images,existingProductsPreserved:before.length,pendingPhotos:pending.length,pendingIdentification:3};fs.writeFileSync(`${base}/verification.json`,JSON.stringify(summary,null,2)+'\n');console.log(summary);
}
main().catch(e=>{console.error(e);process.exitCode=1});
