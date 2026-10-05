// Only processes evidence collected from the user-authorized WhatsApp group.
// Default is a read-only preview. --apply updates reviewed, exactly matched variants.
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({quiet:true});
const batchArg=process.argv.indexOf('--batch');
const base = path.resolve(batchArg>=0?process.argv[batchArg+1]:path.resolve(__dirname, '../../artifacts/misiones-sync-2026-10-05'));
const artifacts = path.resolve(__dirname,'../../artifacts');
const policy = require('../../config/misiones-supplier-policy.json');
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+]/g,'');
const templates = [
 ['wholesale-2026-10-01/phones.json','phones'],
 ['notebooks-2026-10-01/notebooks.json','notebooks'],
 ['categories-2026-10-02/selected.json',null]
].flatMap(([file,kind]) => JSON.parse(fs.readFileSync(path.resolve(artifacts,file),'utf8')).map(r=>({...r,kind:kind || ({watches:'smartwatches',tablets:/ipad/i.test(r.model)?'ipad':'tablets',consoles:/nintendo/i.test(r.model)?'nintendo':/xbox/i.test(r.model)?'xbox':'playstation'})[r.kind]})));
const reviewedPath=path.join(base,'reviewed-templates.json');
if(fs.existsSync(reviewedPath))templates.push(...JSON.parse(fs.readFileSync(reviewedPath,'utf8')));
function markupFor(row){
 if(row.kind==='televisions'){
  const size=Number(row.screenInches);
  if(!policy.televisions.allowedSizesInches.includes(size))return null;
  return policy.televisions.markupsUsdBySize[String(size)];
 }
 return policy.markups[row.kind]??null;
}
function parseUsd(text){
 let value=String(text).replace(/^USD\s*/i,'').trim();
 if(/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(value))value=value.replace(/\./g,'');
 if(/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(value))value=value.replace(/,/g,'');
 const amount=Number(value.replace(',','.'));
 if(!Number.isFinite(amount)||amount<=0)throw Error('Invalid wholesale price: '+text);
 return amount;
}
function cards(list) {
 if(list.sourceChat!==policy.sourceChat)throw Error('Unauthorized or missing source chat: '+list.filename);
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(list.sourceAt||''))throw Error('Missing dated source: '+list.filename);
 const blocks = (list.coordinates||[]).map(b=>({...b,x:parseFloat(b.x),y:parseFloat(b.y)}));
 const prices = blocks.filter(b=>/^USD\s+[\d.,]+$/.test(b.text.trim()));
 return prices.map(p=>{
  const candidates=blocks.filter(b=>b.page===p.page && b.y<=p.y && p.y-b.y<70 && Math.abs(b.x-p.x)<65 && !/^USD|Categoría:|Marca:|Fecha:|Página/.test(b.text) && b.y>100).sort((a,b)=>b.y-a.y);
  if(!candidates.length)throw Error('Missing label: '+list.filename+' '+p.text);
  const name=candidates[0].text.replace(/\s+/g,' ').trim();
  const wholesaleUsd=parseUsd(p.text);
  if(!Number.isFinite(wholesaleUsd)||wholesaleUsd<=0)throw Error('Invalid wholesale price: '+list.filename);
  return {filename:list.filename,sourceAt:list.sourceAt,page:p.page,label:name,wholesaleUsd,sourceText:candidates[0].text};
 });
}
function templateFor(card) {
 const signature=norm(card.sourceText);
 const matches=templates.filter(r=>norm((r.sourceText||r.label||'').split(/USD/i)[0])===signature);
 const unique=new Map(matches.map(r=>[[r.model,r.color,r.capacity,r.ram,r.condition,r.configuration||''].join('|'),r]));
 return unique.size===1?[...unique.values()][0]:null;
}
const key=v=>[v.color,v.capacity,v.ram,v.batt||'',v.condition,v.configuration||''].map(norm).join('|');
async function main(){
 const ledgerPath=path.resolve(artifacts,'misiones-supplier-state.json');
 const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{};
 const lists=JSON.parse(fs.readFileSync(path.join(base,'source-lists.json'),'utf8'));
 const extracted=lists.flatMap(cards);
 fs.writeFileSync(path.join(base,'source-cards.json'),JSON.stringify(extracted,null,2)+'\n');
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_KEY);
 const products=[];for(let offset=0;;offset+=500){const {data,error}=await db.from('products').select('*').order('id').range(offset,offset+499);if(error)throw error;products.push(...data);if(data.length<500)break;}
 fs.writeFileSync(path.join(base,'catalog-snapshot.json'),JSON.stringify(products,null,2)+'\n');
 const byName=new Map();for(const p of products.filter(p=>!p.archived_at)){const n=norm(p.name);if(!byName.has(n))byName.set(n,[]);byName.get(n).push(p);}
 const plan=[],pending=[];
 for(const card of extracted){
  const t=templateFor(card);
  if(!t){pending.push({...card,reason:'No exact reviewed normalization; needs model/variant matching'});continue;}
  const markup=markupFor(t);
  if(markup===null||policy.manual.some(b=>norm(t.brand)===norm(b)))continue;
  const allowedBrands=t.kind==='televisions'?policy.televisions.brands:policy.brands;
  if(t.kind!=='phones'&&!allowedBrands.some(b=>norm(b)===norm(t.brand))){pending.push({...card,reason:'Brand outside approved scope'});continue;}
  const matches=byName.get(norm(t.model))||[];
  if(matches.length!==1){pending.push({...card,model:t.model,reason:matches.length?'Duplicate active product':'Model missing or archived; needs reviewed new-product import'});continue;}
  const p=matches[0], variants=typeof p.variants==='string'?JSON.parse(p.variants):p.variants||[];
  const indices=variants.map((v,i)=>key(v)===key(t)?i:-1).filter(i=>i>=0);
  if(indices.length!==1){pending.push({...card,model:t.model,reason:'Exact existing variant missing or ambiguous'});continue;}
  const index=indices[0],price=card.wholesaleUsd+markup;
  const previousSource=ledger[p.id+'|'+index];
  if(previousSource&&previousSource.sourceAt>card.sourceAt){pending.push({...card,model:t.model,reason:'Older than the last applied quote'});continue;}
  plan.push({...card,id:p.id,model:p.name,index,previous:variants[index].price,price,kind:t.kind});
 }
 const unique=new Map();for(const r of plan){const k=r.id+'|'+r.index;const prev=unique.get(k);if(prev&&prev.price!==r.price)throw Error('Conflicting source quotes: '+k);unique.set(k,r);}
 const updates=[...unique.values()].filter(r=>Number(r.previous)!==r.price);
 fs.writeFileSync(path.join(base,'preview.json'),JSON.stringify({updates,pending,matched:unique.size,sourceCards:extracted.length},null,2)+'\n');
 console.log(JSON.stringify({sourceCards:extracted.length,matched:unique.size,updates:updates.length,pending:pending.length,byKind:updates.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{})}));
 if(!process.argv.includes('--apply'))return;
 const affected=products.filter(p=>updates.some(r=>r.id===p.id));
 fs.writeFileSync(path.join(base,'before-'+Date.now()+'.json'),JSON.stringify(affected,null,2)+'\n');
 const applied=[];
 for(const p of affected){
  const variants=structuredClone(typeof p.variants==='string'?JSON.parse(p.variants):p.variants||[]);
  const changes=updates.filter(r=>r.id===p.id);for(const r of changes)variants[r.index].price=r.price;
  // This run does not change offer flags: source PDFs contain normal price lists.
  const price=Math.min(...variants.map(v=>Number(v.price)).filter(n=>Number.isFinite(n)&&n>0));
  let q=db.from('products').update({variants,price}).eq('id',p.id).is('archived_at',null).eq('price',p.price).eq('stock',p.stock).eq('variants',typeof p.variants==='string'?p.variants:JSON.stringify(p.variants));
  q=p.updated_at?q.eq('updated_at',p.updated_at):q;
  const {data,error}=await q.select('id,name,price,variants,stock');if(error)throw error;if(data?.length!==1)throw Error('Concurrent edit: '+p.name);
  applied.push(...changes);fs.writeFileSync(path.join(base,'applied.json'),JSON.stringify(applied,null,2)+'\n');
  for(const r of changes)ledger[r.id+'|'+r.index]={sourceAt:r.sourceAt,filename:r.filename,wholesaleUsd:r.wholesaleUsd,price:r.price};
  fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
 }
 const verified=[];for(const r of applied){const {data,error}=await db.from('products').select('variants,price,stock').eq('id',r.id).single();if(error)throw error;const v=typeof data.variants==='string'?JSON.parse(data.variants):data.variants;if(Number(v[r.index].price)!==r.price)throw Error('Readback mismatch: '+r.model);verified.push({id:r.id,index:r.index,price:r.price});}
 fs.writeFileSync(path.join(base,'verification.json'),JSON.stringify(verified,null,2)+'\n');
 console.log('Verified applied variants: '+verified.length);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={cards,templateFor,key,markupFor,parseUsd};
