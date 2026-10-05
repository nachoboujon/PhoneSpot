const fs=require('node:fs'),path=require('node:path');
const {cards}=require('./sync-misiones-supplier');
const base=path.resolve(__dirname,'../../artifacts/misiones-samsung-2026-10-05');
fs.mkdirSync(base,{recursive:true});
const lists=JSON.parse(fs.readFileSync(path.resolve(base,'../misiones-sync-2026-10-05/source-lists.json')));
const source=cards(lists.find(l=>l.filename.startsWith('SAMSUNG')));
const rows=source.map(r=>{
 const label=r.label.replace(/Ne gro/gi,'Negro').replace(/Vio leta/gi,'Violeta').replace(/La vanda/gi,'Lavanda');
 const m=label.match(/^Samsung\s+(.+?)\s*-\s*(\d+)\s*(?:GB\s*)?RAM\s*-\s*(.+?)\s*-\s*(\d+(?:GB|TB))$/i);
 if(!m)throw Error('Unparsed '+label);
 let model=m[1].replace(/ULTRA/i,'Ultra');if(model==='A37')model='A37 5G';
 return {...r,model:'Samsung Galaxy '+model,brand:'Samsung',kind:'phones',color:m[3],ram:m[2]+'GB',capacity:m[4],condition:'Nuevo',batt:'',configuration:'',price:Math.round((r.wholesaleUsd+30)*100)/100};
});
fs.writeFileSync(path.join(base,'rows.json'),JSON.stringify(rows,null,2));
async function main(){
 const models=[...new Set(rows.map(r=>r.model))];
 for(const model of models){
  const file=path.join(base,model.replace(/\W+/g,'-')+'.json');
  if(!fs.existsSync(file)){
   const query=model.replace('Samsung ','');
   const url='https://shop.samsung.com/br/api/catalog_system/pub/products/search?ft='+encodeURIComponent(query)+'&_from=0&_to=49';
   const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(model+' '+response.status);
   fs.writeFileSync(file,await response.text());
  }
  const catalog=JSON.parse(fs.readFileSync(file));
  const normalize=s=>s.toLowerCase().replace(/\s+[45]g$/,'');
  const matches=catalog.filter(p=>p.categories?.some(c=>c.includes('/Smartphone/'))&&/^Celular/i.test(p.productName)&&p['Modelo']?.some(m=>normalize(m)===normalize(model.replace('Samsung ','')))&&(!/4G$/.test(model)||!p.productName.includes('5G'))&&(!/5G$/.test(model)||p.productName.includes('5G')));
  const summary=matches.map(p=>({name:p.productName,model:p['Modelo'],items:p.items.map(i=>({name:i.name,cor:i.Cor,color:i.Color,images:i.images.length}))}));
  console.log(model,JSON.stringify(summary));
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
