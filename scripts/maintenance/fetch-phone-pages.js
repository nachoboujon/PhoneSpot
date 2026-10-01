const fs = require('node:fs');
const urls = ['https://www.mi.com/global/product/poco-x8-pro/specs/','https://www.mi.com/global/product/redmi-note-17-pro/specs/','https://www.infinixmobility.com/smart-20','https://www.itel-life.com/products/phone/a-series/a200','https://www.motorola.com/ve/es/p/phones/moto-g/moto-g67/pmipmjh43mu'];
Promise.all(urls.map(async (url,i)=>{try {
 const r=await fetch(url,{signal:AbortSignal.timeout(25000)}),t=await r.text();
 fs.writeFileSync(`artifacts/wholesale-2026-10-01/page-${i}.html`,t);
 console.log(i,r.status,t.length,[...new Set(t.match(/https[^\s"<>]+\.(?:png|jpg|webp)[^\s"<>]*/g))].slice(0,10));
} catch(e){console.log(i,e.message)}}));
