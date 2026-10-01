// Progressive enhancement: the home stays visible without JavaScript or motion.
(() => {
    const main = document.querySelector('.home-page main');
    if (!main) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const selector = '.product-card, .trust-badges > div > div, .home-category, .advisor-intro, .home-contact';
    const seen = new WeakSet();
    const animations = new Set();
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            if (preference.matches) continue;
            const animation = entry.target.animate([
                {opacity: .65, transform: 'translateY(12px)'},
                {opacity: 1, transform: 'translateY(0)'}
            ], {duration: 360, easing: 'cubic-bezier(.16,1,.3,1)'});
            animations.add(animation);
            animation.finished.catch(() => {}).finally(() => animations.delete(animation));
        }
    }, {threshold: .06});
    const enhance = root => {
        if (!(root instanceof Element || root instanceof Document)) return;
        const candidates = [...root.querySelectorAll(selector)];
        if (root instanceof Element && root.matches(selector)) candidates.unshift(root);
        for (const element of candidates) {
            if (seen.has(element)) continue;
            seen.add(element);
            // Keep the initial viewport immediately painted, without an entrance.
            if (element.getBoundingClientRect().top >= innerHeight) observer.observe(element);
        }
    };
    enhance(main);
    const mutations = new MutationObserver(records => {
        for (const record of records) {
            record.addedNodes.forEach(enhance);
            record.removedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                observer.unobserve(node);
                node.querySelectorAll(selector).forEach(element => observer.unobserve(element));
            });
        }
    });
    mutations.observe(main, {childList: true, subtree: true});
    preference.addEventListener('change', event => {
        if (!event.matches) return;
        observer.disconnect(); mutations.disconnect();
        animations.forEach(animation => animation.cancel());
    });
})();
