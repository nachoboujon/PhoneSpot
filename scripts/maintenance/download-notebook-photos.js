const fs=require('fs'),crypto=require('crypto');const base='artifacts/notebooks-2026-10-01';
const sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));fs.mkdirSync(`${base}/originals`,{recursive:true});
const tasks=sets.flatMap(s=>s.sources.map((source,index)=>({...s,source,index}))),assets=[],errors=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const placeholder=fs.existsSync(`${base}/bb-6672944.jpg`)?hash(fs.readFileSync(`${base}/bb-6672944.jpg`)):null;
async function main(){await Promise.all(Array.from({length:4},async()=>{while(tasks.length){const a=tasks.shift(),original=hash(a.source).slice(0,20)+'.image';try{
if(!fs.existsSync(`${base}/originals/${original}`)){const r=await fetch(a.source,{signal:AbortSignal.timeout(30000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error(`HTTP ${r.status} ${r.headers.get('content-type')}`);fs.writeFileSync(`${base}/originals/${original}`,Buffer.from(await r.arrayBuffer()));}
const bytes=fs.readFileSync(`${base}/originals/${original}`);if(bytes.length<3000||hash(bytes)===placeholder)throw Error('Empty or placeholder image');
assets.push({...a,sources:undefined,original,originalSha256:hash(bytes)});
}catch(e){errors.push({model:a.model,source:a.source,error:e.message});console.log('FAILED',a.model,a.index,e.message);}}}));
fs.writeFileSync(`${base}/downloaded-assets.json`,JSON.stringify({assets,errors},null,2)+'\n');console.log(assets.length,'downloaded;',errors.length,'rejected');}
main().catch(e=>{console.error(e.message);process.exitCode=1});
