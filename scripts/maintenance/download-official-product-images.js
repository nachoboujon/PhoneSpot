// Downloads manufacturer assets locally; never connects to the database.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const products = require('../../artifacts/image-audit-products.json');
const folder = path.join(root, 'public/uploads/official-products');
fs.mkdirSync(folder, {recursive: true});
function dimensions(bytes) {
    if (bytes[0] !== 255 || bytes[1] !== 216) return null;
    let offset = 2;
    while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 255) return null;
        const marker = bytes[offset + 1];
        const length = bytes.readUInt16BE(offset + 2);
        if ([192, 193, 194].includes(marker)) return {width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5)};
        if (length < 2) return null;
        offset += length + 2;
    }
    return null;
}
const slug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
function candidates(model, color) {
    const generation = Number(model.match(/\d+/)[0]);
    const pro = model.includes('Pro');
    const names = {Negro: pro && generation <= 13 ? 'graphite' : 'black', Blanco: pro ? 'silver' : generation >= 13 && generation <= 14 ? 'starlight' : 'white',
        Plata: 'silver', Oro: 'gold', Verde: pro ? 'alpinegreen' : 'green', Azul: pro && generation === 12 ? 'pacificblue' : pro && generation === 13 ? 'sierrablue' : 'blue',
        Morado: pro ? 'deeppurple' : 'purple', Rosa: 'pink', Rojo: 'red', Amarillo: 'yellow', Naranja: 'cosmic-orange',
        'Titanio Natural': 'natural-titanium', 'Titanio Negro': 'black-titanium', 'Titanio Blanco': 'white-titanium', 'Titanio Azul': 'blue-titanium', 'Titanio del Desierto': 'desert-titanium'};
    if (pro && generation === 13 && color === 'Rosa') return [];
    let officialColor = names[color];
    if (!officialColor) return [];
    if (generation === 17 && pro && color === 'Azul') officialColor = 'deepblue';
    if (generation === 17 && pro && color === 'Naranja') officialColor = 'cosmicorange';
    if (pro && color.startsWith('Titanio')) officialColor = officialColor.replace('-', '');
    if (pro && [12, 13].includes(generation) && color === 'Azul') officialColor = 'blue';
    if (pro && generation === 13 && color === 'Verde') officialColor = 'green';
    if (pro && generation === 14 && color === 'Negro') officialColor = 'spaceblack';
    if (generation === 16 && !pro && color === 'Azul') officialColor = 'ultramarine';
    if (!pro && color === 'Negro' && [13, 14].includes(generation)) officialColor = 'midnight';
    const base = slug(model);
    const year = 2008 + generation;
    return [...(generation === 12 && color === 'Morado' ? ['iphone-12-purple-select-2021'] : []), `${base}-${officialColor}-select`, `${base}-finish-select-${officialColor}-${year}09`, `${base}-${officialColor}-${year}09`, `${base}-${officialColor}-select-${year}09`, `${base}-${officialColor}`, `${base}-${officialColor}-select-${year}`, `${base}-${officialColor}-${year}`, `${base}-${officialColor}-hero`,
        `refurb-${base}-${officialColor}-${year + 1}09`, `refurb-${base}-${officialColor}-${year + 1}12`];
}
async function main() {
    const manifestPath = path.join(folder, 'manifest.json');
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {images: [], unresolved: []};
    manifest.unresolved = [];
    async function downloadProduct(product) {
        for (const color of [...new Set(product.variants.map(variant => variant.color))]) {
            if (manifest.images.some(image => image.model === product.name && image.color === color)) continue;
            let found = false;
            for (const asset of candidates(product.name, color).flatMap(asset => ['4982', '1'].map(host => ({asset, host})))) {
                const url = `https://store.storeimages.cdn-apple.com/${asset.host}/as-images.apple.com/is/${asset.asset}?wid=1200&hei=1200&fmt=jpeg&qlt=90`;
                try {
                    const response = await fetch(url, {signal: AbortSignal.timeout(12000)});
                    if (!response.ok) continue;
                    const bytes = Buffer.from(await response.arrayBuffer());
                    const size = dimensions(bytes);
                    if (!size || size.width < 1080 || size.height < 1080) continue;
                    const filename = `${slug(product.name)}-${slug(color)}.jpg`;
                    fs.writeFileSync(path.join(folder, filename), bytes);
                    manifest.images.push({model: product.name, color, file: `/uploads/official-products/${filename}`, source: url, ...size, bytes: bytes.length});
                    console.log(`OK ${product.name} / ${color}: ${asset.asset}`);
                    found = true;
                    break;
                } catch (error) { console.log(`Fetch failed: ${asset}: ${error.message}`); }
            }
            if (!found) {manifest.unresolved.push({model: product.name, color}); console.log(`MISSING ${product.name} / ${color}`);}
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
        }
    }
    const queue = products.filter(product => /^iPhone /.test(product.name));
    await Promise.all(Array.from({length: 4}, async () => {while (queue.length) await downloadProduct(queue.shift());}));
    console.log(`${manifest.images.length} official assets, ${manifest.unresolved.length} unresolved colors`);
}
main().catch(error => {console.error(error); process.exitCode = 1;});
