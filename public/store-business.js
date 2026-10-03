(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.PhoneSpotBusiness = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
    const tiers = [{quantity: 3, discount: 5}, {quantity: 5, discount: 7}, {quantity: 10, discount: 10}];
    function eligible(item) {
        if (!item) return false;
        const category = String(item.category || '').toLowerCase().trim();
        if (category === 'accesorios') return false;
        if (['celulares', 'notebooks', 'tablets'].includes(category)) return true;
        return !/funda|case|cable|cargador|charger|auricular|earphones|airpod|vidrio|templado|protector|hidrogel|adaptador|powerbank|magsafe|correa|malla|accesorio/.test(String(item.name || '').toLowerCase());
    }
    const discount = quantity => tiers.reduce((value, tier) => quantity >= tier.quantity ? tier.discount : value, 0);
    const unitPrice = (price, quantity, item) => eligible(item) ? Math.max(1, Number(price) - discount(quantity)) : Number(price);
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const matches = (product, query) => normalize(query).trim().split(/\s+/).every(word => normalize([product.name, product.brand, product.category, ...(product.variants || []).flatMap(v => [v.capacity, v.ram, v.configuration, v.color])].join(' ')).includes(word));
    function catalogCategory(product) {
        const name=normalize(product.name);
        if(/playstation|\bxbox\b|nintendo|\bps[45]\b/.test(name)) return 'consolas';
        if(/\bwatch\b|reloj|smartwatch/.test(name)) return 'relojes';
        if(/auricular|airpod|earphone|headphone|parlante|speaker|\bjbl\b/.test(name)) return 'audio';
        return normalize(product.category) || 'accesorios';
    }
    return {tiers, eligible, discount, unitPrice, normalize, matches, catalogCategory};
});
