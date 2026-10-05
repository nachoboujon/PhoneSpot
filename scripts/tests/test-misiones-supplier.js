const assert=require('node:assert/strict');
const fs=require('node:fs');
const {cards,key}=require('../maintenance/sync-misiones-supplier');
const base='artifacts/misiones-sync-2026-10-05';
const lists=JSON.parse(fs.readFileSync(base+'/source-lists.json'));
const notebook=cards(lists.find(l=>l.filename.startsWith('NOTEBOOK')));
assert.equal(notebook.length,66,'All 66 notebook cards must be extracted');
assert.equal(notebook.find(r=>r.label.includes('A15-51M-987E')).wholesaleUsd,815);
assert.equal(notebook.find(r=>r.label.includes('E1504GA-WS35')).wholesaleUsd,430,'Prices stored out of text order must stay with their physical card');
assert.throws(()=>cards({...lists[1],sourceChat:'Other chat'}),/Unauthorized/);
assert.notEqual(key({capacity:'256GB',condition:'Nuevo'}),key({capacity:'256GB',condition:'Usado'}));
assert.notEqual(key({capacity:'256GB',ram:'8GB'}),key({capacity:'256GB',ram:'12GB'}));
const applied=JSON.parse(fs.readFileSync(base+'/applied.json'));
const snapshots=fs.readdirSync(base).filter(f=>/^before-\d+\.json$/.test(f)).sort();
const before=JSON.parse(fs.readFileSync(base+'/'+snapshots[0]));
const verification=JSON.parse(fs.readFileSync(base+'/verification.json'));
assert.equal(applied.length,134);
assert.equal(verification.length,applied.length);
for(const r of applied){
 assert.equal(r.price-r.wholesaleUsd,r.kind==='phones'?30:50);
 const old=before.find(p=>p.id===r.id);
 const variants=typeof old.variants==='string'?JSON.parse(old.variants):old.variants;
 assert.equal(Number(variants[r.index].price),Number(r.previous));
 assert.ok(verification.some(v=>v.id===r.id&&v.index===r.index&&v.price===r.price));
}
console.log('Passed supplier extraction, scope, variant identity and 134 applied price checks');
