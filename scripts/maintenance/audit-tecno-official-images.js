// Read-only manufacturer audit; reports native image dimensions without upscaling.
const fs = require('node:fs');
const rows = require('../../artifacts/tecno-import-manifest.json').entries;
async function main() {
    const findings = [];
    for (const model of [...new Set(rows.map(row => row.model))]) {
        const slug = model.replace(/^Tecno /, '').toLowerCase().replace(/ /g, '-');
        const page = `https://www.tecno-mobile.com/phones/tech-specs/techspecs/${slug}/`;
        const response = await fetch(page, {signal: AbortSignal.timeout(15000)});
        const html = await response.text();
        const tags = html.match(/<img[^>]*class="figure-img"[^>]*>/gs) || [];
        const photos = [];
        for (const tag of tags) {
            const source = tag.match(/src=['"]([^'"]+)/)?.[1];
            const color = tag.match(/alt=['"]([^'"]+)/)?.[1];
            if (!source) continue;
            const image = await fetch(source, {signal: AbortSignal.timeout(15000)});
            if (!image.ok) continue;
            const bytes = Buffer.from(await image.arrayBuffer());
            if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') continue;
            const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
            photos.push({color, source, width, height});
        }
        findings.push({model, page, photos});
        console.log(model, photos.map(photo => `${photo.color}: ${photo.width}x${photo.height}`).join(', ') || 'No native PNG found');
    }
    fs.writeFileSync('artifacts/tecno-official-resolution-audit.json', JSON.stringify(findings, null, 2) + '\n');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
