// Replace PDF images previously uploaded with invalid JPEG bodies.
// Usage: node scripts/maintenance/repair-iphone-images.js --apply
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ quiet: true });
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'artifacts/iphone-list-images');
const files = fs.readdirSync(dir).filter(name => /^iphone-p\d{2}-\d{2}\.jpg$/.test(name));
if (files.length !== 156) throw new Error(`Expected 156 files, got ${files.length}`);
for (const name of files) {
    const bytes = fs.readFileSync(path.join(dir, name));
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error(`Invalid JPEG: ${name}`);
}
if (!process.argv.includes('--apply')) {
    console.log(`${files.length} valid JPEG files ready to upload.`);
    process.exit(0);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
let cursor = 0;
let completed = 0;
async function worker() {
    while (cursor < files.length) {
        const name = files[cursor++];
        const { error } = await supabase.storage.from('uploads')
            .upload(`iphone-americano-2026-09-28/${name}`, fs.readFileSync(path.join(dir, name)), {
                contentType: 'image/jpeg', upsert: true, cacheControl: '0'
            });
        if (error) throw new Error(`${name}: ${error.message}`);
        completed += 1;
        if (completed % 25 === 0 || completed === files.length) console.log(`Repaired ${completed}/${files.length}`);
    }
}
Promise.all(Array.from({ length: 6 }, worker)).catch(error => { console.error(error); process.exitCode = 1; });
