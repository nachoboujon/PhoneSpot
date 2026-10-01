const fs=require('fs');const base='artifacts/notebooks-2026-10-01';
const pages=JSON.parse(fs.readFileSync(`${base}/photo-pages.json`));
const sets=[];
const html=k=>fs.existsSync(`${base}/page-${k}.html`)?fs.readFileSync(`${base}/page-${k}.html`,'utf8').replace(/\\u002F/g,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&'):'';
const dedup=a=>[...new Set(a)];
function urls(k){let h=html(k);return dedup((h.match(/(?:https?:)?\/\/[^\s"'<>\\]+/g)||[]).map(u=>u.startsWith('//')?'https:'+u:u));}
function add(model,color,k,sources,officialColor=color){sets.push({model,color,page:pages.find(p=>p.key===k).page,sourceType:/mastertech|megaele|atacadoconnect|electronicexpress|laptoparena|primeabgb|hwtcomputers|mauricomputacion/.test(pages.find(p=>p.key===k).page)?'retailer':'manufacturer',officialColor,sources:dedup(sources).slice(0,6)});}
function catalog(k,re){return dedup(urls(k).filter(u=>re.test(u)).map(u=>u.split('?')[0])).filter(u=>/\.(jpg|png|webp)$/.test(u));}
function nuxt(k){let m=html(k).match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);if(!m)return [];let a=JSON.parse(m[1]);return a.filter(x=>x&&typeof x==='object'&&'PreviewImg'in x).map(r=>a[r.PreviewImg]);}
function dell(k,re){return dedup(urls(k).filter(u=>re.test(u)).map(u=>u.split('?')[0])).map(u=>u+'?fmt=png-alpha&wid=1200&hei=1000&fit=fit');}
function hp(k,color){color=color.replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase();return dedup([...html(k).matchAll(/\{"url":"(https[^"}]+)"[^}]*"color":"([^"}]+)"[^}]*\}/g)].filter(m=>m[2]===color&&m[1].includes('/webp/')).map(m=>m[1].split('?')[0])).map(u=>u+'?w=1200&h=1000&color=ffffff00');}
async function acer(model,color,k){const set=html(k).match(/data-pdp-asset="([^"]+)"/)?.[1];if(!set)throw new Error(k+' missing image set');const text=await (await fetch(`https://images.acer.com/is/image/${set}?req=imageset`)).text();fs.writeFileSync(`${base}/imageset-${k}.txt`,text);const assets=dedup(text.split(',').map(s=>s.split(';')[0].trim()).filter(a=>a.startsWith('acer/')));add(model,color,k,assets.filter(a=>!/-0[179](?:$|_)/.test(a)).slice(0,5).map(a=>`https://images.acer.com/is/image/${a}?wid=1200&fmt=png-alpha`));}
async function main(){
add('Acer Aspire 15 A15-51M','Gris','acer-a15',catalog('acer-a15',/a15-51m.*steel-gray/));
add('Acer Aspire 3 A315-24PT','Plata','acer-a315',catalog('acer-a315',/a315-24p.*silver/));
await acer('Acer Aspire Go 15 AG15-42P','Plata','acer-ag42');
await acer('Acer Aspire Go 15 AG15-72P','Plata','acer-ag72');
await acer('Acer Aspire Lite AL15-43P','Plata','acer-lite-cl');
await acer('Acer Nitro V 15 ANV15-41','Negro','acer-nitro41');
add('Acer Nitro V 15 ANV15-52','Negro','acer-nitro52',catalog('acer-nitro52',/anv15-52.*black/));
add('Acer EtBook Yoga CWI557','Gris','acer-yoga',catalog('acer-yoga',/\/57717(?:_sec_\d)?\.jpg/));
add('Audisat X99','Negro','audisat',catalog('audisat',/\/145799\//));
for(const [model,color,k]of [['ASUS Vivobook 15 F1502V','Azul','asus-f1502-fr'],['ASUS Vivobook 15 X1504VA','Plata','asus-x1504'],['ASUS Zenbook 14 UX3405C','Negro','asus-ux3405']])add(model,color,k,nuxt(k));
for(const [model,color,k]of [['ASUS ROG Strix G16 G615J','Gris','asus-g615'],['ASUS ROG Strix G16 G614F','Gris','asus-g614']]){
let h=html(k),start=h.indexOf('Gallery:{gallery:');add(model,color,k,dedup([...h.slice(start,start+16000).matchAll(/imageOrigin:"([^"]+)"/g)].map(m=>m[1])));}
add('ASUS TUF Gaming F16 FX607VU','Gris','asus-fx607',catalog('asus-fx607',/fx607.*\.(png|jpg)/));
add('ASUS Vivobook Go 15 E1504F','Negro','asus-e1504f',catalog('asus-e1504f',/e1504f-mixed_black/));
add('ASUS Vivobook Go 15 E1504GA','Plata','asus-e1504ga-store',catalog('asus-e1504ga-store',/principal_1_capa_6|secundaria_[06].*(png|jpg)/));
add('Dell 15 DC15250','Negro','dell-dc15250',dell('dell-dc15250',/dc15250.*bk-plastic.*gallery-[123468]\.psd/));
add('Dell 15 DC15255','Negro','dell-dc15255-us',dell('dell-dc15255-us',/dc15255.*(?:black|bk).*gallery.*\.psd/));
add('Dell 16 DC16250','Azul','dell-dc16250-blue',dell('dell-dc16250-blue',/dc16250.*(?:blue|ib).*gallery.*\.psd/),'Ice Blue');
add('Dell 15 D15260','Negro','dell-d15260-us',dell('dell-d15260-us',/d15260.*(?:black|bk).*gallery.*\.psd/));
add('Dell Alienware 15 DA15265','Negro','dell-da15265',dell('dell-da15265',/da15265.*black-gallery-[123468]\.psd/));
add('Dell Latitude 7455','Gris','dell-7455',dell('dell-7455',/7455t-gray.*gallery-[23468].*\.(psd|png)/),'Titan Gray');
add('Dell Inspiron 16 5640','Azul','dell-5640-retail',catalog('dell-5640-retail',/5640.*(?:jpg|png)/).filter(u=>!/-\d+x\d+\./.test(u)),'Ice Blue');
add('Dell Latitude 7430','Negro','dell-7430-retail',[...html('dell-7430-retail').matchAll(/src="(\/images\/DELL_Latitude_7430[^" ]+)"/g)].map(m=>'https://www.laptoparena.net'+m[1]));
for(const [model,k,color]of [['HP Laptop 15t-fd000','hp-fd000','jetBlack'],['HP Laptop 15t-fd200','hp-fd200','jetBlack'],['HP Laptop 17t-cn300','hp-cn300-pdp','jetBlack']])add(model,'Negro',k,hp(k,color));
for(const model of ['HP Laptop 15-fd0084wm','HP Laptop 15-fd0133wm','HP Laptop 15-fd0150wn','HP Laptop 15-fd0153wm','HP Laptop 15-fd0173wm','HP Laptop 15-fd0182wn'])add(model,'Plata','hp-fd000',hp('hp-fd000','naturalSilver'),'Natural Silver');
add('HP Laptop 15-fd2050wm','Plata','hp-fd2050-retail',catalog('hp-fd2050-retail',/\/163718\//),'Natural Silver');
add('HP Laptop 14-ep0355cl','Plata','hp-ep0355',catalog('hp-ep0355',/\/1372960\/[^/]+\.webp/));
add('HP Laptop 15-dy5009la','Plata','hp-dy5009-hwt',catalog('hp-dy5009-hwt',/2025\/07\/1[234]\.png/));
for(const [model,k]of [['HP EliteBook 840 G8','hp-840g8-jp'],['HP EliteBook 850 G7','hp-850g7']]){
const imgs=[...html(k).matchAll(/(?:src|href)="([^"]*\/images\/product_img[1-6]\.jpg)"/g)].map(m=>new URL(m[1],pages.find(p=>p.key===k).page).href);add(model,'Plata',k,imgs);}
add('HP OmniBook 3 15-fn0505nr','Plata','hp-omnibook',catalog('hp-omnibook',/product\.c\.xl\/569288/),'Glacier Silver');
const bb=(sku)=>['sd','ld','rd','bd','av1','av2'].map(view=>`https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${sku.slice(0,4)}/${sku}_${view}.jpg`);
add('HP Laptop 14-dq6105dx','Rosa dorado','hp-dq6105',bb('6667483'),'Pale Rose Gold');
add('HP Laptop 15-fc0146dx','Plata','hp-fc',bb('6636439'),'Natural Silver');
add('HP Victus 15-fb3113dx','Gris','hp-victus-fb',bb('6672944'),'Mica Silver');
add('HP Victus 15-fb3093dx','Gris','hp-victus-fb',bb('6623881'),'Mica Silver');
add('HP Victus 15-fa2013dx','Gris','hp-fa2013-mauri',catalog('hp-fa2013-mauri',/26431|fa2013/i).filter(u=>!/-\d+x\d+\./.test(u)),'Mica Silver');
const lraw=JSON.parse(fs.readFileSync(`${base}/lenovo-assets-raw.json`));
for(const [model,color,k,lc]of [['Lenovo IdeaPad Flex 5 15ITL05','Gris','lenovo-flex','Graphite Grey'],['Lenovo IdeaPad Pro 5 16IAH10','Gris','lenovo-pro',null],['Lenovo IdeaPad Slim 3 15AMN8','Azul','lenovo-amn8','Abyss Blue'],['Lenovo IdeaPad Slim 3 15IRU8','Gris','lenovo-iru8','Arctic Grey'],['Lenovo IdeaPad 1 15AMN7','Azul','lenovo-amn7','Abyss Blue'],['Lenovo IdeaPad Slim 3 15IAN8','Gris','lenovo-ian8','Arctic Grey']])add(model,color,k,lraw.find(p=>p.key===k).photos.data.filter(p=>p.color===lc).map(p=>p.src),lc);
for(const [model,color,k]of [['MSI Cyborg 15 A12VF','Negro','msi-a12-gallery'],['MSI Cyborg 15 B2RWFKG','Negro','msi-b2rw-gallery'],['MSI Cyborg A15 AI B2HWEKG','Negro','msi-b2hw-gallery'],['MSI Thin A15 B7VE','Gris','msi-thin-gallery']])add(model,color,k,catalog(k,/\/picture\/product\/product_.*webp/));
add('Samsung Galaxy Book4 NP750XGJ','Plata','samsung-book4-ar',catalog('samsung-book4-ar',/samsungar\.vtexassets.*(?:np750xgj|galaxy-book4)/i));
fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');console.log(sets.map(s=>`${s.model} (${s.color}): ${s.sources.length}`).join('\n'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
