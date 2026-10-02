const fs=require('fs'),base='artifacts/categories-2026-10-02';let sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));
for(const s of JSON.parse(fs.readFileSync(`${base}/additional-photo-sets.json`))){sets=sets.filter(a=>a.model!==s.model||a.color!==s.color||a.configuration!==s.configuration);sets.push(s);}
for(const s of sets){s.sources=[...new Set(s.sources)];if(s.model.startsWith('Cidea')&&s.sourceType==='manufacturer')s.sources=s.sources.slice(0,s.model==='Cidea CM817 Air 5G'?2:1);}
fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');
