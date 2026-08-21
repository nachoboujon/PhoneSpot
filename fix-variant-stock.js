const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const variantLogic = `
                    // checkVariantStock injected
                    window.checkVariantStock = (prod) => {
                        const selectedColor = document.getElementById('selected-color')?.value;
                        const selectedCap = document.getElementById('selected-capacity')?.value;
                        
                        let stockToUse = prod.stock;
                        let variantName = '';
                        
                        let variants = [];
                        try { variants = typeof prod.variants === 'string' ? JSON.parse(prod.variants) : prod.variants; } catch(e){}
                        if (!variants || !Array.isArray(variants)) variants = [];
                        
                        if (variants.length > 0 && selectedColor && selectedCap) {
                            const v = variants.find(x => x.color === selectedColor && x.capacity === selectedCap);
                            if (v) {
                                stockToUse = parseInt(v.stock);
                                variantName = \`\${v.color} - \${v.capacity} - \${v.ram}\`;
                            } else {
                                stockToUse = 0; // combination doesn't exist
                            }
                        }

                        const btn = document.getElementById('add-to-cart-detail');
                        const stockLabel = document.getElementById('stock-label');
                        if (!btn) return;
                        
                        if (stockToUse <= 0) {
                            btn.innerText = 'Sin Stock de esta variante';
                            btn.disabled = true;
                            btn.style.background = '#ccc';
                            btn.style.cursor = 'not-allowed';
                            if (stockLabel) stockLabel.innerHTML = '<span style="color:#e74c3c;font-weight:bold;">Agotado</span>';
                        } else {
                            btn.innerText = 'Añadir al Carrito';
                            btn.disabled = false;
                            btn.style.background = 'var(--text-color)';
                            btn.style.cursor = 'pointer';
                            if (stockLabel) stockLabel.innerHTML = \`<span style="color:#2ecc71;font-weight:bold;">¡Stock disponible (\${stockToUse})!</span>\`;
                        }
                        
                        window.currentVariantStock = stockToUse;
                        window.currentVariantName = variantName;
                    };
                    
                    window.checkVariantStock(prod);
`;

s = s.replace(/checkVariantStock\(prod\);/g, "window.checkVariantStock(prod);");

if (!s.includes('window.checkVariantStock =')) {
    s = s.replace(/\/\/ Inicializar estilos de botones active/, variantLogic + '\n                    // Inicializar estilos de botones active');
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Injected checkVariantStock');
}
