// Read-only verification of every URL in the live sitemap.
const fs = require('node:fs');
const path = require('node:path');
const base = process.argv[2] || 'https://www.phonespot.site';
const output = path.resolve(__dirname, '../../artifacts/seo-2026-10-20/live-verification.json');
async function main() {
    const sitemap = await fetch(base + '/sitemap.xml', {signal: AbortSignal.timeout(20000)});
    if (!sitemap.ok) throw new Error('Sitemap HTTP ' + sitemap.status);
    const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
    if (!urls.length || new Set(urls).size !== urls.length) throw new Error('Empty or duplicate sitemap URLs');
    const results = [];
    let cursor = 0;
    async function worker() {
        while (cursor < urls.length) {
            const url = urls[cursor++];
            const problems = [];
            try {
                const r = await fetch(url.replace('https://www.phonespot.site', base), {signal: AbortSignal.timeout(20000), redirect: 'manual'});
                const html = await r.text();
                if (r.status !== 200) problems.push('HTTP ' + r.status);
                const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, '&');
                if (canonical !== url) problems.push('Canonical mismatch: ' + canonical);
                const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
                if (!title || title.includes('Detalle del Producto')) problems.push('Missing/ generic title');
                if (url.includes('/producto.html')) {
                    if (!html.includes('data-server-rendered="true"') || html.includes('Cargando producto...')) problems.push('Missing initial product content');
                    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || '{}');
                    if (schema.url !== canonical) problems.push('Structured data URL mismatch');
                }
                results.push({url, status:r.status, title, canonical, problems});
            } catch (error) { results.push({url, problems:[error.message]}); }
        }
    }
    await Promise.all(Array.from({length:6}, worker));
    const failures = results.filter(r => r.problems.length);
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output, JSON.stringify({checkedAt:new Date().toISOString(), total:urls.length, passed:results.length - failures.length, failures, results}, null, 2));
    console.log(JSON.stringify({total:urls.length, passed:results.length - failures.length, failures, output}));
    if (failures.length) process.exitCode = 1;
}
main().catch(error => {console.error(error); process.exitCode = 1;});
