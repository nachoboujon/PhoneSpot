const fs=require('node:fs');
const base='artifacts/wholesale-2026-10-01';
const rows=require('../../'+base+'/phones.json');
const specs={
 'Blackview':['store.blackview.hk',{'BL9000':'bl9000-price','BV4800 Pro':'bv4800-pro-price','Fort 100':'fort-100-price','Fort 200':'fort-200-price','Rock 2':'rock-2-price','Xplore 1':'xplore-1-price','Xplore 1 Pro':'xplore-1-pro-price','Xplore 2':'xplore-2-price','Xplore 2 Projector':'xplore-2-projector-price'}],
 'Doogee':['www.doogee.cc',{'Blade 10 Power':'doogee-blade-10-power','Blade 10 Ultra Energy':'blade10-ultra-energy','Blade 20 X':'doogee-blade20-x-rugged-phone','Fire 5 Pro':'fire-5-pro','Fire 5 Ultra':'fire-5-ultra','Fire 7':'fire-7','V Max 2':'v-max-2','V Max LR':'v-max-lr'}],
 'Hotwav':['www.hotwav.com',{'A17 Pro Max':'hotwav-a17-pro-max','A18 Pro Max':'hotwav-a18-pro-max-smartphone','A26 Ultra':'hotwav-a26-ultra','A36':'hotwav-a36','Hyper 8E':'hotwav-hyper-8e-rugged-phone','Note 13 Pro':'hotwav-note-13-pro-smartphone','T8':'hotwav-t8-rugged-phone','X100SE':'hotwav-x100se-smartphone'}],
 'Oukitel':['oukitel.com',{'C26':'oukitel-c26-smartphone','C72':'oukitel-c72-smartphone'}],
 'Ulefone':['store.ulefone.com',{'Armor 27T Pro':'armor-27t-pro','Armor 26 Ultra':'armor-26-ultra','Armor 28 Ultra':'armor-28-ultra','Armor 29 Pro':'armor-29-pro','Armor 29 Ultra':'armor-29-ultra','Armor Mini 20T Pro':'armor-mini-20t-pro','Armor X16':'armor-x16','RugKing 3 Pro':'rugking-3-pro'}]
};
const translations={Negro:['Black','Wasteland Shadow'],Blanco:['White','Pearl White'],Naranja:['Orange','Sunset Orange'],Verde:['Green'],Oro:['Gold'],Plata:['Silver','Plain','Moonlight Sliver'],Natural:['Plain'],Gris:['Gray','Grey'],Lavanda:['Purple'], 'Marrón Claro':['Sand Dune']};
const assets=[],unresolved=[];
for(const row of rows){
 if(assets.some(a=>a.model===row.model&&a.color===row.color))continue;
 const spec=specs[row.brand];if(!spec)continue;
 const handle=spec[1][row.model.replace(row.brand+' ','').replace('X100 SE','X100SE').replace('Armor 27T Pro+','Armor 27T Pro')];
 if(!handle){unresolved.push({model:row.model,color:row.color,reason:'No exact official model in storefront'});continue;}
 const products=JSON.parse(fs.readFileSync(`${base}/official-catalogs/${spec[0]}.json`)).products;
 const p=products.find(p=>p.handle===handle);if(!p)throw new Error(handle);
 const option=p.options.find(o=>/color|colour/i.test(o.name));
 const aliases={
  'Doogee V Max 2|Marrón Oscuro':['Black'],
  'Hotwav A18 Pro Max|Rojo':['Rose'],
  'Hotwav X100 SE|Rojo':['Rose'],
  'Oukitel C72|Lavanda':['Pink']
 };
 // Supplier swatches were compared visually with the manufacturer's exact model.
 const accepted=aliases[`${row.model}|${row.color}`]||translations[row.color]||[row.color];
 let candidates=p.variants.filter(v=>!option||accepted.some(c=>c.toLowerCase()===v['option'+option.position]?.toLowerCase()));
 // A standard model must never use its thermal, walkie-talkie or satellite edition.
 const version=p.options.find(o=>o.name==='Version');
 if(version)candidates=candidates.filter(v=>v['option'+version.position]===(row.model.endsWith('Projector')?'Projector':row.model==='Blackview Xplore 1 Pro'?'Thermal Imaging':'Standard'));
 const v=candidates.find(v=>v.featured_image?.src);
 let source=v?.featured_image?.src;
 if(!option&&!source)source=p.images[0]?.src;
 if(row.brand==='Ulefone'&&['Ulefone Armor 27T Pro+','Ulefone Armor 28 Ultra'].includes(row.model))source=p.images[1].src;
 if(!source){unresolved.push({model:row.model,color:row.color,reason:'Color mismatch',officialColors:option?.values});continue;}
 assets.push({model:row.model,color:row.color,officialColor:option?v['option'+option.position]:row.color,page:`https://${spec[0]}/products/${handle}`,source});
}
fs.writeFileSync(`${base}/shopify-assets.json`,JSON.stringify({assets,unresolved},null,2)+'\n');
console.log(`${assets.length} exact model/color assets; ${unresolved.length} unresolved`);
console.log(unresolved);
