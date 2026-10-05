const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../../artifacts/misiones-samsung-2026-10-05');
const rows=JSON.parse(fs.readFileSync(path.join(base,'rows.json')));
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function matchesModel(p,row){
 const expected=norm(row.model.replace('Samsung ',''));
 const model=p.Modelo?.some(m=>norm(m)===expected||norm(m+' 5G')===expected||norm(m+' 4G')===expected);
 return model&&/^Celular/i.test(p.productName)&&!/\+\s*(?:Galaxy|Buds)|combo/i.test(p.productName)&&p.categories?.some(c=>c.includes('/Smartphone/'))&&(!/4G$/.test(row.model)||!p.productName.includes('5G'))&&(!/5G$/.test(row.model)||p.productName.includes('5G'));
}
function colors(row){
 const exact={'Negro':['Preto','JetBlack'],'Gris':['Cinza'],'Verde':['Verde'],'Rosa':['Rosa'],'Lavanda':['Lavanda'],'Violeta':['Violeta'],'Blanco':['Branco'],'Verde Pistacho':['Verde Pistache'],'Plata':['Prata','Titânio Prata'],'Titanio Gris':['Titânio Cinza'],'Titanio Negro':['Titânio Preto'],'Titanio Azul':['Titânio Azul'],'Titanio Blanco':['Titânio Prata']};
 if(row.color==='Azul Claro'&&/A17|S26 Ultra/.test(row.model))return ['Azul'];
 if(row.color==='Azul Claro'&&/S25$/.test(row.model))return ['Azul'];
 if(row.color==='Azul'&&/S26 FE/.test(row.model))return ['Azul Cobalto'];
 if(row.color==='Azul'&&/A17|A27/.test(row.model))return ['Azul'];
 // Supplier plain blue is ambiguous when both light blue and navy are available.
 if(row.color==='Azul')return [];
 return exact[row.color]||[];
}
async function main(){
 const ready=[],pending=[];
 for(const row of rows){
  const catalog=JSON.parse(fs.readFileSync(path.join(base,row.model.replace(/\W+/g,'-')+'.json')));
  const ps=catalog.filter(p=>matchesModel(p,row));
  const possible=ps.flatMap(p=>p.items.filter(i=>colors(row).some(c=>norm(c)===norm(i.Cor?.[0]||i.name))).map(i=>({p,i})));
  // Images may be shared across storage sizes, but never across model/network/color.
  const groups=new Map(possible.map(x=>[norm(x.i.Cor?.[0]||x.i.name),x]));
  if(groups.size!==1){pending.push({...row,reason:ps.length?'Color missing or ambiguous in official catalog':'Exact model/network absent from official catalog'});continue;}
  const {p,i}=[...groups.values()][0];
  const images=i.images.slice(0,3);if(!images.length)throw Error('Missing images');
  const files=[];
  for(const image of images){
   const file='samsung-'+require('crypto').createHash('sha256').update(image.imageUrl).digest('hex').slice(0,20)+'.jpg';
   if(!fs.existsSync(path.join(base,file))){const response=await fetch(image.imageUrl,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Image '+response.status);fs.writeFileSync(path.join(base,file),Buffer.from(await response.arrayBuffer()));}
   files.push({file,url:image.imageUrl,label:image.imageText});
  }
  ready.push({...row,officialColor:i.Cor?.[0]||i.name,colorHex:i.Hexadecimal?.[0],sourcePage:p.link,photos:files});
 }
 fs.writeFileSync(path.join(base,'ready.json'),JSON.stringify(ready,null,2));fs.writeFileSync(path.join(base,'pending.json'),JSON.stringify(pending,null,2));
 console.log(JSON.stringify({ready:ready.length,models:new Set(ready.map(r=>r.model)).size,pending:pending.length,photos:new Set(ready.flatMap(r=>r.photos.map(p=>p.file))).size}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
