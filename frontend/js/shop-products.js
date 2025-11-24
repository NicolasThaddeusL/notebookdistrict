// /js/shop-products.js
(async () => {
  const container       = document.getElementById('shop-products');
  const resultsMeta     = document.getElementById('shop-results-meta');
  const searchInput     = document.getElementById('shop-search');
  const sortSelect      = document.getElementById('shop-sort');
  const categoryChecks  = document.querySelectorAll('.filter-category');
  const priceMinInput   = document.getElementById('price-min');
  const priceMaxInput   = document.getElementById('price-max');
  const tagsContainer   = document.getElementById('filter-tags');
  const resetBtn        = document.getElementById('filter-reset');

  if (!container) return;

  let ALL_PRODUCTS = [];
  let TAGS = [];

  function formatPrice(num) {
    return 'IDR ' + Number(num).toLocaleString('id-ID');
  }

  function formatStock(stockRaw) {
    const n = Number.isFinite(Number(stockRaw)) ? Number(stockRaw) : 0;
    if (n <= 0) return 'Out of stock';
    if (n <= 5) return `Low stock (${n} left)`;
    return `${n} in stock`;
  }

  /* ==============================
     1) LOAD PRODUCTS.JSON
     ============================== */
  try {
    const res = await fetch('/data/products.json');
    ALL_PRODUCTS = await res.json();
  } catch (e) {
    console.error('Failed to load products for shop:', e);
    return;
  }

  if (!Array.isArray(ALL_PRODUCTS) || !ALL_PRODUCTS.length) {
    container.textContent = 'No products available.';
    return;
  }

  // Save original index for stable ordering
  ALL_PRODUCTS = ALL_PRODUCTS.map((p, idx) => ({
    stock: 0,
    ...p,              // if p.stock exists it overwrites the default
    _index: idx
  }));

  /* ==============================
     2) BUILD TAG CHIPS
     ============================== */
  function buildTagChips() {
    if (!tagsContainer) return;

    const set = new Set();
    ALL_PRODUCTS.forEach(p => {
      (p.tags || []).forEach(t => set.add(t));
    });

    TAGS = Array.from(set);
    tagsContainer.innerHTML = '';

    TAGS.forEach(tag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'filter-chip';
      chip.textContent = tag;
      chip.dataset.tag = tag;

      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        applyFiltersAndRender();
      });

      tagsContainer.appendChild(chip);
    });
  }

  buildTagChips();

  /* ==============================
     3) FILTER + SORT PIPELINE
     ============================== */
  function getActiveTags() {
    if (!tagsContainer) return [];
    return Array.from(tagsContainer.querySelectorAll('.filter-chip.active'))
      .map(chip => chip.dataset.tag);
  }

  function getActiveCategories() {
    return Array.from(categoryChecks)
      .filter(chk => chk.checked)
      .map(chk => chk.value);
  }

  function applyFiltersAndRender() {
    let products = [...ALL_PRODUCTS];

    // --- Search filter ---
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.shortDesc || '').toLowerCase().includes(q) ||
        (p.longDesc || '').toLowerCase().includes(q)
      );
    }

    // --- Category filter ---
    const activeCats = getActiveCategories();
    if (activeCats.length) {
      products = products.filter(p => activeCats.includes(p.category));
    }

    // --- Price filter (clamp to >= 0) ---
    let rawMin = priceMinInput?.value ?? '';
    let rawMax = priceMaxInput?.value ?? '';

    let minVal = rawMin !== '' ? Number(rawMin) : null;
    let maxVal = rawMax !== '' ? Number(rawMax) : null;

    if (minVal !== null && !Number.isNaN(minVal)) {
      minVal = Math.max(0, minVal);
      if (priceMinInput) priceMinInput.value = String(minVal);
      products = products.filter(p => p.price >= minVal);
    }

    if (maxVal !== null && !Number.isNaN(maxVal)) {
      maxVal = Math.max(0, maxVal);
      if (priceMaxInput) priceMaxInput.value = String(maxVal);
      products = products.filter(p => p.price <= maxVal);
    }

    // --- Tag filter ---
    const activeTags = getActiveTags();
    if (activeTags.length) {
      products = products.filter(p => {
        const ptags = p.tags || [];
        return activeTags.every(t => ptags.includes(t));
      });
    }

    // --- MAIN MODE (All / Featured / In Stock / Price sort) ---
    const sortMode = sortSelect?.value || 'all';

    if (sortMode === 'featured') {
      products = products.filter(p => p.featured);
    } else if (sortMode === 'in-stock') {
      products = products.filter(p => (p.stock ?? 0) > 0);
    }

    products = sortProducts(products, sortMode);
    renderProducts(products);
  }

  function sortProducts(products, mode) {
    const arr = [...products];

    if (mode === 'price-asc') {
      arr.sort((a, b) => a.price - b.price);
    } else if (mode === 'price-desc') {
      arr.sort((a, b) => b.price - a.price);
    } else {
      // 'all', 'featured', 'in-stock' → keep original JSON order
      arr.sort((a, b) => a._index - b._index);
    }

    return arr;
  }

  /* ==============================
     4) RENDER PRODUCTS + MODAL
     ============================== */
  const modal = document.getElementById('product-modal');
  const modalImg   = modal?.querySelector('#modal-img');
  const modalName  = modal?.querySelector('#modal-name');
  const modalPrice = modal?.querySelector('#modal-price');
  const modalDesc  = modal?.querySelector('#modal-desc');
  const modalStock = modal?.querySelector('#modal-stock');
  const buyBtn     = modal?.querySelector('#modal-buy');
  const closeBtn   = modal?.querySelector('.modal-close');
  const overlay    = modal?.querySelector('.modal-overlay');
  const modalBox   = modal?.querySelector('.modal-box');

  function renderProducts(products) {
    container.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      card.dataset.name  = p.name;
      card.dataset.price = formatPrice(p.price);
      card.dataset.desc  = p.longDesc || p.shortDesc || '';
      card.dataset.img   = p.image || '';
      card.dataset.tags  = (p.tags || []).join(',');
      card.dataset.stock = String(p.stock ?? 0);

      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" onerror="this.classList.add('broken')" />
        <h3>${p.name}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        <p class="stock">${formatStock(p.stock)}</p>
      `;

      container.appendChild(card);
    });

    if (resultsMeta) {
      const count = products.length;
      const total = ALL_PRODUCTS.length;
      resultsMeta.textContent = count === total
        ? `${count} products`
        : `${count} of ${total} products shown`;
    }

    attachModalListeners();
  }

  function openProductModal(card) {
    if (!modal) return;
    const { name, price, desc, img, stock } = card.dataset;

    if (modalName)  modalName.textContent  = name || '';
    if (modalPrice) modalPrice.textContent = price || '';
    if (modalDesc)  modalDesc.textContent  = desc || '';
    if (modalImg) {
      modalImg.src = img || '';
      modalImg.alt = name || '';
    }
    if (modalStock) modalStock.textContent = formatStock(stock);

    if (buyBtn) {
      const n = Number(stock);
      buyBtn.disabled = !Number.isFinite(n) || n <= 0;

      // 🔔 Show popup when clicked
      buyBtn.onclick = () => {
        if (buyBtn.disabled) return;
        alert('This feature is currently unavailable. Please check again later.');
      };
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function attachModalListeners() {
    if (!modal) return;

    container.querySelectorAll('.shop-card').forEach(card => {
      card.addEventListener('click', () => openProductModal(card));
    });

    closeBtn?.addEventListener('click', closeProductModal);
    overlay?.addEventListener('click', closeProductModal);

    // click anywhere outside modal-box closes it
    modal.addEventListener('click', (e) => {
      if (modalBox && !modalBox.contains(e.target)) {
        closeProductModal();
      }
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeProductModal();
      }
    });
  }

  /* ==============================
     5) RESET BUTTON
     ============================== */
  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    categoryChecks.forEach(chk => { chk.checked = false; });
    if (priceMinInput) priceMinInput.value = '';
    if (priceMaxInput) priceMaxInput.value = '';

    if (tagsContainer) {
      tagsContainer.querySelectorAll('.filter-chip.active')
        .forEach(chip => chip.classList.remove('active'));
    }

    if (sortSelect) sortSelect.value = 'all';

    applyFiltersAndRender();
  });

  /* ==============================
     6) WIRE EVENTS
     ============================== */
  searchInput?.addEventListener('input', () => applyFiltersAndRender());
  sortSelect?.addEventListener('change', () => applyFiltersAndRender());

  categoryChecks.forEach(chk => {
    chk.addEventListener('change', () => applyFiltersAndRender());
  });

  priceMinInput?.addEventListener('input', () => {
    if (priceMinInput.value !== '' && Number(priceMinInput.value) < 0) {
      priceMinInput.value = '0';
    }
    applyFiltersAndRender();
  });

  priceMaxInput?.addEventListener('input', () => {
    if (priceMaxInput.value !== '' && Number(priceMaxInput.value) < 0) {
      priceMaxInput.value = '0';
    }
    applyFiltersAndRender();
  });

  /* ==============================
     INITIAL RENDER
     ============================== */
  if (sortSelect && !sortSelect.value) {
    sortSelect.value = 'all';
  }

  applyFiltersAndRender();
})();
