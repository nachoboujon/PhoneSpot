const fs=require('fs'),b='artifacts/notebooks-2026-10-01';
for(const key of ['asus-e1504ga-store','asus-e1504f']){
const html=fs.readFileSync(`${b}/page-${key}.html`,'utf8');
for(const m of html.matchAll(/<script[^>]*type="text\/x-magento-init"[^>]*>([\s\S]*?)<\/script>/g)){
try {let obj=JSON.parse(m[1]);for(const v of Object.values(obj))for(const x of Object.values(v)){const c=x.jsonConfig;if(c?.images){fs.writeFileSync(`${b}/gallery-${key}.json`,JSON.stringify(c,null,2));const id=Object.keys(c.images)[0];console.log(key,id,c.images[id].map(a=>a.full?.split('?')[0]));}}}catch(e){console.log('Parse:',e.message);}}
}
