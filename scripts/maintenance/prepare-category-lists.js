const fs=require('fs');
const base='artifacts/categories-2026-10-02';
const colors=['Verde agua','Titanio Negro','Camuflajeado','Lavanda','Naranja','Amarillo','Morado','Celeste','Blanco','Negro','Plata','Gris','Azul','Rosa','Rojo','Verde','Oro','Khaki'];
const report={};
for(const kind of ['tablets','speakers','watches','consoles']){
 const source=JSON.parse(fs.readFileSync(`${base}/${kind}-source.json`));
 const rows=source.map((card,index)=>{
  const text=card.text.replace(/(Generi|Ne|La|mi|Mi|Micro|Ecopow|Col|Blan)-\s*\n\s*/g,'$1').replace(/\s+/g,' ').trim();
  const wholesaleUsd=Number(text.match(/USD\s*([\d,]+)/)[1].replace(',','.'));
  let name=text.split('USD')[0].trim();
  const color=colors.find(c=>new RegExp(`(?: - |^|\\s)${c}(?: - |$)`,'i').test(name))||'';
  const capacity=kind==='tablets'||kind==='consoles'?name.match(/(\d+)\s*(GB|TB)\s*$/i)?.slice(1).join('')||'':'';
  const ram=kind==='tablets'&&!/Kindle/i.test(name)?name.match(/\s*-\s*(\d+)\s*(?:GB(?: RAM)?|RAM)(?: - |$)/i)?.[1]||'':'';
  const size=kind==='watches'?name.match(/(\d+)\s*mm/i)?.[1]||'':'';
  let model=name;
  if(capacity)model=model.replace(/ - \d+\s*(?:GB|TB)\s*$/i,'');
  if(color)model=model.replace(new RegExp(`(?: - | )${color}$`,'i'),'');
  if(ram)model=model.replace(/\s*-\s*\d+\s*(?:GB(?: RAM)?|RAM)/i,'');
  if(size)model=model.replace(/\s*\d+\s*mm/i,'');
  model=model.replace(/^Parlante\s+/i,'').replace(/^Smartwatch\s+(?=Blackview|Mibro|Xiaomi|Redmi)/i,'').replace(/^Jbl\b/i,'JBL').replace(/^AmazFit/i,'Amazfit').replace(/Premiun/i,'Premium').trim();
  let configuration=size?size+' mm':'';
  model=model.replace(/^Table(?:t)? (?:Para Niños )?/i,'').replace(/^Reloj /i,'').replace(/\s*-\s*$/,'');
  if(kind==='tablets'){
   model=model.replace(/\s+\d+(?:\.\d+)?[¨"]/g,'').replace(/\s*\(WIFI\)/ig,' WiFi').replace(/\s+5G WIFI/i,' 5G WiFi');
   model=model.replace(/^Galaxy /,'Samsung Galaxy ').replace(/^Samsung Tab/,'Samsung Galaxy Tab').replace(/^POCO /i,'POCO ').replace(/^Poco /,'POCO ').replace(/^KEEN /i,'Keen ');
   if(/^POCO /i.test(model))model=model.replace(/PAD/i,'Pad');
   if(/^Keen /i.test(model))model=model.replace(/15 PRO MAX/i,'15 Pro Max');
   if(/Samsung Galaxy Tab A11/.test(model)){configuration=(/SM-X-?135G|Con Chip/i.test(model)?'4G LTE':/5G/.test(model)?'5G':'WiFi');model=model.replace(/\s*\([^)]*\)/g,'').replace(/Con Chip| 5G/g,'').trim();}
   model=model.replace(/\s*\(SM-X400\)/,'').replace('Idea Tab (Pen Plus)','Idea Tab');
   if(/Idea Tab/.test(model))configuration='Incluye Pen Plus';
   model=model.replace(/^Amazon Kindle GEN 11 - 16 GB$/i,'Amazon Kindle 11').replace(/CM(78|86|88|89)\s*WiFi/i,'CM$1');
  }
  if(kind==='speakers'){
   if(/JBL/i.test(model)){
    model=model.replace(/^Barra De Sonido /i,'').replace(/\bGO\b/ig,'Go').replace(/\bCHARGE\b/ig,'Charge').replace(/\bFLIP\b/ig,'Flip').replace(/\bPARTYBOX\b/ig,'PartyBox').replace(/Sound Bar/i,'Bar');
    if(/Con Baterias|Sin Baterias/i.test(model)){configuration=/Sin Baterias/i.test(model)?'Sin baterías':'Con baterías';model=model.replace(/ (?:Con|Sin) Baterias/i,'');}
    if(/\((?:sin|Con) Microfono\)/i.test(model)){configuration=/sin Microfono/i.test(model)?'Sin micrófono':'Con micrófono';model=model.replace(/\s*\([^)]*\)/,'');}
    model=model.replace(/ - Negro$/i,'').replace(/ WIFI/i,' Wi-Fi');
   }else if(/Aiwa|AWSBC800WW/i.test(model)){model='Aiwa '+model.match(/AW[A-Z0-9]+/i)[0].toUpperCase();}
   else if(/Ecopower/i.test(model)){model='Ecopower '+model.match(/Ep\s*-\s*[A-Z]?\d+/i)[0].replace(/\s/g,'').replace(/^ep-/i,'EP-').toUpperCase();}
   model=model.replace(/^AudiSat/i,'Audisat');
  }
  if(kind==='watches'){
   model=model.replace(/^Apple Watch S10$/,'Apple Watch Series 10').replace(/^Apple Watch SE \(Gen 2\)$/,'Apple Watch SE 2').replace(/^BlackView/i,'Blackview').replace(/^GARMIN/i,'Garmin').replace('VivoActive','Vivoactive').replace(/^Mibro watch/i,'Mibro Watch').replace(/^Galaxy Watch Fit 3$/,'Samsung Galaxy Fit3').replace(/^Galaxy Watch (\d+) \(Samsung\)$/i,'Samsung Galaxy Watch $1').replace(/^Galaxy Watch (\d+)$/,'Samsung Galaxy Watch $1').replace(/^Galaxy Watch Ultra \(SAMSUNG\)$/,'Samsung Galaxy Watch Ultra').replace(/ -$/,'');
  }
  if(kind==='consoles'&&/Sony PlayStation 5/i.test(model)){configuration=/Digital/i.test(model)?'Digital':'Con lector de discos · Fortnite';model='Sony PlayStation 5';}
  if(kind==='consoles'&&/Nintendo Switch 2/.test(model))model='Nintendo Switch 2';
  if(kind==='consoles'&&/Nintendo Switch Lite/.test(model))model='Nintendo Switch Lite';
  if(kind==='consoles'&&/Nintendo Switch OLED/.test(model)){model='Nintendo Switch OLED';configuration='Versión japonesa';}
  const flags=[];
  if(/NSG|Generico/i.test(name))flags.push('generic');
  if(!color)flags.push('color-unspecified');
  if(kind==='watches'&&/Xiaomi Smart Band [679].*Caja/i.test(name))flags.push('authenticity-unconfirmed');
  if(kind==='consoles'&&!/Nintendo Switch|Sony PlayStation 5|Xbox ONE X/i.test(name))flags.push('outside-standard-consoles');
  if(kind==='consoles'&&/Xbox ONE X/i.test(name))flags.push('verify-xbox-generation');
  const markup=kind==='tablets'?(/ipad/i.test(name)?35:30):kind==='watches'?25:55;
  const price=kind==='speakers'?Math.ceil(wholesaleUsd*1.5/10)*10:Math.floor((wholesaleUsd+markup+5)/10)*10;
  const brand=/^Black Shark/i.test(model)?'Black Shark':model.split(' ')[0];
  return {sourceIndex:index,model,brand,color,capacity,ram:ram?ram+'GB':'',batt:'',configuration,condition:'Nuevo',stock:10,wholesaleUsd,price,pricingRule:kind==='speakers'?'minimum-50-percent-ceil-10':`plus-${markup}-nearest-10`,flags,sourcePage:card.page,sourceText:card.text};
 });
 fs.writeFileSync(`${base}/${kind}-draft.json`,JSON.stringify(rows,null,2)+'\n');
 report[kind]={sourceCards:rows.length,provisionalModels:new Set(rows.map(r=>r.model)).size,generic:rows.filter(r=>r.flags.includes('generic')).length};
}
fs.writeFileSync(`${base}/progress.json`,JSON.stringify({stage:'Source extraction and price preparation; not published',categories:report},null,2)+'\n');
console.log(report);
