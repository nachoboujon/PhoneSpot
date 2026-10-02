const fs=require('fs');const base='artifacts/earphones-2026-10-01';const rows=JSON.parse(fs.readFileSync(`${base}/earphones.json`));
fs.mkdirSync(`${base}/research`,{recursive:true});
const ids={'JBL Endurance Pace':'ENDURANCE-PACE','JBL Endurance Peak 4':'ENDURANCE-PEAK-4','JBL Live Buds 3':'LIVEBUDS3','JBL Sense Lite':'SENSELITE','JBL Sense Pro':'SENSEPRO','JBL Soundgear Clips':'SOUNDGEAR-CLIPS','JBL Tune 110':'T110','JBL Tune 510BT':'TUNE510BT','JBL Tune 520BT':'TUNE520BT','JBL Tune 520C':'TUNE520C-USB-C','JBL Tune 530BT':'TUNE530BT','JBL Tune 720BT':'TUNE720BT','JBL Tune 730BT':'TUNE730BT','JBL Tune 770NC':'TUNE770NC','JBL Tune 780NC':'TUNE780NC','JBL Tune Buds 2':'TUNE-BUDS-2','JBL Tune Flex 2':'TUNE-FLEX-2','JBL Wave Buds 2':'WAVE-BUDS-2'};
const aliases={Blanco:['white'],Negro:['black'],Azul:['blue'],Celeste:['blue'],Turquesa:['turquoise','blue'],Rojo:['red'],Rosa:['pink'],Morado:['purple','lavender'],Lavanda:['lavender','purple']};
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const assets=[],pending=[];
async function get(url,file){if(fs.existsSync(file))return fs.readFileSync(file,'utf8');const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${r.status}: ${url}`);const h=await r.text();fs.writeFileSync(file,h);return h;}
async function jbl(row){let id=ids[row.model];if(row.model==='JBL Tune 110')id='JBL%20T110';if(row.model==='JBL Tune 510BT')id='TUNE510BT-';const host=['JBL Endurance Peak 4','JBL Tune 510BT','JBL Tune 770NC','JBL Tune 110'].includes(row.model)?'id.jbl.com':'www.jbl.com.ar';const root=`https://${host}/${id}.html`;
 const h=await get(root,`${base}/research/${host}-${id}.html`);
 const options=[...new Set((h.match(new RegExp(`dwvar_${id}_color=[^"<>\\s]+`,'g'))||[]).map(s=>decodeURIComponent(s.split('=')[1].split('&')[0])))];
 const c=options.find(c=>aliases[row.color].some(a=>c.toLowerCase().includes(a)));if(!c)throw Error(`No color ${row.color}: ${options}`);
 const page=root+`?dwvar_${id}_color=${encodeURIComponent(c)}`;
 const selected=await get(page,`${base}/research/${host}-${id}-${row.color}.html`);
 let sources=[...new Set((selected.match(/https?:\/\/[^"'<>]+?\.(?:png|jpg)(?:\?[^"'<>]*)?/g)||[]).filter(u=>/masterCatalog.*\.(?:png|jpg)/i.test(u)).map(u=>u.split('?')[0]))];
 const modelKey=normalize(row.model.replace('JBL ',''));
 sources=sources.filter(u=>{const f=decodeURIComponent(u.split('/').at(-1));return (normalize(f).includes(modelKey)||normalize(f).includes(normalize(id))||(row.model==='JBL Tune 110'&&/t110/i.test(f)))&&aliases[row.color].some(a=>f.toLowerCase().includes(a))&&!/box|lifestyle|feature|benefit/i.test(f);}).slice(0,5).map(u=>u+'?sw=1200&sh=1200');
 if(sources.length<(row.model==='JBL Tune 110'?1:2))throw Error(`Too few color photos: ${sources.length}`);
 assets.push({model:row.model,color:row.color,page,officialColor:c,sourceType:'manufacturer',sources});console.log(row.model,row.color,sources.length);
}
async function mi(model){const tag=model.toLowerCase().replaceAll(' ','-');
 for(const region of ['es','uk','de','fr','it']){try{
  const raw=await get(`https://go.buy.mi.com/${region}/v2/item/productdetail?tag=${tag}&from=pc`,`${base}/research/${tag}-${region}.json`);
  const detail=JSON.parse(raw).data?.item_detail;if(!detail?.spu_list?.length)continue;
  const colors=detail.specs_list.specs_list.find(s=>s.key==='color')?.list||[];
  for(const row of rows.filter(r=>r.model===model)){
   if(assets.some(a=>a.model===model&&a.color===row.color))continue;
   const c=colors.find(c=>aliases[row.color].some(a=>c.name.toLowerCase().includes(a)||({Blanco:'blanco',Negro:'negro',Rosa:'rosa',Celeste:'azul'}[row.color]&&c.name.toLowerCase().includes({Blanco:'blanco',Negro:'negro',Rosa:'rosa',Celeste:'azul'}[row.color]))));if(!c)continue;
   const item=detail.spu_list.flatMap(s=>s.item_list||[]).find(i=>i.item_name.toLowerCase().includes(c.name.toLowerCase()));if(!item)continue;
   const sources=[...new Set(item.resource_list?.filter(p=>p.type==='image').map(p=>p.src)||item.goods_gallery?.map(p=>p.img_url)||[])].slice(0,5);if(sources.length<2)continue;
   assets.push({model,color:row.color,page:`https://www.mi.com/${region}/product/${tag}/buy/`,officialColor:c.name,rgb:c.rgb,sourceType:'manufacturer',sources});console.log(model,row.color,sources.length);
  }
  if(rows.filter(r=>r.model===model).every(r=>assets.some(a=>a.model===model&&a.color===r.color)))return;
 }catch(e){console.log(model,region,e.message);}}
}
async function main(){const q=rows.filter(r=>r.brand==='JBL');await Promise.all(Array.from({length:3},async()=>{while(q.length){const r=q.shift();try{await jbl(r);}catch(e){pending.push({...r,reason:e.message});}}}));
 await Promise.all([...new Set(rows.filter(r=>r.brand==='Redmi').map(r=>r.model))].map(mi));
 for(const r of rows.filter(r=>!assets.some(a=>a.model===r.model&&a.color===r.color)&&!pending.some(a=>a.model===r.model&&a.color===r.color)))pending.push({...r,reason:'Requires separate official gallery'});
 fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(assets,null,2)+'\n');fs.writeFileSync(`${base}/pending-photos.json`,JSON.stringify(pending,null,2)+'\n');console.log('Pending:',pending.map(p=>[p.model,p.color,p.reason]));
}
main().catch(e=>{console.error(e);process.exitCode=1});
