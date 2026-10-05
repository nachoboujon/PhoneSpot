const assert=require('node:assert/strict'),express=require('express'),puppeteer=require('puppeteer'),path=require('path'),fs=require('fs');
// Local pages and API fixtures only; no production reads or writes.
async function main(){const app=express();app.use(express.static(path.resolve(__dirname,'../../public')));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
try{browser=await puppeteer.launch({headless:true});const base='http://127.0.0.1:'+server.address().port;const output=path.resolve(__dirname,'../../artifacts/audit/device-analytics');fs.mkdirSync(output,{recursive:true});
for(const width of [1440,390,320]){
    const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width,height:900});const events=[],errors=[];let mode='normal',analyticsCalls=0,adminAllowed=true;
    page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
    page.on('request',request=>{const url=new URL(request.url());const reply=(data,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(data)});
        if(url.pathname.startsWith('/api/')){
            if(url.pathname==='/api/events'){events.push(JSON.parse(request.postData()));return request.respond({status:204});}
            if(url.pathname==='/api/admin/session')return request.respond({status:adminAllowed?204:403});
            if(url.pathname==='/api/admin/analytics'){analyticsCalls++;if(mode==='error')return reply({error:'Fixture'},503);return reply({period_days:30,page_views:200,add_to_cart:8,checkout_started:3,visits:{total:mode==='empty'?0:100,devices:{mobile:mode==='empty'?0:65,tablet:mode==='empty'?0:5,desktop:mode==='empty'?0:28,unknown:mode==='empty'?0:2}}});}
            if(url.pathname==='/api/settings')return reply({carousel:[]});if(url.pathname==='/api/dollar-rate')return reply({rate:1400});if(url.pathname==='/api/stats')return reply({total_revenue:0,total_orders:0,total_items:0,top_products:[]});return reply([]);
        }
        if(url.origin!==base)return request.abort();return request.continue();
    });
    await page.goto(base+'/index.html',{waitUntil:'networkidle0'});await page.goto(base+'/catalogo.html',{waitUntil:'networkidle0'});await page.reload({waitUntil:'networkidle0'});
    assert.deepEqual(events.filter(e=>e.event_type==='page_view').map(e=>e.visit_start),[true,false,false],'Navigation/reload is still one visit');
    await page.evaluate(()=>{sessionStorage.setItem('phonespot:last-activity',String(Date.now()-31*60*1000));window.trackStoreEvent('product_view',{productId:1});});await page.reload({waitUntil:'networkidle0'});
    assert.equal(events.filter(e=>e.event_type==='page_view').at(-1).visit_start,true);
    await page.evaluate(()=>localStorage.setItem('phoneSpotToken','admin-fixture'));const previousViews=events.filter(e=>e.event_type==='page_view').length;
    await page.goto(base+'/admin.html',{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.getElementById('traffic-total')?.textContent==='100');
    await page.$eval('.admin-nav a[onclick*="tab-stats"]',el=>el.click());
    assert.equal(await page.$eval('[data-device="mobile"] [data-count]',el=>el.textContent),'65');assert.equal(await page.$eval('[data-device="mobile"] [data-share]',el=>el.textContent),'65%');
    assert.equal(events.filter(e=>e.event_type==='page_view').length,previousViews,'Admin navigation is excluded from public visits');
    const bounds=await page.$eval('#traffic-panel',el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.equal(bounds.width,bounds.scroll);
    await page.$eval('#traffic-panel',el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:path.join(output,`panel-${width}.png`)});
    mode='empty';await page.click('#traffic-refresh');await page.waitForFunction(()=>document.getElementById('traffic-total').textContent==='0');assert.match(await page.$eval('#traffic-status',el=>el.textContent),/Todavía/);
    mode='error';await page.click('#traffic-refresh');await page.waitForFunction(()=>document.getElementById('traffic-status').textContent.includes('No pudimos'));assert.equal(await page.$eval('#traffic-data',el=>el.hidden),true);
    mode='normal';await page.click('#traffic-refresh');await page.waitForFunction(()=>document.getElementById('traffic-total').textContent==='100'&&!document.getElementById('traffic-data').hidden);
    const lastCalls=analyticsCalls;adminAllowed=false;await page.goto(base+'/admin.html',{waitUntil:'networkidle0'});await page.waitForFunction(()=>location.pathname.endsWith('/login.html'));assert.equal(analyticsCalls,lastCalls,'A client rejected by the guard never fetches private counts');
    assert.deepEqual(errors,[]);await context.close();
}
console.log('Visit sessions, admin-only loading, device distribution, empty/error/retry and desktop/mobile layouts passed.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
