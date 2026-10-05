const fs=require('fs');
const catalog=JSON.parse(fs.readFileSync('artifacts/banner-description-catalog.json','utf8').replace(/^\uFEFF/,''));
async function run(){
const html=await fetch('https://support.apple.com/en-us/108044').then(r=>r.text());
const links=[...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({url:new URL(m[1],'https://support.apple.com').href,label:m[2].replace(/<[^>]+>/g,'').trim()}));
const rows=catalog.filter(p=>p.name.startsWith('iPhone'));
await Promise.all(rows.map(async p=>{
 const link=links.find(l=>l.label.replace(/[.\s]+$/,'').replace(/^See the /,'')===`tech specs for ${p.name}`);
 if(!link)return;
 const t=await fetch(link.url).then(r=>r.text());
 const text=t.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 fs.writeFileSync(`artifacts/product-descriptions/apple-${p.id}.json`,JSON.stringify({id:p.id,model:p.name,url:link.url,text},null,2));
 console.log(p.id,p.name,link.url);
}));}
run().catch(e=>{console.error(e);process.exitCode=1;});
