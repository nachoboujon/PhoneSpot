(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else Object.assign(root, api);
})(typeof window === 'undefined' ? globalThis : window, () => {
    const text = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const labels = {americano: 'Americano', apple_warranty: 'Garantía oficial de Apple'};
    function commercialType(product, variant) {
        const condition = text(variant?.condition);
        if (/garantia.*apple|apple.*garantia/.test(condition)) return 'apple_warranty';
        if (/americano/.test(condition)) return 'americano';
        // Explicit variant conditions take priority over the imported record's generic description.
        if (/americano/.test(text(product.description))) return 'americano';
        if (/garantia.*apple|apple.*garantia/.test(text(product.description))) return 'apple_warranty';
        return 'standard';
    }
    function splitCommercialProduct(product) {
        if (product.commercial_type) return [product];
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const groups = new Map();
        for (const variant of variants) {
            const type = commercialType(product, variant);
            if (!groups.has(type)) groups.set(type, []);
            groups.get(type).push(variant);
        }
        if (!variants.length) groups.set(commercialType(product), []);
        return [...groups].map(([type, entries]) => {
            const label = labels[type] || (groups.size > 1 ? 'Otras condiciones' : '');
            const prices = entries.filter(v => Number(v.stock) > 0).map(v => Number(v.price)).filter(Number.isFinite);
            const allPrices = entries.map(v => Number(v.price)).filter(Number.isFinite);
            const images = [...new Set(entries.map(v => v.image_url).filter(Boolean))];
            const description = type === 'apple_warranty'
                ? `[Condición: ${label}] ${String(product.description || product.name).replace(/^\[Condición:[^\]]*\]\s*/i, '').replace(/\bamericano\b/gi, 'con garantía oficial de Apple')}`
                : product.description;
            return {...product, name: label ? `${product.name} · ${label}` : product.name, base_name: product.name,
                description, commercial_type: type, commercial_label: label,
                favorite_key: type === 'americano' || groups.size === 1 ? String(product.id) : `${product.id}:${type}`,
                variants: entries,
                stock: entries.length ? entries.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0) : product.stock,
                price: (prices.length ? Math.min(...prices) : allPrices.length ? Math.min(...allPrices) : product.price),
                image_url: images[0] || product.image_url, images: images.length ? images : product.images};
        });
    }
    const expandCommercialProducts = products => products.flatMap(splitCommercialProduct);
    const productPageUrl = product => `producto.html?id=${encodeURIComponent(product.id)}${product.commercial_type ? `&tipo=${product.commercial_type}` : ''}`;
    return {splitCommercialProduct, expandCommercialProducts, productPageUrl};
});
