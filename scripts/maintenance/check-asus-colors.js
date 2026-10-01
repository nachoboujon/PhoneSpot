const fs=require('fs');const b='artifacts/notebooks-2026-10-01';
async function main(){for(const [key,indices] of [['asus-f1502-fr',[6,7,8,9]],['asus-x1504',[12,24]]]){
const h=fs.readFileSync(`${b}/page-${key}.html`,'utf8'),a=JSON.parse(h.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]);
const records=a.filter(x=>x&&typeof x==='object'&&'PreviewImg'in x);
for(const i of indices){const u=a[records[i].PreviewImg];let r=await fetch(u);fs.writeFileSync(`${b}/check-${key}-${i}.png`,Buffer.from(await r.arrayBuffer()));}}
}
main();
