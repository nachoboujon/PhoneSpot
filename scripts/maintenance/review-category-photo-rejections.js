const fs=require('fs');const base='artifacts/categories-2026-10-02';
const rejected=[
 {model:'Blackview X30',reason:'Incorrect product: supplier model X30 was matched to a power station with a similar catalog name.'},
 {model:'Mibro Watch GS Pro',reason:'Review exact generation: catalog substring matching may select GS Pro 2.'},
 {model:'Mibro Watch GS Explorer',reason:'Review exact edition: catalog includes GS Explorer S; case/strap finish must match.'},
 {model:'Xiaomi Smart Band 10',reason:'Review image order and accessories: the initial source included a necklace accessory.'},
 {model:'POCO PAD M1',reason:'Obsolete draft capitalization; re-map to grouped POCO Pad M1.'}
];
const setPath=`${base}/photo-sets.json`;const sets=JSON.parse(fs.readFileSync(setPath));
fs.writeFileSync(`${base}/rejected-photo-sets.json`,JSON.stringify({reasons:rejected,sets:sets.filter(s=>rejected.some(r=>r.model===s.model))},null,2)+'\n');
fs.writeFileSync(setPath,JSON.stringify(sets.filter(s=>!rejected.some(r=>r.model===s.model)),null,2)+'\n');
const manifestPath=`${base}/image-manifest.json`;const manifest=JSON.parse(fs.readFileSync(manifestPath));
manifest.assets=manifest.assets.filter(s=>!rejected.some(r=>r.model===s.model));manifest.identityReview='In progress. Dimension validation does not imply exact model/color approval.';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Removed unsafe candidate galleries; no products published.');
