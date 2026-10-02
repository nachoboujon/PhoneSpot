const fs=require('fs'),assert=require('node:assert/strict'),{createClient}=require('@supabase/supabase-js');require('dotenv').config({quiet:true});
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
async function main(){
 const {data:p,error}=await db.from('products').select('*').eq('name','Redmi Pad 2').is('archived_at',null).single();if(error)throw error;
 const before=JSON.parse(fs.readFileSync('artifacts/categories-2026-10-02/before-import.json'));assert.ok(!before.some(x=>x.id===p.id),'Only repair a product created in this import');
 const variants=p.variants.map(v=>{const configuration=v.configuration||'11 pulgadas';return {...v,configuration,...(configuration==='11 pulgadas'?{images:v.images.slice(0,v.color==='Gris'?1:2)}:{})};});
 if(JSON.stringify(variants)===JSON.stringify(p.variants))return;
 const images=[...new Set(variants.flatMap(v=>v.images))];
 const {data,error:saveError}=await db.from('products').update({variants,images}).eq('id',p.id).eq('variants',JSON.stringify(p.variants)).select('id');if(saveError)throw saveError;assert.equal(data.length,1);console.log('Redmi Pad 2: standard size identified; price and stock preserved');
}
main().catch(e=>{console.error(e);process.exitCode=1});
