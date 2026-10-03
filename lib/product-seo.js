const {splitCommercialProduct, productPageUrl} = require('../public/product-commercial-types');
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
    const pageUrl=base+'/'+productPageUrl(selected)+(target ? '&variant='+encodeURIComponent(variantName(target)) : '');
    const offer=(entry, variant, url) => ({'@type':'Offer',url,priceCurrency:'USD',price:Number(variant?.price || entry.price).toFixed(2),availability:Number(variant?.stock ?? entry.stock)>0 ? 'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:condition(variant?.condition || entry.commercial_label || entry.description)});
    const item=(entry,variant) => {
        const url=base+'/'+productPageUrl(entry)+(variant ? '&variant='+encodeURIComponent(variantName(variant)) : '');
        return {'@type':'Product',name:entry.name+(variant ? ' · '+variantName(variant) : ''),sku:String(entry.id)+(variant ? ':'+variantName(variant):''),url,image:[new URL(variant?.image_url || entry.image_url || '/uploads/PhoneSpot-trans.png',base).href],description:String(entry.description || '').replace(/^\[Condición:[^\]]*\]\s*/,''),brand:{'@type':'Brand',name:entry.brand || 'PhoneSpot'},color:variant?.color,offers:offer(entry,variant,url)};
    };
    const groupItems=options.flatMap(entry=>entry.variants?.length ? entry.variants.map(variant=>item(entry,variant)) : [item(entry)]);
    const schema=groupItems.length>1 ? {'@context':'https://schema.org','@type':'ProductGroup',name:product.name,productGroupID:String(product.id),url:pageUrl,variesBy:['https://schema.org/color','https://schema.org/size','https://schema.org/itemCondition'],hasVariant:groupItems} : {'@context':'https://schema.org',...groupItems[0]};
    return {selected, pageUrl, schema, image:new URL(target?.image_url || selected.image_url || '/uploads/PhoneSpot-trans.png',base).href};
}
module.exports={productSeo,condition};
