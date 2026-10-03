// Isolated browser fixtures: never create customer accounts, orders or real reservations.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const puppeteer=require('puppeteer');
const base='http://localhost:3000';
const image='/uploads/hero-graphite-phone-v2.jpg';
const products=Array.from({length:8},(_,i)=>({id:9000+i,name:'Samsung Equipo '+i,brand:'Samsung',category:'celulares',price:100+i*10,stock:8,image_url:image,description:'[Condición: Nuevo] Ficha de prueba.',variants:[{color:'Negro',capacity:'128GB',ram:'8GB',price:100+i*10,stock:5,image_url:image},{color:'Blanco',capacity:'256GB',ram:'8GB',price:110+i*10,stock:3,image_url:image}]}));
async function main(){
    const express=require('express');
    const server=express().use(express.static(path.resolve(__dirname,'../../public'))).listen(3000,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    const browser=await puppeteer.launch({headless:true});
    const output=path.resolve(__dirname,'../../artifacts/audit/improvements-2026-10-02');fs.mkdirSync(output,{recursive:true});
    try {
        for(const width of [1440,390,360]){
            const page=await browser.newPage();const errors=[];let cart=[];let orderBody;let catalogRequests=0;
            page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height:900});
            await page.evaluateOnNewDocument(()=>localStorage.setItem('cookies_accepted','true'));
            // Automatic scrolling must settle before fixture clicks; production retains smooth scrolling.
            await page.evaluateOnNewDocument(()=>addEventListener('DOMContentLoaded',()=>{document.documentElement.style.scrollBehavior='auto';document.body.style.scrollBehavior='auto';}));
            await page.setRequestInterception(true);
            page.on('request',request=>{
                const url=new URL(request.url());if(url.origin!==base || !url.pathname.startsWith('/api/'))return request.continue();
                const reply=(body,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(body)});
                if(url.pathname==='/api/products'){catalogRequests++;return reply(products);}
                if(url.pathname.startsWith('/api/products/'))return reply(products.find(p=>String(p.id)===url.pathname.split('/').pop()) || products[0]);
                if(url.pathname==='/api/settings')return reply({carousel:[{title:'Tecnología para tu negocio',subtitle:'Explorá los equipos disponibles',image,link:'catalogo.html'}],shipping_correo:8500,shipping_andreani:12000,free_shipping_threshold:1500000});
                if(url.pathname==='/api/dollar-rate')return reply({rate:1000});
                if(url.pathname.startsWith('/api/cart/')){
                    if(request.method()==='PUT') {const data=JSON.parse(request.postData());const product=products.find(p=>p.id===data.product_id);const variant=product.variants.find(v=>data.variant_name.includes(v.color));let item=cart.find(v=>v.id===String(product.id)&&v.variant_name===data.variant_name);if(!item){item={id:String(product.id),name:product.name,quantity:0,price:variant?.price || product.price,img:image,category:'celulares',variant_name:data.variant_name,expires_at:new Date(Date.now()+86400000).toISOString()};cart.push(item);}item.quantity=data.quantity;return reply({success:true});}
                    return reply(cart.filter(item=>item.quantity>0));
                }
                if(url.pathname==='/api/orders/result')return reply({orderId:123456,total:190,total_ars:190000,dollar_rate:1000});
                if(url.pathname==='/api/orders'){orderBody=JSON.parse(request.postData());return reply({orderId:123456,total:190,total_ars:190000,dollar_rate:1000},201);}
                if(url.pathname==='/api/shipping/quote')return reply({success:true,options:[{id:'correo_domicilio',name:'Correo a domicilio',cost:8500,time:'3-6 días'}]});
                return reply([]);
            });
            await page.goto(base+'/index.html',{waitUntil:'networkidle0'});await page.waitForSelector('.product-card');
            const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,products:document.getElementById('catalogo').offsetTop,faq:document.getElementById('preguntas').offsetTop,dock:getComputedStyle(document.querySelector('.social-dock__link')).backgroundColor}));
            assert.equal(layout.overflow,false,JSON.stringify({width,layout}));assert.ok(layout.products<layout.faq);assert.equal(layout.dock,'rgb(32, 36, 40)');
            await page.screenshot({path:path.join(output,`home-${width}.png`)});
            await page.type('#search-input','Samsung');await page.waitForSelector('.search-result-all');
            assert.equal(catalogRequests,1,'Search must share the catalog download');
            await page.keyboard.press('Enter');await page.waitForSelector('#full-catalog-container .product-card');
            assert.ok(page.url().includes('q=Samsung'));
            if(width<768) await page.click('#catalog-filter-toggle');
            await page.$eval('#price-max',el=>{el.value='115000';el.dispatchEvent(new Event('input',{bubbles:true}));});
            await page.waitForFunction(()=>document.querySelectorAll('#full-catalog-container .product-card').length===2);
            assert.equal(await page.$$eval('#full-catalog-container .product-card',nodes=>nodes.length),2);
            await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$eval('#price-max',el=>el.value),'115000');
            if(width<768) await page.click('#catalog-filter-toggle');
            await page.click('#catalog-reset');if(width<768) await page.click('#catalog-filter-toggle');await page.screenshot({path:path.join(output,`catalog-${width}.png`)});
            if(width<640){const overlap=await page.evaluate(()=>{const dock=document.getElementById('social-dock').getBoundingClientRect();return [...document.querySelectorAll('#full-catalog-container .product-card')].some(card=>card.getBoundingClientRect().right>dock.left);});assert.equal(overlap,false,'Floating controls must have a separate lane');}
            await page.goto(base+'/producto.html?id=9000',{waitUntil:'networkidle0'});await page.waitForSelector('#product-quantity');
            assert.ok(await page.evaluate(()=>document.querySelector('.var-btn').getBoundingClientRect().top<document.querySelector('.product-purchase-panel').getBoundingClientRect().top));
            await page.screenshot({path:path.join(output,`product-${width}.png`)});
            await page.$eval('#product-quantity',el=>{el.value='2';});await page.click('.product-details .add-to-cart-btn');
            await page.waitForFunction(()=>document.getElementById('cart-count-badge')?.textContent.trim()==='(2)');assert.equal(cart[0].quantity,2);
            await page.waitForFunction(()=>document.getElementById('side-cart').classList.contains('active'));
            await page.waitForFunction(()=>{const r=document.getElementById('close-cart-btn').getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;});
            await page.click('#close-cart-btn');
            await page.waitForFunction(()=>!document.getElementById('side-cart').classList.contains('active'));
            await page.waitForFunction(()=>getComputedStyle(document.getElementById('side-cart')).right==='-400px');
            await page.$eval('.bulk-order summary',node=>node.scrollIntoView({block:'center',behavior:'instant'}));
            await page.click('.bulk-order summary');
            await page.waitForFunction(()=>document.querySelector('.bulk-order').open);
            await page.$$eval('.bulk-order input',inputs=>{inputs[1].value='1';});
            await page.click('.bulk-order button');
            await page.waitForFunction(()=>document.querySelector('.bulk-order [role=status]').textContent.length>0);
            assert.equal(await page.$eval('#cart-count-badge',node=>node.textContent.trim()),'(3)',JSON.stringify({cart,status:await page.$eval('.bulk-order [role=status]',node=>node.textContent),errors}));
            assert.equal(cart.length,2,'Bulk purchase must preserve distinct configurations');assert.equal(cart[1].quantity,1);
            await page.goto(base+'/checkout.html',{waitUntil:'networkidle0'});assert.ok(page.url().includes('checkout.html'),'Guest must stay in checkout');
            for(const [id,value] of Object.entries({'chk-email':'fixture@example.invalid','chk-name':'Cliente','chk-lastname':'Prueba','chk-phone':'3447416011','chk-dni':'12345678','chk-address':'Calle prueba 123','chk-city':'San José','chk-zip':'3283'}))await page.$eval('#'+id,(el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
            await page.select('#chk-province','Entre Ríos');
            await page.waitForSelector('input[name=shipping_method]');
            await page.click('#btn-next-step');await page.click('#btn-confirm-pay');
            await page.waitForFunction(()=>location.pathname.includes('compra-exitosa.html'));
            assert.ok(orderBody.idempotency_key);assert.equal(orderBody.customer_email,'fixture@example.invalid');
            await page.evaluate(()=>sessionStorage.setItem('phoneSpotCheckoutPending',JSON.stringify({key:crypto.randomUUID(),cart:crypto.randomUUID()})));
            await page.goto(base+'/checkout.html',{waitUntil:'networkidle0'});
            await page.waitForFunction(()=>location.pathname.includes('compra-exitosa.html'));
            assert.match(await page.$eval('#wp-btn',link=>link.href),/^https:\/\/wa\.me\/\d+\?text=/,'Recovered orders must keep their payment contact');
            assert.deepEqual(errors,[],JSON.stringify({width,errors}));await page.close();
            console.log('Passed home, shared search, filters, mobile dock, quantity and guest order at '+width+'px');
        }
    } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
