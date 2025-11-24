(async () => {
    const carousel = document.getElementById('carousel');
    const prev = document.querySelector('#featured-products .prev');
    const next = document.querySelector('#featured-products .next');
    if (!carousel || !prev || !next) return;

    /* =========================================================
       1) LOAD FEATURED PRODUCTS FROM products.json
       ========================================================= */

    let featuredProducts = [];

    try {
        const res = await fetch('/data/products.json'); // adjust path if needed
        const allProducts = await res.json();

        // Only take products with featured: true
        featuredProducts = allProducts.filter(p => p.featured);
    } catch (err) {
        console.error('Failed to load products.json', err);
        return;
    }

    // If nothing to show, stop
    if (!featuredProducts.length) return;

    // Build cards into #carousel
    featuredProducts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';

        // dataset used by your modal
        card.dataset.name = p.name;
        card.dataset.price = 'IDR ' + Number(p.price).toLocaleString('id-ID');
        card.dataset.desc = p.shortDesc || '';
        card.dataset.img  = p.image || '';

        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" onerror="this.classList.add('broken')" />
            <h3>${p.name}</h3>
        `;

        carousel.appendChild(card);
    });

    /* =========================================================
       2) YOUR ORIGINAL CAROUSEL CODE (ALMOST UNCHANGED)
       ========================================================= */

    /* ---------- CLONE CARDS FOR INFINITE CAROUSEL ---------- */
    const originals = Array.from(carousel.children);

    originals.forEach(el => carousel.appendChild(el.cloneNode(true)));
    originals.slice().reverse().forEach(el =>
        carousel.insertBefore(el.cloneNode(true), carousel.firstChild)
    );

    /* ---------- CAROUSEL HELPERS ---------- */
    const gap = () => parseFloat(getComputedStyle(carousel).gap || 16);
    const cardWidth = () =>
        (carousel.querySelector('.card')?.getBoundingClientRect().width || 220);

    const step = () => cardWidth() + gap();
    const setWidth = () => carousel.scrollWidth / 3;

    function gotoRealStart(behavior = 'auto') {
        carousel.scrollTo({ left: setWidth(), behavior });
    }

    function normalize() {
        const base = setWidth();
        const x = carousel.scrollLeft;
        if (x < base * 0.5) {
            carousel.scrollLeft = x + base;
        } else if (x > base * 1.5) {
            carousel.scrollLeft = x - base;
        }
    }

    /* ---------- SMOOTH ANIMATION ---------- */
    let animId = 0;
    function animateTo(target, duration = 350) {
        animId++;
        const myId = animId;
        const start = carousel.scrollLeft;
        const dist  = target - start;
        const t0 = performance.now();

        function frame(now) {
            if (myId !== animId) return;
            const p = Math.min(1, (now - t0) / duration);
            const e = 1 - (1 - p) * (1 - p); // easeOutQuad
            carousel.scrollLeft = start + dist * e;
            normalize();
            if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function stepBy(dir) {
        const target = carousel.scrollLeft + dir * step();
        animateTo(target);
    }

    /* ---------- INIT POSITION ---------- */
    requestAnimationFrame(() => gotoRealStart('auto'));

    /* ---------- KEEP LOOP ON MANUAL SCROLL ---------- */
    let ticking = false;
    carousel.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { normalize(); ticking = false; });
    }, { passive: true });

    /* ---------- ARROWS ---------- */
    function stopAuto(){}  // forward declarations for hoisting clarity
    function restartAutoSoon(){}

    prev.addEventListener('click', () => {
        stopAuto();
        stepBy(-1);
        restartAutoSoon();
    });
    next.addEventListener('click', () => {
        stopAuto();
        stepBy(1);
        restartAutoSoon();
    });

    /* ---------- AUTOPLAY ---------- */
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoTimer = null;
    let autoDelayTimer = null;
    const AUTO_INTERVAL = 3500; // ms between slides

    function startAuto() {
        if (REDUCED || autoTimer) return;
        autoTimer = setInterval(() => stepBy(1), AUTO_INTERVAL);
    }

    stopAuto = function() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = null;
    };

    restartAutoSoon = function() {
        if (REDUCED) return;
        clearTimeout(autoDelayTimer);
        autoDelayTimer = setTimeout(startAuto, 2200);
    };

    ['mouseenter', 'focusin', 'pointerdown', 'touchstart'].forEach(ev => {
        carousel.addEventListener(ev, () => { stopAuto(); }, { passive: true });
    });
    ['mouseleave', 'focusout', 'pointerup', 'touchend', 'touchcancel'].forEach(ev => {
        carousel.addEventListener(ev, () => { restartAutoSoon(); }, { passive: true });
    });

    startAuto();

    /* =========================================================
       3) PRODUCT MODAL – SAME LOGIC, NOW USING JSON-BACKED CARDS
       ========================================================= */

    const cards = carousel.querySelectorAll('.card');
    const modal = document.getElementById('product-modal');

    if (modal && cards.length) {
        const modalImg   = modal.querySelector('#modal-img');
        const modalName  = modal.querySelector('#modal-name');
        const modalPrice = modal.querySelector('#modal-price');
        const modalDesc  = modal.querySelector('#modal-desc');
        const closeBtn   = modal.querySelector('.modal-close');
        const overlay    = modal.querySelector('.modal-overlay');
        const modalBox   = modal.querySelector('.modal-box');

        function openProductModal(card) {
            const { name, price, desc, img } = card.dataset;

            if (modalName)  modalName.textContent  = name  || card.querySelector('h3')?.textContent || '';
            if (modalPrice) modalPrice.textContent = price || '';
            if (modalDesc)  modalDesc.textContent  = desc  || '';
            if (modalImg) {
                modalImg.src = img || card.querySelector('img')?.src || '';
                modalImg.alt = name || card.querySelector('img')?.alt || '';
            }

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeProductModal() {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        // open when any card is clicked
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button, a')) return; // just in case
                openProductModal(card);
            });
        });

        // close when clicking the X
        closeBtn?.addEventListener('click', closeProductModal);

        // close when clicking *anywhere outside the modal box*
        modal.addEventListener('click', (e) => {
            if (!modalBox.contains(e.target)) {
                closeProductModal();
            }
        });

        // overlay click
        overlay?.addEventListener('click', closeProductModal);

        // close on ESC
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeProductModal();
            }
        });
    }
})();
