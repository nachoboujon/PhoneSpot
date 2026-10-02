// Read-only browser check of imported configurations and their galleries.
const assert=require('node:assert/strict'),fs=require('fs'),puppeteer=require('puppeteer');
const base=process.env.AUDIT_URL||'http://localhost:3102';
async function main(){
 const response=await fetch(base+'/api/products');assert.ok(response.ok);const products=await response.json();
 const browser=await puppeteer.launch({headless:true});const findings=[];
 try{for(const name of ['Sony PlayStation 5','Redmi Pad 2','Apple Watch Series 11','Redmi Watch 6 Active']){
  const p=products.find(p=>p.name===name);assert.ok(p,name+' published');const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:390,height:844});await page.setRequestInterception(true);
  page.on('request',r=>{const u=new URL(r.url());if(u.origin===new URL(base).origin&&u.pathname.startsWith('/api/')&&r.method()!=='GET')return r.respond({status:200,contentType:'application/json',body:'{}'});r.continue();});
  await page.evaluateOnNewDocument(()=>localStorage.setItem('cookies_accepted','true'));
  await page.goto(base+'/producto.html?id='+p.id,{waitUntil:'networkidle2'});await page.waitForSelector('.var-btn');
  const dimensions=['color','configuration','capacity','ram','condition'];
  for(const variant of p.variants){
   for(const dimension of dimensions)if(variant[dimension]){
    const button=await page.evaluateHandle(({dimension,value})=>[...document.querySelectorAll('.var-btn')].find(b=>b.dataset.type===dimension&&b.dataset.val===value),{dimension,value:variant[dimension]});
    const el=button.asElement();if(el)await el.click();await button.dispose();
   }
   const gallery=await page.$$eval('.gallery-thumbnails img',images=>images.map(i=>i.src));
   assert.deepEqual(gallery,[...new Set([variant.image_url,...variant.images])],name+' exact variant gallery');
   assert.ok(await page.$eval('#dynamic-price',el=>el.textContent.trim()),name+' price visible');
  }
  assert.deepEqual(errors,[],name+' JS errors');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,name+' mobile overflow');
  findings.push({name,variants:p.variants.length,errors});await page.screenshot({path:'artifacts/categories-2026-10-02/research/ui-'+p.id+'.png',fullPage:true});await page.close();
 }
 fs.writeFileSync('artifacts/categories-2026-10-02/browser-verification.json',JSON.stringify({url:base,findings},null,2)+'\n');console.log(findings);
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
