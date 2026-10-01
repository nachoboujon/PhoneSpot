const fs = require('node:fs');
const path = require('node:path');
const folder = path.resolve(__dirname, '../../public/uploads/official-products');
const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
async function main() {
    const queue = [...manifest.images];
    await Promise.all(Array.from({length: 5}, async () => {
        while (queue.length) {
            const image = queue.shift();
            for (const [size, kind] of [[1600, 'hd'], [640, 'card']]) {
                const url = new URL(image.source);
                url.searchParams.set('wid', String(size)); url.searchParams.set('hei', String(size)); url.searchParams.set('qlt', kind === 'hd' ? '88' : '85');
                const response = await fetch(url, {signal: AbortSignal.timeout(20000)});
                if (!response.ok) throw new Error(`${image.model}: HTTP ${response.status}`);
                const bytes = Buffer.from(await response.arrayBuffer());
                if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('Invalid JPEG');
                let offset = 2, dimensions;
                while (offset + 9 < bytes.length) {
                    const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
                    if ([192, 193, 194].includes(marker)) {dimensions = {width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5)}; break;}
                    offset += length + 2;
                }
                if (!dimensions || dimensions.width !== size || dimensions.height !== size) throw new Error('Unexpected image size');
                const filename = path.basename(image.file).replace(/-hd-v\d+\.jpg$/, `-${kind}-v3.jpg`);
                fs.writeFileSync(path.join(folder, filename), bytes);
                const metadata = {file: '/uploads/official-products/' + filename, source: url.href, ...dimensions, bytes: bytes.length};
                if (kind === 'hd') {Object.assign(image, metadata); delete image.contentBounds;} else image.thumbnail = metadata;
            }
        }
    }));
    fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log('73 masters at 1600px and 73 catalog images at 640px prepared');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
