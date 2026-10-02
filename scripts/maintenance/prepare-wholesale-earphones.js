const fs=require('fs');const base='artifacts/earphones-2026-10-01';fs.mkdirSync(base,{recursive:true});
const sourceFile=fs.existsSync('.tmp/earphones/source.json')?'.tmp/earphones/source.json':`${base}/source-cards.json`;
const source=JSON.parse(fs.readFileSync(sourceFile,'utf8')).sort((a,b)=>a.page-b.page||a.priceTop-b.priceTop||a.column-b.column);
fs.writeFileSync(`${base}/source-cards.json`,JSON.stringify(source,null,2)+'\n');
const excluded=[],rows=[];
for(const card of source){
 const text=card.text.replace(/Ne-\s*gro/gi,'Negro').replace(/Inalam-\s*bricos/gi,'Inalambricos').replace(/\s+/g,' ').trim();
 const name=text.split('USD')[0].trim();const wholesaleUsd=Number(text.match(/USD\s+([\d,]+)/)[1].replace(',','.'));
 let reason='Marca económica o producto genérico, fuera del alcance confirmado';
 if(/AirPods 3ra|Galaxy Buds 3 Pro|Tune 710BT/i.test(name))reason='Excluido por el usuario: precio/originalidad pendientes de confirmar';
 else if(/AirDotsPro|Soundgear Frames/i.test(name))reason='Pendiente por indicación del usuario: modelo exacto no confirmado';
 else if(/^Jbl|^Redmi Buds|^Sony Pulse|Samsung Type-C/i.test(name)){
  let model=name.replace(/^Auricular\s+/i,'').replace(/^Jbl/i,'JBL').replace(/ con microfono/i,'').replace(/ - (?:Blanco|Negro|Rojo|Azul|Celeste|Lavanda|Morado|Rosa)$/i,'').replace(/770nc/i,'770NC');
  let color=name.match(/ - (Blanco|Negro|Rojo|Azul|Celeste|Lavanda|Morado|Rosa)$/i)?.[1];if(!color)throw Error('Missing source color '+name);
  if(model==='JBL Tune Flex 2'&&color==='Celeste')color='Turquesa';
  if(/^Sony Pulse/.test(model))model='Sony PULSE Explore';
  rows.push({model,brand:model.split(' ')[0],color,wholesaleUsd,price:Math.floor((wholesaleUsd+23)/10)*10,stock:10,condition:'Nuevo',capacity:'',ram:'',batt:'',configuration:'',sourcePage:card.page,sourceText:card.text});continue;
 }
 excluded.push({name,wholesaleUsd,sourcePage:card.page,reason});
}
if(rows.length!==41||new Set(rows.map(r=>r.model)).size!==24)throw Error('Source coverage mismatch');
fs.writeFileSync(`${base}/earphones.json`,JSON.stringify(rows,null,2)+'\n');fs.writeFileSync(`${base}/excluded.json`,JSON.stringify(excluded,null,2)+'\n');
console.log(`${new Set(rows.map(r=>r.model)).size} models, ${rows.length} color variants; +18 USD, nearest 10 USD; ${excluded.length} excluded`);
