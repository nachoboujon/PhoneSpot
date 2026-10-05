const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../../artifacts/misiones-samsung-2026-10-05');
const pages=[
 ['a07s','https://www.samsung.com/latin/smartphones/galaxy-a/galaxy-a07s-black-128gb-sm-a077mzkggto/'],
 ['a06','https://www.samsung.com/in/smartphones/galaxy-a/galaxy-a06-gold-128gb-sm-a065fzdhins/buy/'],
 ['a56','https://www.samsung.com/tr/smartphones/galaxy-a/galaxy-a56-5g-awesome-olive-128gb-sm-a566bzgatur/'],
 ['s24','https://www.samsung.com/uk/smartphones/galaxy-s24-ultra/specs/']
];
async function main(){
 const results=await Promise.allSettled(pages.map(async([name,url])=>{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(name+' '+r.status);const html=await r.text();fs.writeFileSync(path.join(base,name+'-official.html'),html);
  const images=[];for(const tag of html.match(/<img\b[^>]+>/gi)||[]){const alt=tag.match(/\balt="([^"]*)"/i)?.[1]||'';const srcs=[...tag.matchAll(/(?:src|data-desktop-src|data-src)="([^"]+)"/g)].map(m=>m[1]);if(/galaxy.*(?:a07s|a06|a56|s24 ultra)|(?:a07s|a06|a56|s24 ultra).*galaxy/i.test(alt))for(const src of srcs)if(/images\.samsung\.com/.test(src))images.push({alt,url:src.replace(/&amp;/g,'&')});}
  fs.writeFileSync(path.join(base,name+'-official-images.json'),JSON.stringify(images,null,2));return {name,count:images.length,images:images.slice(0,12)};
 }));for(const r of results)console.log(JSON.stringify(r.status==='fulfilled'?r.value:{error:r.reason.message}));
}
main();
