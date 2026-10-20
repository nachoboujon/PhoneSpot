const {splitCommercialProduct, productPageUrl} = require('../public/product-commercial-types');
const {createHash} = require('node:crypto');
const variantName = variant => [variant.color,variant.capacity,variant.ram,variant.batt ? `Bat: ${variant.batt}` : null,variant.condition ? `Cond: ${variant.condition}` : null,variant.configuration ? `Config: ${variant.configuration}` : null].filter(Boolean).join(' - ');
function condition(value) {
    const text=String(value || '').toLowerCase();
    if (/reacondicionado|refurbished|\bcpo\b/.test(text)) return 'https://schema.org/RefurbishedCondition';
    if (/americano|swap|usado|seminuevo/.test(text)) return 'https://schema.org/UsedCondition';
    if (/nuevo|new|sellad/.test(text)) return 'https://schema.org/NewCondition';
    return undefined;
}
function productSeo(product, type, requestedVariant) {
    const base='https://www.phonespot.site';
    const options=splitCommercialProduct(product);
    const selected=options.find(entry=>entry.commercial_type===type) || options[0];
    const variants=selected.variants || [];
    const target=variants.find(entry=>variantName(entry)===requestedVariant);
    // One indexable URL per model. Type/color links still select the requested
    // option, while canonical, sitemap and ProductGroup agree on the model URL.
    const pageUrl=base+'/producto.html?id='+encodeURIComponent(product.id);
    const offer=(entry, variant, url) => ({'@type':'Offer',url,priceCurrency:'USD',price:Number(variant?.price || entry.price).toFixed(2),availability:Number(variant?.stock ?? entry.stock)>0 ? 'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:condition(variant?.condition || entry.commercial_label || entry.description)});
    const item=(entry,variant) => {
        const url=base+'/'+productPageUrl(entry)+(variant ? '&variant='+encodeURIComponent(variantName(variant)) : '');
        const sku=String(entry.id)+(variant ? '-'+createHash('sha256').update(entry.commercial_type+':'+variantName(variant)).digest('hex').slice(0,16) : '');
        return {'@type':'Product',name:entry.name+(variant ? ' · '+variantName(variant) : ''),sku,url,image:[new URL(variant?.image_url || entry.image_url || '/uploads/PhoneSpot-trans.png',base).href],description:String(entry.description || '').replace(/^\[Condición:[^\]]*\]\s*/,''),brand:{'@type':'Brand',name:entry.brand || 'PhoneSpot'},color:variant?.color,offers:offer(entry,variant,url)};
    };
    const groupItems=options.flatMap(entry=>entry.variants?.length ? entry.variants.map(variant=>item(entry,variant)) : [item(entry)]);
    // Do not declare a size variation when no size is supplied: Google treats
    // that as a required missing field on every variant. Storage is not a size.
    const variesBy=groupItems.every(item=>item.color) ? ['https://schema.org/color'] : undefined;
    const schema=groupItems.length>1 ? {'@context':'https://schema.org','@type':'ProductGroup',name:product.name,description:String(product.description || product.name).replace(/^\[Condición:[^\]]*\]\s*/,''),brand:{'@type':'Brand',name:product.brand || 'PhoneSpot'},productGroupID:String(product.id),url:pageUrl,variesBy,hasVariant:groupItems} : {'@context':'https://schema.org',...groupItems[0],url:pageUrl};
    return {selected, pageUrl, schema, image:new URL(target?.image_url || selected.image_url || '/uploads/PhoneSpot-trans.png',base).href};
}
module.exports={productSeo,condition};
