// Fetch larger manufacturer originals; no image synthesis or database writes.
const fs = require('node:fs');
const path = require('node:path');
const folder = path.resolve(__dirname, '../../public/uploads/official-products');
const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
async function main() {
    const queue = manifest.images.filter(image => !image.contentBounds || image.height * image.contentBounds.height < 1080);
    await Promise.all(Array.from({length: 5}, async () => {
        while (queue.length) {
            const image = queue.shift();
            const url = new URL(image.source);
            if (image.model.includes('17')) {
                const model = image.model.toLowerCase().replace(/ /g, '-');
                const color = {Negro: 'black', Azul: 'deepblue', Naranja: 'cosmicorange'}[image.color];
                url.pathname = `/1/as-images.apple.com/is/${model}-finish-select-${color}-202509`;
            }
            if (/iPhone 1[23]/.test(image.model)) {
                const model = image.model.toLowerCase().replace(/ /g, '-');
                const asset = url.pathname.split('/is/')[1];
                const color = asset.split(model + '-')[1].split('-')[0];
                const year = image.model.includes('12') ? (image.color === 'Morado' ? '2021' : '2020') : image.model.includes('mini') ? '2022' : '2023';
                url.pathname = `/4982/as-images.apple.com/is/refurb-${model}-${color}-${year}`;
            }
            url.searchParams.set('wid', '2400'); url.searchParams.set('hei', '2400');
            const response = await fetch(url, {signal: AbortSignal.timeout(20000)});
            if (!response.ok) {console.log(`Keep existing: ${image.model} / ${image.color}: ${response.status}`); continue;}
            const bytes = Buffer.from(await response.arrayBuffer());
            if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('Expected JPEG');
            let offset = 2, size;
            while (offset + 9 < bytes.length) {
                const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
                if ([192, 193, 194].includes(marker)) {size = {width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5)}; break;}
                offset += length + 2;
            }
            if (!size || Math.min(size.width, size.height) < 1080) throw new Error('Insufficient source resolution');
            const filename = path.basename(image.file).replace(/(?:-hd-v2)?\.jpg$/, '-hd-v2.jpg');
            fs.writeFileSync(path.join(folder, filename), bytes);
            Object.assign(image, {file: '/uploads/official-products/' + filename, source: url.href, ...size, bytes: bytes.length});
            delete image.contentBounds;
            console.log(`${image.model} / ${image.color}: ${size.width}x${size.height}`);
        }
    }));
    fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
