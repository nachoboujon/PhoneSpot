// Fit the visible device, rather than the white canvas, inside its frame.
(() => {
    const observed = new WeakSet();
    const frames = new ResizeObserver(entries => entries.forEach(entry => entry.target.querySelectorAll('img.image-framed').forEach(fit)));
    let bounds = new Map();
    function fit(img) {
        const content = bounds.get(new URL(img.src, location.href).pathname);
        if (!content || !img.naturalWidth) {img.classList.remove('image-framed'); return;}
        const frame = img.closest('.product-img-wrapper, .product-gallery-main') || img.parentElement;
        const width = frame.clientWidth, height = frame.clientHeight;
        if (!width || !height) return;
        const inset = Math.min(24, width * .06);
        const scale = Math.min((width - inset * 2) / (img.naturalWidth * content.width),
            (height - inset * 2) / (img.naturalHeight * content.height));
        const displayWidth = img.naturalWidth * scale, displayHeight = img.naturalHeight * scale;
        img.style.setProperty('--image-width', displayWidth + 'px');
        img.style.setProperty('--image-height', displayHeight + 'px');
        img.style.setProperty('--image-left', ((width - displayWidth * content.width) / 2 - displayWidth * content.left) + 'px');
        img.style.setProperty('--image-top', ((height - displayHeight * content.height) / 2 - displayHeight * content.top) + 'px');
        frame.classList.add('official-image-frame');
        img.classList.add('image-framed');
        if (!observed.has(frame)) {frames.observe(frame); observed.add(frame);}
    }
    function scan(root = document) {
        const images = [...root.querySelectorAll('.product-img, #main-product-img')];
        if (root.matches?.('.product-img, #main-product-img')) images.push(root);
        images.forEach(img => {if (!observed.has(img)) {img.addEventListener('load', () => fit(img)); observed.add(img);} fit(img);});
    }
    fetch('/uploads/official-products/manifest.json').then(response => {
        if (!response.ok) throw new Error('Image framing unavailable');
        return response.json();
    }).then(manifest => {
        bounds = new Map(manifest.images.filter(image => image.contentBounds).flatMap(image => [[image.file, image.contentBounds], ...(image.thumbnail ? [[image.thumbnail.file, image.contentBounds]] : [])]));
        scan();
        new MutationObserver(records => records.forEach(record => {
            if (record.type === 'attributes') fit(record.target);
            else record.addedNodes.forEach(node => {if (node.nodeType === 1) scan(node);});
        })).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['src']});
    }).catch(() => {}); // The normal contain layout remains available when offline.
})();
