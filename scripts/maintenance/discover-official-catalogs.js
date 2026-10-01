const fs = require('node:fs');
const folder = 'artifacts/wholesale-2026-10-01/official-catalogs';
fs.mkdirSync(folder, {recursive:true});
const sites = ['store.blackview.hk','www.hotwav.com','oukitel.com','store.ulefone.com','www.ulefone.com','www.doogee.cc','www.doogeemall.com','shop.cubot.net'];
(async () => {
    await Promise.allSettled(sites.map(async site => {
        const response = await fetch(`https://${site}/products.json?limit=250`, {signal:AbortSignal.timeout(25000)});
        const body = await response.text();
        fs.writeFileSync(`${folder}/${site}.json`, body);
        try {const parsed=JSON.parse(body);console.log(site,response.status,parsed.products?.length ?? Object.keys(parsed));}
        catch {console.log(site,response.status,'not JSON',body.slice(0,50));}
    }));
})().catch(error=>{console.error(error);process.exitCode=1});
