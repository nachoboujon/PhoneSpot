// Browser fixtures: exercises variant identity and reservations without database writes.
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const base=process.env.AUDIT_URL||'http://localhost:3100',image='/uploads/hero-graphite-laptop-v2.jpg';
const variants=['Intel Core i5','Intel Core i7 · Pantalla táctil'].map((configuration,i)=>({color:'Negro',capacity:'512GB',ram:'8 GB',condition:'Nuevo, Caja Sellada',configuration,price:500+i*100,stock:10,image_url:image,images:[image]}));
const product={id:90077,name:'Dell 15 DC15250',category:'notebooks',brand:'Dell',stock:20,price:500,image_url:image,images:[image],description:'Nueva y sellada.',variants};
const name=v=>[v.color,v.capacity,v.ram,`Cond: ${v.condition}`,`Config: ${v.configuration}`].join(' - ');
async function main(){const browser=await puppeteer.launch({headless:true});try{for(const width of [1440,390]){
variants.forEach(v=>v.stock=10);product.stock=20;const page=await browser.newPage();await page.setViewport({width,height:900});let cart=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
page.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin)return r.respond({status:200,body:''});if(!u.pathname.startsWith('/api/'))return r.continue();
let body=[];if(u.pathname==='/api/products')body=[product];else if(u.pathname.startsWith('/api/products/'))body=product;else if(u.pathname==='/api/settings')body={carousel:[]};else if(u.pathname==='/api/dollar-rate')body={success:true,rate:1};else if(u.pathname.startsWith('/api/cart/')){
if(r.method()==='GET')body=cart;else {const d=JSON.parse(r.postData()),v=variants.find(v=>name(v)===d.variant_name);assert.ok(v,'Cart must send full configuration identity');v.stock--;product.stock--;cart=[{id:String(product.id),name:product.name,variant_name:d.variant_name,price:v.price,quantity:d.quantity,img:image,category:'notebooks',expires_at:new Date(Date.now()+86400000).toISOString()}];body={success:true};}}
return r.respond({status:200,contentType:'application/json',body:JSON.stringify(body)});});
await page.goto(base+'/catalogo.html?categoria=notebooks',{waitUntil:'domcontentloaded'});await page.waitForSelector('.product-card[data-id="90077"]');
const card='.product-card[data-id="90077"]';await page.select(card+' select[data-type="configuration"]',variants[1].configuration);
assert.equal(await page.$eval(card,e=>e.dataset.selectedVariant),name(variants[1]));assert.equal(await page.$eval(card+' .card-price',e=>e.textContent),await page.evaluate(()=>window.formatPrice(600)));
await page.$eval(card+' .add-to-cart-btn',e=>e.click());await page.waitForFunction(()=>document.querySelector('.product-card')?.dataset.cartState==='success');assert.equal(cart[0].variant_name,name(variants[1]));
assert.match(await page.$eval(card,e=>e.textContent),/Stock: 9/);
await page.goto(base+'/producto.html?id=90077',{waitUntil:'domcontentloaded'});await page.waitForSelector('#configuration-opts .var-btn');
await page.$eval('#configuration-opts .var-btn:last-child',e=>e.click());assert.equal(await page.$eval('.product-details',e=>e.dataset.selectedVariant),name(variants[1]));
assert.deepEqual(errors,[]);console.log('Notebook CPU/touch variant, price, cart and stock:',width,'px');await page.close();
}}finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1});
