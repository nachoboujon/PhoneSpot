// Measures whitespace in the official files, without editing images or data.
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
async function main() {
    const manifestPath = path.resolve(__dirname, '../../public/uploads/official-products/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const browser = await puppeteer.launch({headless: true});
    try {
        const page = await browser.newPage();
        for (const image of manifest.images) {
            const file = path.resolve(__dirname, '../../public', '.' + image.file);
            const bytes = fs.readFileSync(file);
            image.contentBounds = await page.evaluate(async base64 => {
                const img = new Image();
                img.src = 'data:image/jpeg;base64,' + base64;
                await img.decode();
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d', {willReadFrequently: true});
                ctx.drawImage(img, 0, 0);
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                let left = canvas.width, right = 0, top = canvas.height, bottom = 0;
                for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x += 2) {
                    const i = (y * canvas.width + x) * 4;
                    if (Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 235) {
                        left = Math.min(left, x); right = Math.max(right, x);
                        top = Math.min(top, y); bottom = Math.max(bottom, y);
                    }
                }
                return {left: left / canvas.width, top: top / canvas.height,
                    width: (right - left + 2) / canvas.width, height: (bottom - top + 2) / canvas.height};
            }, bytes.toString('base64'));
        }
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
        console.log(manifest.images.filter(image => image.contentBounds.height < .6).map(image => ({model: image.model, color: image.color, bounds: image.contentBounds})));
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
