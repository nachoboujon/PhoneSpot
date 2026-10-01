const fs=require('fs'),b='artifacts/notebooks-2026-10-01';
for(let k of process.argv.slice(2)){
 let h=fs.readFileSync(`${b}/page-${k}.html`,'utf8');
 if(k.startsWith('hp-')&&k!=='hp-850g7'){
  console.log(k,[...h.matchAll(/\{"url":"(https[^"}]+)"[^}]*"color":"([^"}]+)"[^}]*\}/g)].map(m=>({url:m[1],color:m[2]})).filter(m=>m.url.includes('widen')).slice(0,40));
 }else if(k.startsWith('asus')&&!k.includes('store')&&!k.includes('g61')){
  let m=h.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if(!m){console.log(k,'no Nuxt gallery');continue;}
  let a=JSON.parse(m[1]);
  console.log(k,a.filter(x=>x&&typeof x==='object'&&'PreviewImg'in x).map(r=>({img:a[r.PreviewImg],alt:a[r.ImageAlt]})));
 }else if(k.startsWith('msi'))console.log(k,[...new Set(h.match(/https[^\s"'<>]+/g)||[])].filter(s=>/storage.*(?:png|jpg)/.test(s)).slice(-25));
 else console.log(k,[...new Set([...h.matchAll(/(?:src|href)="([^"]+)/g)].map(m=>m[1]))].filter(s=>/(png|jpg)/.test(s)).slice(-40));
}
