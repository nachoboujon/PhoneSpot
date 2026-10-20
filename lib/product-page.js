const escapeHtml = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

function renderProductPage(template, product, seo) {
    const selected = seo.selected;
    const description = String(selected.description || selected.name).replace(/^\[Condición:[^\]]*\]\s*/i, '');
    const title = `${selected.name}${selected.commercial_label ? ' · ' + selected.commercial_label : ''} | PhoneSpot`;
    const metadata = `
        <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
        <link rel="canonical" href="${escapeHtml(seo.pageUrl)}">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}">
        <meta property="og:image" content="${escapeHtml(seo.image)}">
        <meta property="og:url" content="${escapeHtml(seo.pageUrl)}">
        <meta name="twitter:card" content="summary_large_image">
        <script type="application/ld+json">${JSON.stringify(seo.schema).replace(/</g, '\\u003c')}</script>
    `;
    const content = `<div class="product-detail-surface"><article class="product-details">
        <div class="product-gallery"><div class="product-gallery-main"><img src="${escapeHtml(seo.image)}" alt="${escapeHtml(selected.name)}" fetchpriority="high" decoding="async"></div></div>
        <div class="product-info">
            <h1>${escapeHtml(selected.name)}</h1>
            ${selected.commercial_label ? `<p>${escapeHtml(selected.commercial_label)}</p>` : ''}
            <p class="price">USD ${escapeHtml(Number(selected.price).toFixed(2))}</p>
            <p>${Number(selected.stock) > 0 ? 'Disponible' : 'Agotado'}</p>
            <p class="product-description">${escapeHtml(description)}</p>
            ${selected.variants?.length ? `<h2>Opciones del producto</h2><ul>${selected.variants.map(v => `<li>${escapeHtml([v.color, v.capacity, v.ram, v.configuration, v.condition].filter(Boolean).join(' · '))} — USD ${escapeHtml(Number(v.price ?? selected.price).toFixed(2))} · ${Number(v.stock) > 0 ? 'Disponible' : 'Agotado'}</li>`).join('')}</ul>` : ''}
            <p><a href="catalogo.html">Ver catálogo de productos</a></p>
        </div>
    </article></div>`;
    return template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace('</head>', metadata + '</head>')
        .replace(/<div id="single-product-container">[\s\S]*?<\/div>/, `<div id="single-product-container" data-server-rendered="true">${content}</div>`);
}

function productErrorPage(message) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(message)} | PhoneSpot</title></head><body><main><h1>${escapeHtml(message)}</h1><p><a href="/catalogo.html">Explorar el catálogo de PhoneSpot</a></p></main></body></html>`;
}

module.exports = {renderProductPage, productErrorPage};
