const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Function to replace the start of product card divs with the injected data-stock-info attribute
s = s.replace(/<div class="product-card \$\{prod\.is_offer \? 'offer-card' : ''\}" data-id="\$\{prod\.id\}" data-price="\$\{prod\.price\}">/g, 
              `<div class="product-card \${prod.is_offer ? 'offer-card' : ''}" data-id="\${prod.id}" data-price="\${prod.price}" data-stock-info="\${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}">`);

s = s.replace(/<div class="product-card fade-up" data-id="\$\{prod\.id\}">/g, 
              `<div class="product-card fade-up" data-id="\${prod.id}" data-price="\${prod.price}" data-stock-info="\${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}">`);

s = s.replace(/<div class="product-card" data-id="\$\{prod\.id\}" style="/g, 
              `<div class="product-card" data-id="\${prod.id}" data-price="\${prod.price}" data-stock-info="\${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="`);

s = s.replace(/<div class="product-details" data-id="\$\{prod\.id\}" data-price="\$\{prod\.price\}" style="/g, 
              `<div class="product-details" data-id="\${prod.id}" data-price="\${prod.price}" data-stock-info="\${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="`);

s = s.replace(/<div class="hero-content" data-id="\$\{prod\.id\}" data-price="\$\{prod\.price\}">/g, 
              `<div class="hero-content" data-id="\${prod.id}" data-price="\${prod.price}" data-stock-info="\${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}">`);

// Update addToCart function
const oldAddToCart = `function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id && item.variant_name === product.variant_name);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }`;

const newAddToCart = `function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id && item.variant_name === product.variant_name);
    
    // Check max stock if available
    const maxStock = product.maxStock !== undefined ? product.maxStock : Infinity;
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + 1 > maxStock) {
        showToast('No hay más stock disponible de este producto', 'fa-triangle-exclamation');
        return;
    }

    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }`;

s = s.replace(oldAddToCart, newAddToCart);

// Update click listener
const oldListenerChunk = `            const img = imgEl ? imgEl.src : '';

            addToCart({id, name, price, img, variant_name: selectedVariant || null});
        }
    });`;

const newListenerChunk = `            const img = imgEl ? imgEl.src : '';
            
            // Evaluar stock máximo
            let maxStock = 1; // Fallback
            try {
                if (card.dataset.stockInfo) {
                    const info = JSON.parse(unescape(card.dataset.stockInfo));
                    if (selectedVariant && info.variants && info.variants.length > 0) {
                        const v = info.variants.find(vx => {
                            const vName = [vx.color, vx.capacity, vx.ram].filter(Boolean).join(' - ');
                            return vName === selectedVariant;
                        });
                        maxStock = v ? v.stock : 0;
                    } else {
                        maxStock = info.stock;
                    }
                }
            } catch(e) {
                console.error('Error parsing stock info', e);
            }

            addToCart({id, name, price, img, variant_name: selectedVariant || null, maxStock});
        }
    });`;

s = s.replace(oldListenerChunk, newListenerChunk);

// Update changeQuantity
const oldChangeQty = `function changeQuantity(id, newQuantity) {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = newQuantity;`;

const newChangeQty = `function changeQuantity(id, newQuantity) {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id);
    if (item) {
        const max = item.maxStock !== undefined ? item.maxStock : Infinity;
        if (newQuantity > max) {
            showToast('Límite de stock alcanzado', 'fa-triangle-exclamation');
            return;
        }
        item.quantity = newQuantity;`;

s = s.replace(oldChangeQty, newChangeQty);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed stock limit checking');
