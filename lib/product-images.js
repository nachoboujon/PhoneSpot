const identities = require('../data/iphone-photo-fingerprints.json');
const {officialImage} = require('./official-product-images');

function photoKey(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        const match = parsed.pathname.match(/^\/storage\/v1\/object\/public\/uploads\/iphone-americano-2026-09-28\/(iphone-p\d{2}-\d{2}\.jpg)$/);
        if (parsed.hostname === 'ntjshkufiyjeaazvectn.supabase.co' && match && identities[match[1]]) {
            return `sha256:${identities[match[1]]}`;
        }
    } catch (_) { /* Other local and remote URLs are compared literally. */ }
    return url;
}

function normalizeProductImages(product, options = {}) {
    const originalVariants = Array.isArray(product.variants) ? product.variants : [];
    const displayImage = (color, url) => options.official === false ? url : officialImage(product.name, color, url);
    const replacements = new Map(originalVariants.map(variant => [variant.image_url,
        displayImage(variant.color, variant.image_url)]));
    const canonical = new Map();
    const normalize = url => {
        if (!url) return url;
        const key = photoKey(url);
        if (!canonical.has(key)) canonical.set(key, url);
        return canonical.get(key);
    };
    const image_url = normalize(replacements.get(product.image_url) || product.image_url);
    const variants = (Array.isArray(product.variants) ? product.variants : []).map(variant => {
        const url = normalize(displayImage(variant.color, variant.image_url));
        return {...variant, image_url: url, ...(url ? {photo_key: photoKey(url)} : {})};
    });
    const images = [...new Set([
        image_url,
        ...(Array.isArray(product.images) ? product.images.map(url => normalize(replacements.get(url) || url)) : []),
        ...variants.map(variant => variant.image_url)
    ].filter(Boolean))];
    return {...product, image_url, images, variants};
}

module.exports = {photoKey, normalizeProductImages};
