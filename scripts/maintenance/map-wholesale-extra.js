const fs=require('fs');const base='artifacts/wholesale-2026-10-01';const assets=[];
const add=(model,color,source,page,officialColor)=>assets.push({model,color,source,page,officialColor});
for(const [color,index]of [['Negro',1],['Naranja',2]])add('Blackview BL7000',color,`https://d2kbvjszk9d5ln.cloudfront.net/yshop/bl7000/sect88-${index}.webp`,'https://www.blackview.hk/products/item/bl7000');
for(const [color,file,name]of [['Naranja','orange.png','Comet Orange'],['Gris','Meteor_Titanium.png','Meteor Titanium'],['Verde','green.png','Nebula Green']])add('Itel A200',color,`https://www.itel-life.com/fileadmin/assets/img/plp/A200/${file}`,'https://www.itel-life.com/products/phone/a-series/a200/spec',name);
add('Realme Note 70','Negro','https://image01.realme.net/general/20250820/175568284647508dfa8f5415e48e5be737aac4314d17b.png','https://www.realme.com/global/realme-note-70/specs','Obsidian Black');
const products=JSON.parse(fs.readFileSync(`${base}/infinix-india.json`)).products;
for(const [model,handle,color,name]of [
['Infinix Smart 20','smart-20','Naranja','Sunlike Orange'],['Infinix Smart 20','smart-20','Negro','Shadow Black'],['Infinix Smart 20','smart-20','Gris','Polaris Titanium'],['Infinix Smart 20','smart-20','Azul','Cloudline Blue'],
['Infinix Smart 10','smart-10','Negro','Sleek Black'],['Infinix Smart 10','smart-10','Oro','Twilight Gold'],['Infinix Smart 10','smart-10','Plata','Titanuim Silver'],['Infinix GT 30 Pro','gt-30-pro-5g','Negro','Dark Flare']]){const p=products.find(p=>p.handle===handle);const v=p.variants.find(v=>v.option1===name);add(model,color,v.featured_image.src,`https://infinixmobiles.in/products/${handle}`,name);}
const oukitel=JSON.parse(fs.readFileSync(`${base}/probe-3.html`)).products.find(p=>p.title.includes('C17 Plus'));
for(const [color,name]of [['Azul','Blue'],['Gris','Silver']])add('Oukitel C17 Plus',color,oukitel.variants.find(v=>v.option1===name).featured_image.src,`https://www.oukitel.co.za/products/${oukitel.handle}`,name);
add('Oukitel C17 Plus','Naranja',oukitel.images[0].src,`https://www.oukitel.co.za/products/${oukitel.handle}`,'Orange');
for(const [model,file,color,match]of [['Nokia 106','nokia106.html','Gris',/nokia-106-black-(?:front_back|front|back)-int\.png/],['Nokia 110 4G','nokia110-new.html','Negro',/nokia-110_4G-midnight_black-(?:front_back|front|back)-int\.png/]]){
 const text=fs.readFileSync(`${base}/${file}`,'utf8');const sources=[...new Set((text.match(/https:\/\/images.ctfassets.net[^\s"<>]+/g)||[]).map(u=>u.split('?')[0]).filter(u=>match.test(u)))].sort((a,b)=>Number(!a.includes('front_back'))-Number(!b.includes('front_back')));
 assets.push({model,color,officialColor:model==='Nokia 106'?'Dark grey':'Midnight Black',source:sources[0],sources,page:model==='Nokia 106'?'https://www.hmd.com/en_int/nokia-106-2018':'https://www.hmd.com/en_int/nokia-110-4g'});
}
const prior=fs.existsSync(`${base}/extra-assets.json`)?JSON.parse(fs.readFileSync(`${base}/extra-assets.json`)).assets:[];
assets.push(...prior.filter(a=>a.model==='KingKong 8'));
for(const [model,file,color,matchColor,domain]of [['Motorola G06 Power','in-g06.json','Khaki','PANTONE Laurel Oak','https://www.motorola.in'],['Motorola G86 Power 5G','motorola-pe.json','Rojo','Rojo','https://www.motorola.com.pe']]){
 const products=JSON.parse(fs.readFileSync(`${base}/${file}`));const product=products.find(p=>p.productName.toLowerCase().replace(/^moto/,'motorola')===model.toLowerCase());
 const item=product.items.find(i=>i.Color?.[0]===matchColor||i.name===matchColor);const sources=item.images.slice(0,3).map(i=>i.imageUrl);
 assets.push({model,color,officialColor:matchColor,source:sources[0],sources,page:`${domain}/${product.linkText}/p`});
}
fs.writeFileSync(`${base}/extra-assets.json`,JSON.stringify({assets,unresolved:[]},null,2)+'\n');console.log(assets.length,'extra colors');
