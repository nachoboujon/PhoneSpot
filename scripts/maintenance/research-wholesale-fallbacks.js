// Cache source pages, never publish their images without visual model/color review.
const fs=require('fs');const base='artifacts/wholesale-2026-10-01';
const pages=[
['ur06-victoria','https://www.victoriastore.com.py/brand/ur'],
['cat68-orange','https://luchocell.com/tienda/'],
['c26-py','https://oukitel.com.py/products/oukitel-c26.js'],
['doogee-rust3','https://lojafonefacil.com.br/product/cel-doogee-v-max-lr-6-78-ds-5g-16-512gb-battle-rust-45w/'],
['nokia5310black-product','https://pyonline.com.py/product/celular-nokia-5310-4g-ta-1212-dual-im-pantalla-2-4-negro-35189/'],
['mobileworld','https://www.mobileworldfestival.com/'],
['ur05','https://kam.ba/artikal/mobitel-na-tipke-ur-um-05/'],
['ur06','https://loja.reptecstore.com.br/celular'],
['note17-orange','https://hogarymoda.com/products/celular-xiaomi-redmi-note-17-pro-5g-256gb-6gb-ram-negro-copy.js'],
['c26-white','https://mobile.comparaguay.com.py/celular-oukitel-c26-dual-chip-128gb-4g_67537/'],
['motorola-g56','https://www.maxmovil.com/shop/motg565g8256bl-motorola-moto-g56-5g-8gb-256gb-azul-dazzling-blue-dual-sim-64283'],
['doogee-rust','https://www.visaovip.com/prod/smartphones/cel-doogee-v-max-lr-16gb-512gb-buttle-rust-global-dual-sim-5g-6-78/58404/'],
['oukitel-c65-py','https://oukitel.com.py/products/oukitel-c65-164-12gb-128gb-1tb-exp.js'],
['poco-orange','https://www.maxmovil.com/shop/xiapocx8promax12512gborg-xiaomi-poco-x8-pro-max-5g-12gb-512gb-naranja-orange-dual-sim-96741?category=334'],
['gt-grey','https://miport.ru/smartphones/smartphone-infinix/infinix-gt-30-pro-12-512gb-grey/'],
['nokia5310white','https://pyonline.com.py/product/celular-nokia-5310-4g-ta-1212-dual-im-pantalla-2-4-blanco-35170/'],
['motorola-g57','https://www.linneelektronik.com/butik/motorola-moto-g57-5g-8gb-ram-256gb-corsair-green'],
['redmi15r-purple','https://product.suning.com/0070066592/12449544435.html']
];
async function main(){await Promise.allSettled(pages.map(async([name,url])=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});const text=await r.text();fs.writeFileSync(`${base}/${name}.html`,text);console.log(name,r.status,text.length);console.log((text.match(/<meta[^>]+og:image[^>]+>/g)||[]).slice(0,2));}catch(e){console.log(name,e.message)}}));
for(const name of ['mega-bv','cat28','cat68','hotwav-gray',...pages.map(p=>p[0])]){if(!fs.existsSync(`${base}/${name}.html`))continue;const text=fs.readFileSync(`${base}/${name}.html`,'utf8');const urls=[...new Set(text.match(/(?:https?:)?\/\/[^\s"<>]+\.(?:png|jpg|jpeg|webp)(?:\?[^\s"<>]*)?/g)||[])];fs.writeFileSync(`${base}/${name}-image-urls.json`,JSON.stringify(urls,null,2));}
const text=fs.readFileSync(`${base}/redmi15r-purple.html`,'utf8'),colors=[];
for(const match of text.matchAll(/<li colorid=[^>]*title="([^"]+)"[^>]*>(.*?)<\/li>/gs)){
const url=match[2].match(/href="(\/\/product.suning.com[^\"]+)"/)?.[1];if(!url)continue;
const page='https:'+url;const html=await(await fetch(page)).text();const source=html.match(/<meta property="og:image" content="([^"]+)/)?.[1]?.split('_800w')[0];
colors.push({name:match[1],page,source});console.log('Redmi 15R',match[1],source);}
fs.writeFileSync(`${base}/redmi15r-colors.json`,JSON.stringify(colors,null,2));}
main();
