const fs = require('node:fs');
const path = require('node:path');
const catalog = JSON.parse(fs.readFileSync('artifacts/banner-description-catalog.json', 'utf8').replace(/^\uFEFF/, ''));
const sources = new Map();
function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value.model && value.page && value.sourceType === 'manufacturer' && !sources.has(value.model)) sources.set(value.model, value.page);
    Object.values(value).forEach(walk);
}
for (const dir of ['wholesale-2026-10-01','categories-2026-10-02','earphones-2026-10-01','notebooks-2026-10-01']) {
    for (const file of ['image-manifest.json','photo-sets.json','additional-photo-sets.json']) {
        const location = path.join('artifacts',dir,file);
        if(fs.existsSync(location)) walk(JSON.parse(fs.readFileSync(location,'utf8').replace(/^\uFEFF/,'')));
    }
}
for(const product of catalog) {
    if(product.name.startsWith('iPhone')) sources.set(product.name, `https://www.apple.com/iphone-${product.name.match(/\d+/)[0]}${product.name.includes('Pro') ? '-pro' : ''}/specs/`);
    if(product.brand === 'Tecno') sources.set(product.name, `https://www.tecno-mobile.com/phones/product-detail/product/${product.name.replace(/^Tecno /,'').toLowerCase().replaceAll(' ','-')}/`);
}
const decode = s => s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n));
const clean = s => decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const queue = catalog.map(product => ({id:product.id,model:product.name,url:sources.get(product.name)}));
const results=[];
fs.mkdirSync('artifacts/product-descriptions',{recursive:true});
async function worker(){while(queue.length){
    const item=queue.shift();
    if(!item.url){results.push({...item,status:'missing-source'});continue;}
    try{
        const response=await fetch(item.url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'Mozilla/5.0'}});
        const html=await response.text();
        fs.writeFileSync(`artifacts/product-descriptions/${item.id}.html`,html);
        const metas=[...html.matchAll(/<meta\b[^>]+>/gi)].filter(m=>/(?:name|property)=["'](?:description|og:description)["']/i.test(m[0])).map(m=>clean(m[0].match(/content=["']([\s\S]*?)["']/i)?.[1]||''));
        const features=[...html.matchAll(/<(?:h[1-4]|p)\b[^>]*>([\s\S]*?)<\/(?:h[1-4]|p)>/gi)].map(m=>clean(m[1])).filter(s=>s.length>12&&s.length<500);
        const text=clean(html);
        results.push({...item,status:response.status,meta:[...new Set(metas)],features:features.slice(0,70),text:text.slice(0,28000)});
    }catch(error){results.push({...item,status:error.message});}
}}
Promise.all(Array.from({length:10},worker)).then(()=>{
    results.sort((a,b)=>a.id-b.id);
    fs.writeFileSync('artifacts/product-descriptions/research.json',JSON.stringify(results,null,2));
    console.log(JSON.stringify({total:results.length,found:results.filter(r=>r.status===200).length,missing:results.filter(r=>r.status==='missing-source').map(r=>r.model),failed:results.filter(r=>r.url&&r.status!==200).map(r=>[r.model,r.status])},null,2));
});
