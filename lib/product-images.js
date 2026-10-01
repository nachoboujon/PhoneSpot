const identities = require('../data/iphone-photo-fingerprints.json');

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

function normalizeProductImages(product) {
    const canonical = new Map();
    const normalize = url => {
        if (!url) return url;
        const key = photoKey(url);
        if (!canonical.has(key)) canonical.set(key, url);
        return canonical.get(key);
    };
    const image_url = normalize(product.image_url);
    const variants = (Array.isArray(product.variants) ? product.variants : []).map(variant => {
        const url = normalize(variant.image_url);
        return {...variant, image_url: url, ...(url ? {photo_key: photoKey(url)} : {})};
    });
    const images = [...new Set([
        image_url,
        ...(Array.isArray(product.images) ? product.images.map(normalize) : []),
        ...variants.map(variant => variant.image_url)
    ].filter(Boolean))];
    return {...product, image_url, images, variants};
}

module.exports = {photoKey, normalizeProductImages};
