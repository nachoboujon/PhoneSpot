const fs=require('fs'),crypto=require('crypto'),base='artifacts/categories-2026-10-02';
let sets=JSON.parse(fs.readFileSync(`${base}/photo-sets.json`));
async function get(url){const f=`${base}/research/more-${crypto.createHash('sha256').update(url).digest('hex').slice(0,16)}.html`;if(fs.existsSync(f))return fs.readFileSync(f,'utf8');const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(r.status+' '+url);const h=await r.text();fs.writeFileSync(f,h);return h;}
function save(s){sets=sets.filter(a=>a.model!==s.model||a.color!==s.color||(a.configuration||'')!==(s.configuration||''));sets.push(s);fs.writeFileSync(`${base}/photo-sets.json`,JSON.stringify(sets,null,2)+'\n');console.log(s.model,s.color,s.sources.length);}
async function run(model,color,page,pattern){try{const h=await get(page);let sources=[];
if(model.startsWith('REVIEW G-Tide'))sources=[...h.matchAll(/class="main_img" src="([^"]+)/g)].map(m=>m[1]);
else if(model.startsWith('Samsung'))sources=[...new Set((h.replaceAll('\\/','/').match(/(?:https?:)?\/\/[^"'<>\s]+/gi)||[]))].filter(u=>/images\.samsung\.com/.test(u)&&/gallery/.test(u)&&/p619|p615/i.test(u)).map(u=>u.split('?')[0]+'?$1200_1200_PNG$');
else if(pattern)sources=[...new Set(h.match(/(?:https?:)?\/\/[^"'<>\s]+?\.(?:jpg|png|webp)(?:\?[^"'<>\s]*)?/gi)||[])].filter(u=>pattern.test(u));
else for(const m of h.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const q=[JSON.parse(m[1])];while(q.length){const p=q.shift();if(!p||typeof p!=='object')continue;if(p['@type']==='Product'){const im=p.image||[];sources.push(...(Array.isArray(im)?im:[im]).map(i=>typeof i==='string'?i:i.url).filter(Boolean));}q.push(...Object.values(p).filter(v=>typeof v==='object'));}}catch{}}
if(sources.length)save({model,color,page,sourceType:/garmin|samsung|g-tide\.com|lenovo\.com/.test(page)?'manufacturer':'retailer',sources:[...new Set(sources)].slice(0,6)});else console.log(model,'missing');}catch(e){console.log(model,e.message);}}
async function main(){await Promise.all([
run('Garmin Forerunner 55','Negro','https://www.garmin.com.sg/products/wearables/forerunner-55-black/',/forerunner-55-black.*(?:lg|jpg)/i),
run('Samsung Galaxy Tab S6 Lite','Azul','https://www.samsung.com/pt/tablets/galaxy-tab-s/galaxy-tab-s6-lite-blue-64gb-sm-p619nzbaphe/',/p6pim.*gallery/i),
run('Lenovo Idea Tab','Gris','https://shop.lenovo.ua/tablet/planset-lenovo-idea-tab-8128-luna-grey-pen-zafr0462ua.html'),
run('G-Tide R5 Lite','Plata','https://www.victoriastore.com.br/item/rel-smartwatch-g-tide-r5-lite-silver763027'),
run('Game Stick 2.4G A3086-M15 Plus','Blanco','https://mobile.comprasparaguai.com.br/console-game-stick-abc-game-a3086-m15-plus-24ghz-4k-128gb-com-2-controles-branco__5139434/'),
...['265','266','228'].map(id=>run('REVIEW G-Tide '+id,'','https://www.g-tide.com/product/'+id+'.html',/cdn1\.g-tide\.com\/portal\//i))
]);
save({model:'JBL Xtreme 5',color:'Azul',page:'https://uk.jbl.com/XTREME-5-NA.html?dwvar_XTREME-5-NA_color=Blue-GLOBAL-Current',sourceType:'manufacturer',sources:['https://ca.jbl.com/dw/image/v2/AAUJ_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwf451f6bf/LS_JBL_XTREME_5_3_4_RIGHT_BLUE_0060_x3.jpg?sw=1200&sh=1200']});
}
main().catch(e=>{console.error(e);process.exitCode=1});
