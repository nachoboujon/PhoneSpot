const fs=require('node:fs');const puppeteer=require('puppeteer');
const base='artifacts/notebooks-2026-10-01';
const pages=JSON.parse(fs.readFileSync(`${base}/photo-pages.json`)).filter(p=>/^lenovo-(flex|pro|amn8|iru8|amn7|ian8)$/.test(p.key));
async function main(){
 const browser=await puppeteer.launch({headless:true});const results=[];
 try{for(const p of pages){const tab=await browser.newPage();let photos;
  tab.on('response',async r=>{if(r.url().includes('/api/product/Photo/')){try{photos=await r.json()}catch{}}});
  await tab.goto(p.page,{waitUntil:'networkidle2',timeout:45000});
  for(let i=0;i<20&&!photos;i++)await new Promise(r=>setTimeout(r,500));
  results.push({...p,photos});console.log(p.key,photos?.code,photos?.data?.length||0);
  await tab.close();
 }}finally{await browser.close();}
 fs.writeFileSync(`${base}/lenovo-assets-raw.json`,JSON.stringify(results,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1});
