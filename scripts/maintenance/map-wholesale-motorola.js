const fs=require('fs');const base='artifacts/wholesale-2026-10-01';const rows=require('../../'+base+'/phones.json');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const norm=s=>{const m=s.match(/(?:edge\s*\d+\s*(?:pro|fusion|neo)?|[ge]\s*\d+\s*(?:power)?)/i);return m?.[0].toLowerCase().replace(/\s/g,'');};
const translate={'Pantone Shadow':'Verde','Pantone Sparking Grape':'Violeta','Pantone Tapestry':'Azul','Misty Blue':'Azul','Gravity Grey':'Gris','Leaf Green':'Verde','Pantone Dill':'Verde','Pantone Arctic Seal':'Gris','Pantone Nile':'Verde','Pantone Chrysanthemum':'Rojo','Pantone Spellbound':'Azul',Azul:'Azul',Violeta:'Violeta',Verde:'Verde','Azul Marinho':'Azul','Azul Nautico':'Azul',Cinza:'Gris',Grafite:'Gris',Vermelho:'Rojo','Gadget Gray':'Gris','Lily Pad':'Verde','Bronze Green':'Verde'};
const assets=[],unresolved=[];
translate['Pantone Country Air']='Celeste';
translate['Pantone Silhouette']='Azul';
translate['Pantone Impenetrable']='Gris';
translate['Azul Escuro']='Azul';
translate['Verde Escuro']='Verde';
for(const row of rows.filter(r=>r.brand==='Motorola')){if(assets.some(a=>a.model===row.model&&a.color===row.color)||unresolved.some(a=>a.model===row.model&&a.color===row.color))continue;
const ar=JSON.parse(fs.readFileSync(`${base}/pages/${slug(row.model)}.html`));const br=JSON.parse(fs.readFileSync(`${base}/motorola-br-${slug(row.model)}.json`));
const candidates=[...ar.map(p=>({...p,region:'ar'})),...(Array.isArray(br)?br.map(p=>({...p,region:'br'})):[])].filter(p=>!/(?:care|capa|pelicula|fone|kit)/i.test(p.productName)&&norm(p.productName)===norm(row.model));
let selected;
for(const product of candidates)for(const item of product.items){const officialColor=(item.Color?.[0]||item.name).replace(/ - Vegan Leather$/,'').split(' - ').pop();const translated=officialColor.toLowerCase()==='grafite'&&row.model==='Motorola G35 5G'?'Negro':translate[officialColor]||translate[officialColor.charAt(0).toUpperCase()+officialColor.slice(1)];if(translated===row.color){selected={product,item,officialColor};break;}}
if(!selected){unresolved.push({model:row.model,color:row.color,officialColors:candidates.flatMap(p=>p.items.map(i=>i.Color?.[0]||i.name.split(' - ').pop()))});continue;}
const sources=selected.item.images.slice(0,3).map(i=>i.imageUrl);
assets.push({model:row.model,color:row.color,officialColor:selected.officialColor,page:`https://www.motorola.com.${selected.product.region}/${selected.product.linkText}/p`,source:sources[0],sources});
}
fs.writeFileSync(`${base}/motorola-assets.json`,JSON.stringify({assets,unresolved},null,2)+'\n');console.log(assets.length,'assets');console.log(unresolved);
