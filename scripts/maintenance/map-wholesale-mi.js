const fs=require('fs');const base='artifacts/wholesale-2026-10-01';const rows=require('../../'+base+'/phones.json');
const slug=s=>s.toLowerCase().replace(/\+/g,' plus ').replace(/[^a-z0-9]+/g,'-');
const aliases={Negro:['negro','black','midnight black'],Blanco:['blanco','white','blanco fotoactivo'],Oro:['dorado','gold'],Azul:['azul','blue','denim blue','ice blue','glacier blue'],Verde:['verde','green','mint green','forest green'],Morado:['morado','purple'],Lavanda:['lavanda','purple','violeta'],Gris:['gris','gray','grey','titanio','titan gray'],Plata:['plata','silver'],Amarillo:['amarillo','yellow'],Naranja:['naranja','orange'],Violeta:['violeta','violet','purple'], 'Marrón Claro':['mocha brown','marron moca'], 'Marrón Oscuro':['mocha brown','marron moca']};
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
aliases.Lavanda.push('morado');
aliases['Café Moca']=['cafe moca','mocha brown'];
const assets=[],unresolved=[];
for(const row of rows.filter(r=>['Xiaomi','Redmi','POCO'].includes(r.brand))){if(assets.some(a=>a.model===row.model&&a.color===row.color)||unresolved.some(a=>a.model===row.model&&a.color===row.color))continue;
const file=`${base}/mi-catalogs/${slug(row.model)}.json`;if(!fs.existsSync(file)){unresolved.push({model:row.model,color:row.color,reason:'No catalog'});continue;}
const allFiles=[file,...fs.readdirSync(`${base}/mi-catalogs`).filter(f=>f.startsWith(slug(row.model)+'-')).map(f=>`${base}/mi-catalogs/${f}`)];
let selected;
for(const candidateFile of allFiles){const candidate=JSON.parse(fs.readFileSync(candidateFile));const detail=candidate.data?.item_detail;if(!detail?.specs_list?.specs_list)continue;
const optionIndex=detail.specs_list.specs_list.findIndex(s=>s.key==='color');
if(detail.specs_list.specs_list[optionIndex]?.list.some(c=>(aliases[row.color]||[row.color]).some(a=>clean(c.name)===a||clean(c.name).includes(a)))){selected=candidate;break;}}
const catalog=selected||JSON.parse(fs.readFileSync(file));const j=catalog.data.item_detail,items=j.spu_list.flatMap(p=>p.item_list||[]);const option=j.specs_list.specs_list.findIndex(s=>s.key==='color');
const colorOptions=j.specs_list.specs_list[option]?.list||[];
const match=colorOptions.find(c=>(aliases[row.color]||[row.color]).some(a=>clean(c.name)===a||clean(c.name).includes(a)));
const sku=match&&j.specs_list.sku_list.find(s=>s.specs_item[option]===match.name);const item=items.find(i=>i.item_id===sku?.item_id);const photos=item?.resource_list?.filter(r=>r.type==='image').map(r=>r.src.startsWith('//')?'https:'+r.src:r.src).slice(0,3);
if(!photos?.length){unresolved.push({model:row.model,color:row.color,officialColors:colorOptions.map(c=>c.name)});continue;}
assets.push({model:row.model,color:row.color,officialColor:match.name,rgb:match.rgb,page:`https://www.mi.com/${catalog.region}/product/${catalog.tag}/buy/`,source:photos[0],sources:photos});
}
fs.writeFileSync(`${base}/mi-assets.json`,JSON.stringify({assets,unresolved},null,2)+'\n');console.log(assets.length,'assets',unresolved.length,'unresolved');console.log(unresolved);
