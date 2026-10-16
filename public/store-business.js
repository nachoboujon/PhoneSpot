(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.PhoneSpotBusiness = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
    const tiers = [{quantity: 3, discount: 5}, {quantity: 5, discount: 7}, {quantity: 10, discount: 10}];
    function eligible(item) {
        if (!item) return false;
        const category = String(item.category || '').toLowerCase().trim();
        return category === 'celulares';
    }
    const discount = quantity => tiers.reduce((value, tier) => quantity >= tier.quantity ? tier.discount : value, 0);
    const unitPrice = (price, quantity, item) => eligible(item) ? Math.max(1, Number(price) - discount(quantity)) : Number(price);
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const searchText = value => normalize(value).replace(/(\d)\s+(gb|tb|ml)\b/g, '$1$2');
    const matches = (product, query) => searchText(query).trim().split(/\s+/).every(word => searchText([product.name, product.brand, product.category, ...(product.variants || []).flatMap(v => [v.capacity, v.ram, v.configuration, v.color])].join(' ')).includes(word));
    function catalogCategory(product) {
        const name=normalize(product.name);
        if(/playstation|\bxbox\b|nintendo|\bps[45]\b/.test(name)) return 'consolas';
        if (/\b(?:smart[\s-]*band|mi[\s-]+band|(?:huawei|honor)\s+band|galaxy\s+fit)\s*\d/i.test(name) && !/\b(?:correa|malla|cargador|protector|funda|cable)\b/.test(name)) return 'relojes';
        if(/\bwatch\b|reloj|smartwatch/.test(name)) return 'relojes';
        if(/auricular|airpod|earphone|headphone|parlante|speaker|\bjbl\b/.test(name)) return 'audio';
        return normalize(product.category) || 'accesorios';
    }
    const dimension = value => String(value || '').trim().replace(/^(\d+(?:[.,]\d+)?)\s*(gb|tb|ml)$/i, (_, n, unit) => n.replace(',', '.') + (unit.toLowerCase() === 'ml' ? ' ml' : unit.toUpperCase()));
    function conditionOf(product, variant) {
        if (product.commercial_type === 'apple_warranty') return 'apple_warranty';
        if (product.commercial_type === 'americano') return 'swap_americano';
        const text = normalize(variant.condition || product.name + ' ' + (product.description || ''));
        return /reacondicionado|refurbished|\bcpo\b/.test(text) ? 'reacondicionado' : /swap|americano|usado|seminuevo/.test(text) ? 'swap_americano' : 'nuevo';
    }
    // A match must describe one real variant, rather than mixing RAM from one
    // variant with capacity, price or stock from another.
    function catalogCandidates(product, state, omit = '') {
        if (omit !== 'categories' && state.categories?.length && !state.categories.includes(catalogCategory(product))) return [];
        if (omit !== 'brands' && state.brands?.length && !state.brands.includes(normalize(product.brand).trim())) return [];
        if (omit !== 'offer' && state.offer && !product.is_offer) return [];
        const variants = product.variants?.length ? product.variants : [{price: product.price, stock: product.stock}];
        return variants.filter(v => {
            if (!matches({...product, variants: [v]}, state.query || '')) return false;
            if (omit !== 'conditions' && state.conditions?.length && !state.conditions.includes(conditionOf(product, v))) return false;
            if (omit !== 'capacity' && state.capacity && dimension(v.capacity) !== dimension(state.capacity)) return false;
            if (omit !== 'ram' && state.ram && dimension(v.ram) !== dimension(state.ram)) return false;
            if (omit !== 'stock' && state.stock && !(Number(v.stock) > 0)) return false;
            const price = Number(v.price ?? product.price) * (state.rate || 1);
            return (omit === 'price' || ((!state.min || price >= Number(state.min)) && (!state.max || price <= Number(state.max))));
        });
    }
    function catalogFacets(products, state, key) {
        const counts = new Map();
        products.forEach(product => {
            const variants = catalogCandidates(product, state, key);
            if (!variants.length) return;
            let values;
            if (key === 'brands') values = [String(product.brand || '').trim()];
            else if (key === 'conditions') values = variants.map(v => conditionOf(product, v));
            else if (key === 'categories') values = [catalogCategory(product)];
            else values = variants.map(v => dimension(v[key]));
            const seen = new Set();
            values.filter(Boolean).forEach(label => {
                const value = key === 'brands' ? normalize(label).trim() : label;
                if (seen.has(value)) return;
                seen.add(value);
                const entry = counts.get(value) || {value, label, count: 0};
                entry.count++; counts.set(value, entry);
            });
        });
        return [...counts.values()].sort((a,b) => a.label.localeCompare(b.label, 'es', {numeric:true}));
    }
    return {tiers, eligible, discount, unitPrice, normalize, matches, catalogCategory, dimension, conditionOf, catalogCandidates, catalogFacets};
});
