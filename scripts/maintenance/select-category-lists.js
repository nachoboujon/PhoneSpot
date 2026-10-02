const fs=require('fs');const base='artifacts/categories-2026-10-02';const accepted=[],excluded=[],pending=[];
for(const kind of ['tablets','speakers','watches','consoles']){
 for(const draft of JSON.parse(fs.readFileSync(`${base}/${kind}-draft.json`))){
  const r={...draft,kind,category:kind==='tablets'?'tablets':'accesorios'};let reason='';
  if(r.flags.includes('generic'))reason='NSG o genérico: excluido por el usuario';
  if(kind==='watches'&&/^(MVP-135|Smartwatch A58|SmartWatch S9|T800|X12|X8)/i.test(r.model))reason='Reloj sin fabricante identificado: genérico excluido';
  if(kind==='tablets'&&/^Niños K64/.test(r.model))reason='Tablet sin fabricante identificado: genérica excluida';
  if(kind==='consoles'&&!/Nintendo Switch|Sony PlayStation 5|Xbox ONE X|Game Stick|Pico 4|Meta Quest/i.test(r.model))reason='Accesorio o reproductor remoto; fuera de consolas, Game Stick y realidad virtual';
  if(reason){excluded.push({...r,reason});continue;}
  if(r.flags.includes('authenticity-unconfirmed')){pending.push({...r,reason:'Precio y edición Caja Negro/Blanca no permiten confirmar que sean Xiaomi originales'});continue;}
  if(kind==='consoles'){
   if(/Meta Quest/i.test(r.model)){r.model='Meta Quest 3S';r.brand='Meta';r.configuration=/BATMAN/i.test(r.sourceText)?'Batman':'Estándar';}
   if(/Pico 4/i.test(r.model)){r.model='PICO 4';r.brand='PICO';r.color='Blanco';}
   if(r.model==='Sony PlayStation 5')r.color='Blanco';
   if(r.model==='Xbox ONE X'){r.model='Xbox One X';r.brand='Xbox';}
   r.capacity=r.capacity.replaceAll(' ','');
  }
  if(/^SmartWatch Blulory RTS/i.test(r.model)){r.model='Blulory RTS';r.brand='Blulory';}
  if(r.model==='Xiaomi Mi Compact Blutooth Speaker 2')r.model='Xiaomi Mi Compact Bluetooth Speaker 2';
  if(/^BigStar /.test(r.model))r.model='BigStar BSP-615';
  if(/^G-Tide Power Perfume Collection/.test(r.model)){r.model='G-Tide Power';r.configuration='Perfume Collection · perfume 30 ml';}
  if(r.model==='Apple Watch Ultra 3 Titanio')r.model='Apple Watch Ultra 3';
  if(r.model==='Redmi Pad 2')r.configuration=/9[.,]7/.test(r.sourceText)?'9,7 pulgadas':'11 pulgadas';
  if(['Keen 17 Max','BigStar BSP-615','Luo P15 Pro+','Lenovo XIAOXIN'].includes(r.model)){excluded.push({...r,reason:'Excluido expresamente por el usuario: referencia sin identificar'});continue;}
  if(r.model==='Redmi Watch 6 Active'&&r.color==='Rosa'){r.originalColor=r.color;r.color='Naranja';r.colorDecision='Usuario autorizó usar los acabados encontrados del fabricante';}
  if(r.model==='Xiaomi Smart Band 11 Active'&&r.color==='Blanco'){r.originalColor=r.color;r.color='Gris';r.colorDecision='Usuario autorizó usar los acabados encontrados del fabricante';}
  accepted.push(r);
 }
}
fs.writeFileSync(`${base}/selected.json`,JSON.stringify(accepted,null,2)+'\n');
fs.writeFileSync(`${base}/excluded.json`,JSON.stringify(excluded,null,2)+'\n');
fs.writeFileSync(`${base}/pending-identification.json`,JSON.stringify(pending,null,2)+'\n');
console.log({selected:accepted.length,models:new Set(accepted.map(r=>r.model)).size,excluded:excluded.length,pendingIdentification:pending.length});
