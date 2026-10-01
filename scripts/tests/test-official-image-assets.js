const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../../public/uploads/official-products/manifest.json');
const source = require('../../artifacts/image-audit-products.json');
const {normalizeProductImages} = require('../../lib/product-images');
const {officialImage} = require('../../lib/official-product-images');
const root = path.resolve(__dirname, '../../public');
const identities = new Set();
for (const image of manifest.images) {
    assert.equal(new URL(image.source).hostname, 'store.storeimages.cdn-apple.com');
    assert.ok(!identities.has(`${image.model}|${image.color}`));
    identities.add(`${image.model}|${image.color}`);
    const bytes = fs.readFileSync(path.join(root, image.file));
    assert.equal(bytes.length, image.bytes);
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    let offset = 2, dimensions;
    while (offset + 9 < bytes.length) {
        const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
        if ([192, 193, 194].includes(marker)) {dimensions = {width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5)}; break;}
        assert.ok(length >= 2);
        offset += length + 2;
    }
    assert.deepEqual(dimensions, {width: image.width, height: image.height});
    assert.ok(dimensions.width >= 1080 && dimensions.height >= 1080);
    assert.ok(image.contentBounds && Math.max(dimensions.width * image.contentBounds.width, dimensions.height * image.contentBounds.height) >= 1080,
        `${image.model} / ${image.color}: the device itself needs useful HD detail`);
    assert.equal(image.thumbnail.width, 640);
    assert.equal(image.thumbnail.height, 640);
    assert.equal(fs.statSync(path.join(root, image.thumbnail.file)).size, image.thumbnail.bytes);
    assert.ok(image.thumbnail.bytes < image.bytes, 'Catalog image must weigh less than the detail image');
}
for (const product of source) {
    const before = structuredClone(product);
    const displayed = normalizeProductImages(product);
    assert.deepEqual(product, before, 'Read normalization must not mutate database input');
    displayed.variants.forEach((variant, index) => {
        const expected = officialImage(product.name, product.variants[index].color, product.variants[index].image_url);
        assert.equal(variant.image_url, expected);
        for (const field of ['stock', 'price', 'color', 'capacity', 'batt', 'condition']) assert.equal(variant[field], product.variants[index][field]);
    });
    const custom = 'https://ntjshkufiyjeaazvectn.supabase.co/storage/v1/object/public/uploads/custom-photo.jpg';
    assert.equal(officialImage(product.name, product.variants[0].color, custom), custom, 'New custom uploads take precedence');
    assert.equal(officialImage(product.name, product.variants[0].color, '/uploads/my-photo.jpg'), '/uploads/my-photo.jpg');
    const originalAdmin = normalizeProductImages(product, {official: false});
    assert.ok(originalAdmin.variants.every(variant => !variant.image_url.includes('/official-products/')));
}
assert.deepEqual(manifest.unresolved, [{model: 'iPhone 13 Pro Max', color: 'Rosa'}]);
console.log(`${manifest.images.length} official files validated at >=1080x1080; input data, prices, stock and custom/admin photos preserved. One unresolved color reported.`);
