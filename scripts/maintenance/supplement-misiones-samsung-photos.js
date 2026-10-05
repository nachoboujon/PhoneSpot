const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'../../artifacts/misiones-samsung-2026-10-05');
const pages=[
 ['Samsung Galaxy A07S','Negro','Black','https://www.samsung.com/africa_en/smartphones/galaxy-a/galaxy-a07s-black-64gb-sm-a077fzkdafb/'],
 ['Samsung Galaxy A07S','Violeta','Light Violet','https://www.samsung.com/africa_en/smartphones/galaxy-a/galaxy-a07s-light-violet-64gb-sm-a077flvdafb/'],
 ['Samsung Galaxy A07S','Verde','Green','https://www.samsung.com/africa_en/smartphones/galaxy-a/galaxy-a07s-green-64gb-sm-a077fzgdafb/'],
 ['Samsung Galaxy S25 FE','Blanco','White','https://www.samsung.com/uk/smartphones/galaxy-s/galaxy-s25-fe-white-256gb-sm-s731bzwgeub/buy/'],
 ['Samsung Galaxy A06','Negro','Black','https://www.samsung.com/za/smartphones/galaxy-a/galaxy-a06-black-64gb-sm-a065fzkdafa/'],
 ['Samsung Galaxy A06','Oro','Gold','https://www.samsung.com/in/smartphones/galaxy-a/galaxy-a06-gold-128gb-sm-a065fzdhins/buy/'],
 ['Samsung Galaxy A56 5G','Verde','Awesome Olive','https://www.samsung.com/ae/smartphones/galaxy-a/galaxy-a56-5g-awesome-olive-256gb-sm-a566bzgwmea/buy/'],
 ['Samsung Galaxy A56 5G','Negro','Awesome Graphite','https://www.samsung.com/ae/smartphones/galaxy-a/galaxy-a56-5g-awesome-graphite-256gb-sm-a566bzkymea/buy/'],
 ['Samsung Galaxy A56 5G','Rosa','Awesome Pink','https://www.samsung.com/ae/smartphones/galaxy-a/galaxy-a56-5g-awesome-pink-128gb-sm-a566blivmea/buy/']
];
async function main(){
 const ready=JSON.parse(fs.readFileSync(path.join(base,'ready.json'))),pending=JSON.parse(fs.readFileSync(path.join(base,'pending.json')));
 const records=[];
 for(const [model,color,officialColor,url]of pages){
  const file=path.join(base,model.replace(/\W+/g,'-')+'-'+color+'-'+crypto.createHash('sha256').update(url).digest('hex').slice(0,8)+'-gallery.html');
  let html;if(fs.existsSync(file))html=fs.readFileSync(file,'utf8');else{const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok){console.log(model,color,response.status);continue;}html=await response.text();fs.writeFileSync(file,html);}
  const images=[];
  const tags=html.match(new RegExp('<'+'img\\b[^>]+>','gi'))||[];
  for(const tag of tags){const alt=tag.match(/\balt="([^"]*)"/i)?.[1]||'';if(!alt.toLowerCase().includes(officialColor.toLowerCase()))continue;
   for(const m of tag.matchAll(/(?:src|data-desktop-src|data-src)="([^"]+)"/g)){let src=m[1].replace(/&amp;/g,'&');if(!src.includes('/gallery/')||/thumb|LazyLoad|240_240|624_468/.test(src))continue;if(src.startsWith('//'))src='https:'+src;if(images.some(i=>i.url.split('?')[0]===src.split('?')[0]))continue;images.push({url:src,label:alt});}
  }
  if(!images.length){console.log(model,color,'no selected gallery in page');continue;}
  records.push({model,color,officialColor,sourcePage:url,images:images.slice(0,3)});
 }
 const spec=JSON.parse(fs.readFileSync(path.join(base,'s24-official-images.json')));
 for(const [color,label]of [['Gris','Titanium Grey'],['Negro','Titanium Black'],['Violeta','Titanium Violet']]){
  const image=spec.find(p=>p.alt.includes(label)&&!p.url.includes('LazyLoad'));
  if(image)records.push({model:'Samsung Galaxy S24 Ultra',color,officialColor:label,sourcePage:'https://www.samsung.com/uk/smartphones/galaxy-s24-ultra/specs/',images:[{url:'https:'+image.url,label:image.alt}]});
 }
 for(const record of records){
  const photos=[];
  for(const image of record.images){const file='samsung-'+crypto.createHash('sha256').update(image.url).digest('hex').slice(0,20)+'.jpg';if(!fs.existsSync(path.join(base,file))){const response=await fetch(image.url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Photo '+response.status);fs.writeFileSync(path.join(base,file),Buffer.from(await response.arrayBuffer()));}photos.push({...image,file});}
  for(const row of pending.filter(r=>r.model===record.model&&r.color===record.color)){ready.push({...row,officialColor:record.officialColor,sourcePage:record.sourcePage,photos});}
 }
 const rest=pending.filter(r=>!ready.some(a=>a.sourceText===r.sourceText));
 fs.writeFileSync(path.join(base,'ready.json'),JSON.stringify(ready,null,2));fs.writeFileSync(path.join(base,'pending.json'),JSON.stringify(rest,null,2));
 console.log(JSON.stringify({ready:ready.length,pending:rest.length,models:new Set(ready.map(r=>r.model)).size}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
