const fs=require('fs'),crypto=require('crypto'),base='artifacts/categories-2026-10-02';let sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));
function save(s){sets=sets.filter(a=>a.model!==s.model||a.color!==s.color||(a.configuration||'')!==(s.configuration||''));sets.push(s);}
save({model:'G-Tide R5 Lite',color:'Plata',page:'https://atlanticoshop.com.py/index.php?product_id=47966&route=product%2Fproduct',sourceType:'retailer',sources:['https://atlanticoshop.com.py/image/cache/catalog/g-tide-r5-lite-silver-800x800.webp']});
save({model:'Amazon Kindle 11',color:'Negro',page:'https://www.xcite.com/amazon-kindle-e-reader-16gb-6-b09sww583j-black/p',sourceType:'retailer',sources:['01','06','07'].map(n=>'https://cdn.media.amplience.net/i/xcite/659115-'+n+'?w=1200&qlt=90&fmt=png')});
const page='https://www.mishop.mx/products/smartwatch-r6pro',f=`${base}/research/retail-extra-${crypto.createHash('sha256').update(page+'.json').digest('hex').slice(0,16)}.html`;
save({model:'REVIEW Mishop R6',color:'',page,sourceType:'retailer',sources:JSON.parse(fs.readFileSync(f)).product.images.map(i=>i.src)});
sets=sets.filter(s=>!s.model.startsWith('REVIEW G-Tide'));
for(const s of sets){if(s.model==='Xiaomi Watch S5')s.sources=s.sources.slice(0,2);if(s.model==='JBL PartyBox On the Go 2 Plus'&&s.color==='')s.sources=[...s.sources.slice(1),s.sources[0]];}
fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');
