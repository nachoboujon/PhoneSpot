(() => {
    const business = window.PhoneSpotBusiness;
    const usd = value => 'USD ' + Number(value).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const setText = (node, value) => {if (node && node.textContent !== value) node.textContent = value;};
    function priceReference(container) {
        if (!container) return;
        const price = Number(container.dataset.price);
        const anchor = container.querySelector('#dynamic-price, .card-price');
        if (!anchor || !Number.isFinite(price)) return;
        let reference = container.querySelector('.price-reference');
        if (!reference) { reference=document.createElement('small'); reference.className='price-reference'; anchor.insertAdjacentElement('afterend',reference); }
        setText(reference, `${usd(price)} · ARS por unidad`);
        if (!container.classList.contains('product-details')) return;
        const volume = document.getElementById('product-volume-prices');
        if (volume) setText(volume, business.eligible({category:container.dataset.category})
            ? business.tiers.map(tier => `Desde ${tier.quantity}: ${usd(business.unitPrice(price,tier.quantity,{category:container.dataset.category}))} c/u`).join(' · ')
            : 'Este producto no participa del descuento mayorista, exclusivo para celulares.');
        const quantity=document.getElementById('product-quantity');
        if (quantity) { const stock=Number(container.dataset.variantStock || JSON.parse(unescape(container.dataset.stockInfo || '%7B%7D')).stock || 0); quantity.max=String(Math.min(20,stock)); }
    }
    window.updateProductPriceReference = priceReference;
    function setupBulk(container) {
        if (!container.classList.contains('product-details') || container.querySelector('.bulk-order')) return;
        let variants; try {variants=JSON.parse(unescape(container.dataset.stockInfo || '{}')).variants || [];} catch (_) {return;}
        if (variants.length<2) return;
        const details=document.createElement('details'); details.className='bulk-order';
            const summary=document.createElement('summary'); summary.textContent='Pedir varias variantes'; details.append(summary);
        const intro=document.createElement('p'); intro.textContent='Elegí la cantidad de cada configuración. Podés revisar el pedido en el carrito.'; details.append(intro);
        const rows=document.createElement('div'); rows.className='bulk-order-rows';
        for (const variant of variants) {
            const label=document.createElement('label'); const text=document.createElement('span');
            text.textContent=window.variantNameFor(variant)+' · '+usd(variant.price || container.dataset.price)+' · Stock: '+Number(variant.stock || 0);
            const input=document.createElement('input'); input.type='number'; input.min='0'; input.max=String(Math.min(20,Number(variant.stock || 0))); input.step='1'; input.value='0'; input.disabled=Number(variant.stock)<=0; input.setAttribute('aria-label','Cantidad de '+window.variantNameFor(variant));
            label.append(text,input); rows.append(label);
        }
        details.append(rows);
        const button=document.createElement('button'); button.type='button'; button.className='btn'; button.textContent='Agregar variantes al carrito';
        const status=document.createElement('p'); status.setAttribute('role','status');
        button.addEventListener('click', async () => {
            const inputs=[...rows.querySelectorAll('input')];
            if(inputs.some(input=>!input.checkValidity())) {inputs.find(input=>!input.checkValidity()).reportValidity(); return;}
            const selected=inputs.map((input,i)=>({input,variant:variants[i],quantity:Number(input.value)})).filter(entry=>entry.quantity>0);
            if(!selected.length) {status.textContent='Elegí al menos una cantidad.';return;}
            button.disabled=true; let count=0;
            try {
                for (const entry of selected) {
                    await window.addVariantQuantity(container.dataset.id,window.variantNameFor(entry.variant),entry.quantity);
                    entry.input.value='0';count++;
                }
                status.textContent='Variantes agregadas. Revisá los importes y descuentos en el carrito.';
            } catch(error) {status.textContent=`Se agregaron ${count} variantes. ${error.message || 'Revisá el stock e intentá nuevamente.'}`;}
            finally {button.disabled=false;}
        });
        details.append(button,status); container.querySelector('.wholesale-info')?.insertAdjacentElement('afterend',details);
    }
    function enhance(root) {
        if (!(root instanceof Element || root instanceof Document)) return;
        const entries=[...root.querySelectorAll('.product-card,.product-details')];
        if(root instanceof Element && root.matches('.product-card,.product-details')) entries.push(root);
        entries.forEach(container=>{priceReference(container);setupBulk(container);});
    }
    document.addEventListener('DOMContentLoaded', () => {
        if (!location.pathname.endsWith('/admin.html')) import('/vendor/web-vitals.js').then(({onLCP,onINP,onCLS}) => {
            const report = metric => {
                const payload={event_type:'web_vital',page_path:location.pathname,metric:metric.name,value:metric.value,device:innerWidth<768?'mobile':'desktop'};
                fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
            };
            onLCP(report);onINP(report);onCLS(report);
        }).catch(()=>{});
        enhance(document);
        const observer=new MutationObserver(records=>{
            for(const record of records) {
                if(record.type==='attributes') priceReference(record.target);
                else record.addedNodes.forEach(enhance);
            }
        });
        observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-price','data-variant-stock']});
        document.addEventListener('change',event=>{const card=event.target.closest('.product-card,.product-details');if(card) queueMicrotask(()=>priceReference(card));});
        document.addEventListener('click',event=>{if(event.target.closest('.social-dock a')) window.trackStoreEvent('contact_click');});
    });
})();
