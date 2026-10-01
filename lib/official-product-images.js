// Presentation-only replacements for known provider photos. No database writes.
const manifest = require('../public/uploads/official-products/manifest.json');
const images = new Map(manifest.images.map(image => [`${image.model}|${image.color}`, image.file]));
function officialImage(model, color, original) {
    if (!original) return original;
    let url;
    try {url = new URL(original);} catch (_) {return original;}
    // Preserve custom photos uploaded by the administrator.
    if (url.hostname !== 'ntjshkufiyjeaazvectn.supabase.co' ||
        !/^\/storage\/v1\/object\/public\/uploads\/(iphone-americano-2026-09-28|tecno-mayorista-2026-09-28)\//.test(url.pathname)) return original;
    return images.get(`${model}|${color}`) || original;
}
module.exports = {officialImage};
