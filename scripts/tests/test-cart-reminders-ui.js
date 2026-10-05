// Static local site with all API requests intercepted. No production writes.
const assert=require('node:assert/strict');const express=require('express');const path=require('node:path');const puppeteer=require('puppeteer');
const cartId='11111111-1111-4111-8111-111111111111';
async function main(){const app=express();app.use(express.static(path.resolve(__dirname,'../../public')));const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
let browser;try{
    const base='http://127.0.0.1:'+server.address().port;browser=await puppeteer.launch({headless:true});
    for(const width of [1440,390]){
        const page=await browser.newPage();await page.setViewport({width,height:900});let enabled=true;let restored=false;const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.evaluateOnNewDocument(()=>{localStorage.setItem('phoneSpotToken','fixture-session');localStorage.setItem('phoneSpotRole','client');});
        await page.setRequestInterception(true);page.on('request',request=>{
            const url=new URL(request.url());const reply=(body,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(body)});
            if(url.pathname.startsWith('/api/')){
                if(url.pathname==='/api/cart-reminders/restore'){restored=true;return reply({cart_id:cartId});}
                if(url.pathname.endsWith('/reminder')){const body=JSON.parse(request.postData()||'{}');if(typeof body.enabled==='boolean')enabled=body.enabled;return reply({configured:true,enabled,lead_minutes:60});}
                if(url.pathname.startsWith('/api/cart/'))return reply([{id:'1',name:'Producto de prueba',price:100,quantity:1,category:'celulares',img:'/uploads/hero-graphite-phone-v2.jpg',expires_at:new Date(Date.now()+1800000).toISOString()}]);
                if(url.pathname==='/api/dollar-rate')return reply({rate:1000});if(url.pathname==='/api/settings')return reply({carousel:[]});
                if(url.pathname==='/api/me')return reply({id:1,name:'Cliente',role:'client'});return reply([]);
            }
            if(url.origin!==base)return request.abort();return request.continue();
        });
        await page.goto(base+'/carrito.html?reminder=fixture-link',{waitUntil:'domcontentloaded'});
        await page.waitForSelector('[data-cart-reminder]');assert(restored);
        assert.equal(await page.evaluate(()=>localStorage.getItem('phoneSpotCartId')),cartId);
        assert(!page.url().includes('reminder='));assert.equal(await page.$eval('[data-cart-reminder]',el=>el.checked),true);
        await page.$eval('[data-cart-reminder]',el=>el.click());await page.waitForFunction(()=>document.querySelector('[data-cart-reminder]')?.checked===false&&!document.querySelector('[data-cart-reminder]').disabled);
        assert.equal(enabled,false);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('[data-cart-reminder]');
        assert.equal(await page.$eval('[data-cart-reminder]',el=>el.checked),false);assert.deepEqual(errors,[]);await page.close();
    }
    const guest=await browser.newPage();await guest.evaluateOnNewDocument(()=>localStorage.clear());await guest.setRequestInterception(true);guest.on('request',request=>new URL(request.url()).pathname.startsWith('/api/')?request.respond({status:200,contentType:'application/json',body:'[]'}):request.continue());
    await guest.goto(base+'/carrito.html?reminder=fixture-link',{waitUntil:'domcontentloaded'});
    await guest.waitForFunction(()=>location.pathname.endsWith('/login.html'));
    const redirect=new URL(guest.url()).searchParams.get('redirect');assert.equal(redirect,'carrito.html?reminder=fixture-link');
    console.log('Desktop/mobile preference, persistent opt-out, cross-device cart restore and guest login continuation passed.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}}
main().catch(error=>{console.error(error);process.exitCode=1;});
