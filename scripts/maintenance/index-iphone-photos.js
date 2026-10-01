// Index exact file contents, not approximate visual similarity.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const folder = path.join(root, 'artifacts/iphone-list-images');
const files = fs.readdirSync(folder).filter(name => /^iphone-p\d{2}-\d{2}\.jpg$/.test(name)).sort();
if (!files.length) throw new Error('No source photos found');
const identities = Object.fromEntries(files.map(name => [name,
    crypto.createHash('sha256').update(fs.readFileSync(path.join(folder, name))).digest('hex')]));
fs.writeFileSync(path.join(root, 'data/iphone-photo-fingerprints.json'), JSON.stringify(identities, null, 2) + '\n');
console.log(`${files.length} files, ${new Set(Object.values(identities)).size} distinct photos`);
