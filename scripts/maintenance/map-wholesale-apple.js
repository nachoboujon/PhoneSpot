const fs=require('fs');const base='artifacts/wholesale-2026-10-01';const rows=require('../../'+base+'/phones.json');const manifest=require('../../public/uploads/official-products/manifest.json');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');const assets=[];
const known={
 'iPhone 14 Pro Max|Negro':'iphone-14-pro-max-spaceblack-select',
 'iPhone 16|Verde':'iphone-16-teal-select-202409',
 'iPhone 17|Verde':'iphone-17-finish-select-sage-202509',
 'iPhone 17|Azul':'iphone-17-finish-select-mistblue-202509',
 'iPhone 17 Pro|Blanco':'iphone-17-pro-finish-select-silver-202509',
 'iPhone 17 Pro Max|Azul':'iphone-17-pro-max-finish-select-deepblue-202509'
};
for(const row of rows.filter(r=>r.brand==='Apple')){if(assets.some(a=>a.model===row.model&&a.color===row.color))continue;
const existing=manifest.images.find(i=>i.model===row.model&&i.color===row.color);let source=existing?.source;
if(!source){let asset=known[`${row.model}|${row.color}`];if(row.model.startsWith('iPhone 18'))asset=`${slug(row.model)}-finish-select-${{Plata:'silver',Glaciar:'glacier',Negro:'black'}[row.color]}-202609`;if(!asset)throw new Error(row.model+' '+row.color);source=`https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/${asset}?wid=1600&hei=1600&fmt=jpeg&qlt=88`;}
assets.push({model:row.model,color:row.color,source,page:`https://www.apple.com/${slug(row.model)}/`});}
fs.writeFileSync(`${base}/apple-assets.json`,JSON.stringify({assets,unresolved:[]},null,2)+'\n');console.log(assets.length+' Apple colors');
