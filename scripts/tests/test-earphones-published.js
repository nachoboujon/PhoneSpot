// Read-only production UI checks; every cart request and mutation is mocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require('puppeteer');
const base=process.env.AUDIT_URL||'https://www.phonespot.site';
const imported=JSON.parse(fs.readFileSync('artifacts/earphones-2026-10-01/import-result.json'));
async function main(){const browser=await puppeteer.launch({headless:true});try{
 for(const width of [1440,390]){
  const page=await browser.newPage();await page.setViewport({width,height:900});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
  page.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/api/cart')||!['GET','HEAD'].includes(r.method()))return r.respond({status:200,contentType:'application/json',body:'[]'});return r.continue();});
  const model=imported.find(p=>p.model==='JBL Tune 530BT');const card=`.product-card[data-id="${model.id}"]`;
  await page.goto(base+'/catalogo.html?cat=accesorios',{waitUntil:'domcontentloaded'});
  await page.waitForSelector(card,{timeout:45000});
  const colors=await page.$$eval(card+' select[data-type="color"] option',es=>es.map(e=>e.value));assert.equal(colors.length,4);
  await page.$eval(card,e=>e.scrollIntoView());let previousImage;
  for(const color of colors){
   await page.select(card+' select[data-type="color"]',color);
   const details=await page.$eval(card,e=>({variant:e.dataset.selectedVariant,image:e.querySelector('img').src,text:e.textContent}));
   assert.ok(details.variant.startsWith(color));assert.match(details.text,/Stock: 10/);
   if(previousImage)assert.notEqual(details.image,previousImage);previousImage=details.image;
   await page.waitForFunction(s=>{const i=document.querySelector(s+' img');return i.complete&&i.naturalWidth>0;},{timeout:25000},card);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(const name of ['JBL Tune 530BT','Sony PULSE Explore']){
   const item=imported.find(p=>p.model===name);await page.goto(base+`/producto.html?id=${item.id}`,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#color-opts .var-btn',{timeout:45000});
   const buttons=await page.$$('#color-opts .var-btn');for(const button of buttons){
    await button.click();const color=await button.evaluate(e=>e.textContent.trim());
    assert.ok((await page.$eval('.product-details',e=>e.dataset.selectedVariant)).startsWith(color));
    const gallery=await page.$$eval('.gallery-thumb',es=>es.map(e=>({color:e.dataset.color,url:e.dataset.image})));
    assert.ok(gallery.length>=3);assert.ok(gallery.every(p=>p.color===color));assert.equal(new Set(gallery.map(p=>p.url)).size,gallery.length);
   }
  }
  assert.deepEqual(errors,[]);console.log(`Published earphone colors, photos, galleries and stock: ${width}px`);await page.close();
 }
}finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1});
