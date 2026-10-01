(() => {
    const search = document.getElementById('admin-product-search');
    const list = document.getElementById('admin-product-list');
    if (!search || !list) return;
    const status = document.getElementById('admin-product-count');
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function filter() {
        const query = normalize(search.value.trim());
        const cards = [...list.querySelectorAll('.slide-item')];
        let visible = 0;
        cards.forEach(card => {const match = normalize(card.querySelector('h5')?.textContent || '').includes(query); card.style.display = match ? 'flex' : 'none'; if (match) visible++;});
        status.textContent = `${visible} de ${cards.length} productos`;
    }
    search.addEventListener('input', filter);
    const links = [...document.querySelectorAll('.admin-nav a[onclick]')];
    function syncNavigation() {links.forEach(link => {if (link.classList.contains('active')) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');});}
    links.forEach(link => link.addEventListener('click', syncNavigation));
    syncNavigation();
    new MutationObserver(filter).observe(list, {childList: true});
    filter();
})();
