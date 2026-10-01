const fs=require('fs');const crypto=require('crypto');const base='artifacts/wholesale-2026-10-01';
const inputs=['shopify','mi','motorola','apple','extra','fallback'].filter(name=>fs.existsSync(`${base}/${name}-assets.json`)).flatMap(name=>JSON.parse(fs.readFileSync(`${base}/${name}-assets.json`)).assets);
const assets=inputs.map(a=>({...a,sources:a.sources||[a.source]}));
const folder=`${base}/originals`;fs.mkdirSync(folder,{recursive:true});
const tasks=assets.flatMap(asset=>asset.sources.map((source,index)=>({asset,source,index})));
const results=[],errors=[];
async function main(){await Promise.all(Array.from({length:7},async()=>{while(tasks.length){const {asset,source,index}=tasks.shift();const file=crypto.createHash('sha256').update(source).digest('hex').slice(0,20)+'.image';try{
if(!fs.existsSync(`${folder}/${file}`)){let r=await fetch(source,{signal:AbortSignal.timeout(25000)});if(!r.ok&&source.includes('cdn-apple.com/1/'))r=await fetch(source.replace('cdn-apple.com/1/','cdn-apple.com/4982/'),{signal:AbortSignal.timeout(20000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw new Error(`HTTP ${r.status}`);fs.writeFileSync(`${folder}/${file}`,Buffer.from(await r.arrayBuffer()));}
results.push({model:asset.model,color:asset.color,officialColor:asset.officialColor,page:asset.page,source,index,original:file,rgb:asset.rgb,sourceType:asset.sourceType||'manufacturer'});
}catch(e){errors.push({model:asset.model,color:asset.color,source,error:e.message});console.log('FAILED',asset.model,asset.color,e.message);}}}));
fs.writeFileSync(`${base}/downloaded-assets.json`,JSON.stringify({assets:results,errors},null,2)+'\n');console.log(results.length,'photos downloaded',errors.length,'errors');}
main();
