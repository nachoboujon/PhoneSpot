const fs = require('node:fs');
const path = require('node:path');
const {createClient} = require('@supabase/supabase-js');
const {catalogCategory} = require('../../public/store-business');
require('dotenv').config({quiet:true});

async function main() {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
    const products = [];
    for (let offset=0;;offset+=500) {
        const {data,error} = await db.from('products').select('id,name,category,archived_at').order('id').range(offset,offset+499);
        if(error) throw error;
        products.push(...data);
        if(data.length<500) break;
    }
    const affected = products.filter(p => !p.archived_at && p.category==='accesorios' && /band|galaxy\s+fit/i.test(p.name) && catalogCategory(p)==='relojes');
    console.log(JSON.stringify({affected},null,2));
    if(!process.argv.includes('--apply') || !affected.length) return;
    const output = path.resolve(__dirname,'../../artifacts/smartband-categories-2026-10-16');
    fs.mkdirSync(output,{recursive:true});
    const backup = path.join(output,'before.json');
    if(!fs.existsSync(backup)) fs.writeFileSync(backup,JSON.stringify(affected,null,2)+'\n');
    const applied=[];
    for(const product of affected) {
        const {data,error} = await db.from('products').update({category:'relojes'}).eq('id',product.id).eq('name',product.name).eq('category',product.category).is('archived_at',null).select('id,name,category');
        if(error) throw error;
        if(data.length!==1) throw Error('Concurrent category change: '+product.name);
        applied.push(data[0]);
        fs.writeFileSync(path.join(output,'applied.json'),JSON.stringify(applied,null,2)+'\n');
    }
    const {data,error} = await db.from('products').select('id,name,category').in('id',affected.map(p=>p.id));
    if(error) throw error;
    if(data.length!==affected.length || data.some(p=>p.category!=='relojes')) throw Error('Category verification failed');
    fs.writeFileSync(path.join(output,'verified.json'),JSON.stringify(data,null,2)+'\n');
    console.log('Verified '+data.length+' smartbands in Relojes');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
