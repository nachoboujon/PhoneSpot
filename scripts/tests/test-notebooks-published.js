// Public read-only browser check. Cart and mutation requests are intercepted.
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const base=process.env.AUDIT_URL||'https://www.phonespot.site';
async function main(){const browser=await puppeteer.launch({headless:true});try{
 for(const width of [1440,390]){
  const page=await browser.newPage();await page.setViewport({width,height:900});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
  page.on('request',r=>{const u=new URL(r.url());
   if(u.pathname.startsWith('/api/cart')||!['GET','HEAD'].includes(r.method()))return r.respond({status:200,contentType:'application/json',body:'[]'});
   return r.continue();
  });
  await page.goto(base+'/catalogo.html?categoria=notebooks',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.product-card',{timeout:45000});
  const products=await page.evaluate(()=>window.products||[]);
  const id=products.find(p=>p.name==='Dell 15 DC15250')?.id;
  // The product list is also available via the public API, independent of lexical globals.
  const model=id?{id}:await page.evaluate(async()=>{const p=await(await fetch('/api/products')).json();return p.find(p=>p.name==='Dell 15 DC15250');});
  assert.ok(model);const selector=`.product-card[data-id="${model.id}"]`;
  await page.waitForSelector(selector);const options=await page.$$eval(selector+' select[data-type="configuration"] option',es=>es.map(e=>e.value));
  assert.ok(options.length>=4);
  await page.select(selector+' select[data-type="configuration"]',options.at(-1));
  assert.match(await page.$eval(selector,e=>e.dataset.selectedVariant),/Config:/);
  await page.$eval(selector,e=>e.scrollIntoView());
  await page.waitForFunction(s=>{const i=document.querySelector(s+' img');return i?.complete&&i.naturalWidth>0;},{timeout:25000},selector);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  await page.goto(base+`/producto.html?id=${model.id}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#configuration-opts .var-btn',{timeout:45000});
  assert.ok(await page.$$eval('#configuration-opts .var-btn',es=>es.length)>=4);
  await page.$eval('#configuration-opts .var-btn:last-child',e=>e.click());
  assert.match(await page.$eval('.product-details',e=>e.dataset.selectedVariant),/Config:/);
  assert.deepEqual(errors,[]);console.log(`Published notebook catalog and configurations: ${width}px`);await page.close();
 }
}finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1});
