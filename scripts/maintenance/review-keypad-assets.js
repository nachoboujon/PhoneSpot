const fs=require('fs');const base='artifacts/wholesale-2026-10-01';
for(const name of ['ur06-product','cat68-orange-product']){
const text=fs.readFileSync(`${base}/${name}.html`,'utf8');
const urls=[...new Set(text.match(/(?:https?:)?\/\/[^\s"<>]+\.(?:jpg|png|webp)(?:\?[^\s"<>]*)?/g)||[])];
fs.writeFileSync(`${base}/${name}-image-urls.json`,JSON.stringify(urls,null,2));
console.log(name,urls.slice(0,20));
}
