document.addEventListener('DOMContentLoaded', () => {
    // 0. Sticky header scroll shadow
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });
    }

    // Mobile nav toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navMenu.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isOpen);
                icon.classList.toggle('fa-times', isOpen);
            }
            menuToggle.setAttribute('aria-expanded', isOpen);
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.focus();
            }
        });
    }

    // =========================================================
    // SEARCH OVERLAY
    // =========================================================

    // Detect path prefix (pages/ subfolder vs root)
    const isSubPage = window.location.pathname.includes('/pages/');
    const shopUrl = isSubPage ? 'shop.html' : 'pages/shop.html';

    // Inject overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search');
    overlay.innerHTML = `
        <div id="search-overlay-backdrop"></div>
        <div id="search-overlay-box">
            <form id="search-form" autocomplete="off">
                <i class="fas fa-search" id="search-icon-inside"></i>
                <input type="text" id="search-input" placeholder="Search products..." aria-label="Search products" />
                <button type="button" id="search-close-btn" aria-label="Close search"><i class="fas fa-times"></i></button>
            </form>
            <div id="search-hint">Press Enter to search all products</div>
        </div>
    `;
    document.body.appendChild(overlay);


    const searchOverlay = document.getElementById('search-overlay');
    const searchInput   = document.getElementById('search-input');
    const searchForm    = document.getElementById('search-form');
    const closeBtn      = document.getElementById('search-close-btn');
    const backdrop      = document.getElementById('search-overlay-backdrop');

    const openSearch = (e) => {
        if (e) e.preventDefault();
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput.focus(), 50);
    };

    const closeSearch = () => {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
    };

    // Wire up all search icon links
    document.querySelectorAll('a[aria-label="Search"]').forEach(link => {
        link.addEventListener('click', openSearch);
    });

    closeBtn.addEventListener('click', closeSearch);
    backdrop.addEventListener('click', closeSearch);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) closeSearch();
        // Open search with Ctrl+K / Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchOverlay.classList.contains('active') ? closeSearch() : openSearch();
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            closeSearch();
            window.location.href = `${shopUrl}?search=${encodeURIComponent(query)}`;
        }
    });

    // 1. Setup Badge on Cart Icon
    const cartLink = document.querySelector('a[aria-label="Shopping Cart"]');
    let badge = null;
    
    if (cartLink) {
        cartLink.classList.add('cart-icon-with-badge');
        badge = document.createElement('span');
        badge.className = 'cart-badge hidden-badge';
        cartLink.appendChild(badge);
    }

    // 2. Update Badge from LocalStorage
    const updateBadge = () => {
        let cartItems = [];
        try { cartItems = JSON.parse(localStorage.getItem('cartItems')) || []; } catch(e) {}
        const count = cartItems.reduce((sum, item) => sum + item.qty, 0);
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('hidden-badge', count === 0);
        }
    };
    updateBadge();

    // 3. Add to Cart Buttons
    document.querySelectorAll('button[aria-label="Add to cart"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Read from the closest .card
            const card = btn.closest('.card');
            let name = 'Product';
            let price = 0;
            let image = '';
            let category = '';

            if (card) {
                const titleEl = card.querySelector('.card-body a');
                const imgEl = card.querySelector('img');
                const priceEl = card.querySelector('.price');
                const catEl = card.querySelector('.category-tag');

                name = titleEl ? titleEl.textContent.trim() : 'Product';
                price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
                image = imgEl ? imgEl.getAttribute('src') : '';
                category = catEl ? catEl.textContent.trim() : '';
            }

            let cartItems = [];
            try { cartItems = JSON.parse(localStorage.getItem('cartItems')) || []; } catch(e) {}

            const existing = cartItems.find(item => item.name === name);
            if (existing) {
                existing.qty++;
            } else {
                cartItems.push({ name, price, image, category, qty: 1 });
            }

            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateBadge();
            window.dispatchEvent(new Event('cartUpdated'));

            // Visual feedback
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('btn-added');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.remove('btn-added');
            }, 1500);
        });
    });

    // 4. Global Form Validation
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            let isValid = true;
            form.querySelectorAll('[required]').forEach(field => {
                if (field.type === 'checkbox') {
                    if (!field.checked) isValid = false;
                } else if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('input-error');
                } else {
                    field.classList.remove('input-error');
                }
            });
            if (!isValid) {
                e.preventDefault();
                alert('Please fill out all required fields.');
            }
        });
        form.querySelectorAll('[required]').forEach(input => {
            input.addEventListener('input', () => { if (input.type !== 'checkbox') input.classList.remove('input-error'); });
        });
    });
});

/* =========================================================
   ADMIN AUTH MODULE
   TechHaven Admin Panel - Client-side authentication
   Exposed as window.AdminAuth
========================================================= */
window.AdminAuth = (function () {
  const ACCOUNTS_KEY = 'adminAccounts';
  const SESSION_KEY  = 'adminSession';
  const SESSION_7D   = 7 * 24 * 60 * 60 * 1000;

  /* -------------------------------------------------------
     Internal helpers
  ------------------------------------------------------- */
  function _readAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function _writeAccounts(accounts) {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('AdminAuth: failed to write accounts', e);
    }
  }

  function _readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function _writeSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('AdminAuth: failed to write session', e);
    }
  }

  /* -------------------------------------------------------
     Public API
  ------------------------------------------------------- */

  /**
   * Returns all stored admin account objects.
   * @returns {Array<{username: string, email: string, password: string}>}
   */
  function getAccounts() {
    return _readAccounts();
  }

  /**
   * Registers a new admin account.
   * Throws an Error with a descriptive message on violation.
   * @param {string} username
   * @param {string} email
   * @param {string} password
   */
  function register(username, email, password) {
    if (!username || !username.trim()) {
      throw new Error('Username is required');
    }
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const accounts = _readAccounts();
    const normalised = email.trim().toLowerCase();

    if (accounts.some(a => a.email.toLowerCase() === normalised)) {
      throw new Error('An account with this email already exists');
    }

    accounts.push({
      username: username.trim(),
      email: normalised,
      password: password,
    });

    _writeAccounts(accounts);
  }

  /**
   * Validates credentials and writes a session on success.
   * @param {string} email
   * @param {string} password
   * @param {boolean} rememberMe  — true = 7-day expiry; false = session-only (Infinity)
   * @returns {boolean}
   */
  function login(email, password, rememberMe) {
    const accounts = _readAccounts();
    const normalised = (email || '').trim().toLowerCase();
    const account = accounts.find(
      a => a.email.toLowerCase() === normalised && a.password === password
    );

    if (!account) return false;

    const session = {
      username: account.username,
      email: account.email,
      expiresAt: rememberMe ? Date.now() + SESSION_7D : Infinity,
    };

    _writeSession(session);
    return true;
  }

  /**
   * Removes the active session from localStorage.
   */
  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('AdminAuth: failed to remove session', e);
    }
  }

  /**
   * Returns the active AdminSession object or null.
   * @returns {{username: string, email: string, expiresAt: number} | null}
   */
  function getSession() {
    const session = _readSession();
    if (!session) return null;
    return session;
  }

  /**
   * Returns true only when a non-expired session exists.
   * @returns {boolean}
   */
  function isAuthenticated() {
    const session = _readSession();
    if (!session) return false;
    if (session.expiresAt === Infinity || session.expiresAt === null) return true;
    if (Date.now() > session.expiresAt) {
      logout();
      return false;
    }
    return true;
  }

  /**
   * Redirects to admin-login.html if no valid session exists.
   * Must be called synchronously at the top of every protected page.
   */
  function requireSession() {
    if (!isAuthenticated()) {
      logout(); // clean up any stale session
      location.replace('admin-login.html');
    }
  }

  return {
    getAccounts,
    register,
    login,
    logout,
    getSession,
    isAuthenticated,
    requireSession,
  };
})();

/* =========================================================
   STOCK MANAGER MODULE
   TechHaven Admin Panel - Product catalogue management
   Exposed as window.StockManager
========================================================= */
window.StockManager = (function () {
  const STOCK_KEY = 'techhavenStock';

  /* -------------------------------------------------------
     UUID generation
  ------------------------------------------------------- */
  function _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* -------------------------------------------------------
     Seed dataset — all 65 products from pages/shop.html
  ------------------------------------------------------- */
  function _buildSeed() {
    const rnd = (min, max) => Math.random() * (max - min) + min;
    const rndInt = (min, max) => Math.floor(rnd(min, max + 1));
    const rndRating = () => Math.round(rnd(3.0, 5.0) * 10) / 10;

    const products = [
      // Laptops & PCs (13)
      { name: 'Apple Elite 14',    category: 'Laptops & PCs', brand: 'Apple',  price: 1663.85, image: '../Sources/laptops/Product1.jpg' },
      { name: 'MSI Premium 70',    category: 'Laptops & PCs', brand: 'MSI',    price: 938.84,  image: '../Sources/laptops/Product2.jpg' },
      { name: 'Asus Advanced 98',  category: 'Laptops & PCs', brand: 'Asus',   price: 1026.02, image: '../Sources/laptops/Product3.jpg' },
      { name: 'Asus Lite 31',      category: 'Laptops & PCs', brand: 'Asus',   price: 1960.94, image: '../Sources/laptops/Product4.jpg' },
      { name: 'Acer Mini 75',      category: 'Laptops & PCs', brand: 'Acer',   price: 161.93,  image: '../Sources/laptops/product5.jpeg' },
      { name: 'Razer Elite 48',    category: 'Laptops & PCs', brand: 'Razer',  price: 2815.55, image: '../Sources/laptops/Product6.jpg' },
      { name: 'Acer Advanced 62',  category: 'Laptops & PCs', brand: 'Acer',   price: 540.65,  image: '../Sources/laptops/Product7.jpg' },
      { name: 'MSI Lite 84',       category: 'Laptops & PCs', brand: 'MSI',    price: 1909.42, image: '../Sources/laptops/Product8.jpg' },
      { name: 'Dell Mini 82',      category: 'Laptops & PCs', brand: 'Dell',   price: 349.16,  image: '../Sources/laptops/Product9.jpg' },
      { name: 'HP Air 53',         category: 'Laptops & PCs', brand: 'HP',     price: 2226.16, image: '../Sources/laptops/Product10.jpg' },
      { name: 'MSI Max 41',        category: 'Laptops & PCs', brand: 'MSI',    price: 2525.47, image: '../Sources/laptops/Product11.jpg' },
      { name: 'Razer Air 88',      category: 'Laptops & PCs', brand: 'Razer',  price: 1837.83, image: '../Sources/laptops/Product12.jpg' },
      { name: 'HP Air 10',         category: 'Laptops & PCs', brand: 'HP',     price: 2898.79, image: '../Sources/laptops/Product13.jpg' },
      // Smartphones (13)
      { name: 'Oppo Elite 19',     category: 'Smartphones', brand: 'Oppo',    price: 981.51,  image: '../Sources/smartphones/Product1.jpg' },
      { name: 'Apple Max 93',      category: 'Smartphones', brand: 'Apple',   price: 2935.31, image: '../Sources/smartphones/Product2.jpg' },
      { name: 'Sony Air 86',       category: 'Smartphones', brand: 'Sony',    price: 1593.86, image: '../Sources/smartphones/Product3.jpg' },
      { name: 'Google Max 38',     category: 'Smartphones', brand: 'Google',  price: 2912.02, image: '../Sources/smartphones/Product4.jpg' },
      { name: 'OnePlus Mini 93',   category: 'Smartphones', brand: 'OnePlus', price: 1009.82, image: '../Sources/smartphones/Product5.jpg' },
      { name: 'Google Elite 12',   category: 'Smartphones', brand: 'Google',  price: 1254.22, image: '../Sources/smartphones/Product6.jpg' },
      { name: 'Xiaomi Ultra 15',   category: 'Smartphones', brand: 'Xiaomi',  price: 2794.88, image: '../Sources/smartphones/Product7.jpg' },
      { name: 'Sony Max 14',       category: 'Smartphones', brand: 'Sony',    price: 734.05,  image: '../Sources/smartphones/Product8.jpg' },
      { name: 'Vivo Ultra 61',     category: 'Smartphones', brand: 'Vivo',    price: 1644.95, image: '../Sources/smartphones/Product9.jpg' },
      { name: 'Xiaomi Max 16',     category: 'Smartphones', brand: 'Xiaomi',  price: 1851.71, image: '../Sources/smartphones/Product10.jpg' },
      { name: 'Xiaomi Pro 28',     category: 'Smartphones', brand: 'Xiaomi',  price: 2813.73, image: '../Sources/smartphones/Product11.jpg' },
      { name: 'Sony Max 13',       category: 'Smartphones', brand: 'Sony',    price: 1992.27, image: '../Sources/smartphones/Product12.jpg' },
      { name: 'Xiaomi Premium 80', category: 'Smartphones', brand: 'Xiaomi',  price: 1344.28, image: '../Sources/smartphones/Product13.jpg' },
      // Audio (13)
      { name: 'Jabra Mini 20',       category: 'Audio', brand: 'Jabra',       price: 1589.01, image: '../Sources/audio/Product1.jpg' },
      { name: 'Apple Max 63',        category: 'Audio', brand: 'Apple',       price: 1503.12, image: '../Sources/audio/Product2.jpg' },
      { name: 'Beats Lite 30',       category: 'Audio', brand: 'Beats',       price: 1652.18, image: '../Sources/audio/Product3.jpg' },
      { name: 'Skullcandy Pro 83',   category: 'Audio', brand: 'Skullcandy',  price: 1867.33, image: '../Sources/audio/Product4.jpg' },
      { name: 'Sennheiser Lite 20',  category: 'Audio', brand: 'Sennheiser', price: 1835.78, image: '../Sources/audio/Product5.jpg' },
      { name: 'Sony Ultra 69',       category: 'Audio', brand: 'Sony',        price: 1605.36, image: '../Sources/audio/Product6.jpg' },
      { name: 'Sennheiser Pro 75',   category: 'Audio', brand: 'Sennheiser', price: 867.18,  image: '../Sources/audio/Product7.jpg' },
      { name: 'Bose Pro 78',         category: 'Audio', brand: 'Bose',        price: 2800.25, image: '../Sources/audio/Product8.jpg' },
      { name: 'Jabra Ultra 44',      category: 'Audio', brand: 'Jabra',       price: 1120.50, image: '../Sources/audio/Product9.jpg' },
      { name: 'Beats Max 55',        category: 'Audio', brand: 'Beats',       price: 980.00,  image: '../Sources/audio/Product10.jpg' },
      { name: 'Sony Elite 32',       category: 'Audio', brand: 'Sony',        price: 1450.75, image: '../Sources/audio/Product11.jpg' },
      { name: 'Bose Air 21',         category: 'Audio', brand: 'Bose',        price: 2100.00, image: '../Sources/audio/Product12.jpg' },
      { name: 'Sennheiser Max 90',   category: 'Audio', brand: 'Sennheiser', price: 1750.00, image: '../Sources/audio/Product13.jpg' },
      // Wearables (13)
      { name: 'Apple Watch Pro 1',   category: 'Wearables', brand: 'Apple',   price: 799.99,  image: '../Sources/wearables/Product1.jpg' },
      { name: 'Samsung Band 2',      category: 'Wearables', brand: 'Samsung', price: 249.99,  image: '../Sources/wearables/Product2.jpg' },
      { name: 'Fitbit Ultra 3',      category: 'Wearables', brand: 'Fitbit',  price: 349.99,  image: '../Sources/wearables/Product3.jpg' },
      { name: 'Garmin Elite 4',      category: 'Wearables', brand: 'Garmin',  price: 599.99,  image: '../Sources/wearables/Product4.jpg' },
      { name: 'Apple Watch SE 5',    category: 'Wearables', brand: 'Apple',   price: 499.99,  image: '../Sources/wearables/Product5.jpg' },
      { name: 'Samsung Watch 6',     category: 'Wearables', brand: 'Samsung', price: 399.99,  image: '../Sources/wearables/Product6.jpg' },
      { name: 'Fitbit Charge 7',     category: 'Wearables', brand: 'Fitbit',  price: 179.99,  image: '../Sources/wearables/Product7.jpg' },
      { name: 'Garmin Fenix 8',      category: 'Wearables', brand: 'Garmin',  price: 899.99,  image: '../Sources/wearables/Product8.jpg' },
      { name: 'Apple Watch Ultra 9', category: 'Wearables', brand: 'Apple',   price: 999.99,  image: '../Sources/wearables/Product9.jpg' },
      { name: 'Samsung Gear 10',     category: 'Wearables', brand: 'Samsung', price: 299.99,  image: '../Sources/wearables/Product10.jpg' },
      { name: 'Fitbit Sense 11',     category: 'Wearables', brand: 'Fitbit',  price: 279.99,  image: '../Sources/wearables/Product11.jpg' },
      { name: 'Garmin Venu 12',      category: 'Wearables', brand: 'Garmin',  price: 449.99,  image: '../Sources/wearables/Product12.jpg' },
      { name: 'Apple Band 13',       category: 'Wearables', brand: 'Apple',   price: 149.99,  image: '../Sources/wearables/Product13.jpg' },
      // Cameras (13)
      { name: 'Canon EOS R1',        category: 'Cameras', brand: 'Canon',  price: 2499.99, image: '../Sources/cameras/Product1.jpg' },
      { name: 'Sony Alpha A2',       category: 'Cameras', brand: 'Sony',   price: 1999.99, image: '../Sources/cameras/Product2.jpg' },
      { name: 'Nikon Z9 3',          category: 'Cameras', brand: 'Nikon',  price: 3499.99, image: '../Sources/cameras/Product3.jpg' },
      { name: 'Canon PowerShot 4',   category: 'Cameras', brand: 'Canon',  price: 599.99,  image: '../Sources/cameras/Product4.jpg' },
      { name: 'Sony ZV-E5',          category: 'Cameras', brand: 'Sony',   price: 999.99,  image: '../Sources/cameras/Product5.jpg' },
      { name: 'Nikon D850 6',        category: 'Cameras', brand: 'Nikon',  price: 2799.99, image: '../Sources/cameras/Product6.jpg' },
      { name: 'Canon M50 7',         category: 'Cameras', brand: 'Canon',  price: 849.99,  image: '../Sources/cameras/Product7.jpg' },
      { name: 'Sony A7 IV 8',        category: 'Cameras', brand: 'Sony',   price: 2499.99, image: '../Sources/cameras/Product8.jpg' },
      { name: 'Nikon Z6 9',          category: 'Cameras', brand: 'Nikon',  price: 1999.99, image: '../Sources/cameras/Product9.jpg' },
      { name: 'Canon R6 10',         category: 'Cameras', brand: 'Canon',  price: 2299.99, image: '../Sources/cameras/Product10.jpg' },
      { name: 'Sony A6400 11',       category: 'Cameras', brand: 'Sony',   price: 899.99,  image: '../Sources/cameras/Product11.jpg' },
      { name: 'Nikon Z50 12',        category: 'Cameras', brand: 'Nikon',  price: 799.99,  image: '../Sources/cameras/Product12.jpg' },
      { name: 'Canon R50 13',        category: 'Cameras', brand: 'Canon',  price: 679.99,  image: '../Sources/cameras/Product13.jpg' },
    ];

    // Guaranteed low-stock indices (0-based) — one per category
    // so the Low Stock Alerts table always has visible entries
    const lowStockIndices = new Set([
      2,   // Asus Advanced 98   — Laptops & PCs  → stock 3
      15,  // Sony Air 86        — Smartphones     → stock 2
      29,  // Skullcandy Pro 83  — Audio           → stock 1
      42,  // Garmin Elite 4     — Wearables       → stock 4
      55,  // Nikon D850 6       — Cameras         → stock 2
      7,   // MSI Lite 84        — Laptops & PCs   → stock 5
      20,  // Sony Max 14        — Smartphones     → stock 3
    ]);
    const lowStockValues = [3, 2, 1, 4, 2, 5, 3];
    let lowIdx = 0;

    return products.map((p, i) => {
      let stock;
      if (lowStockIndices.has(i)) {
        stock = lowStockValues[lowIdx++];
      } else {
        stock = rndInt(6, 50); // normal stock always above low-stock threshold
      }
      return {
        id: 'seed-' + String(i + 1).padStart(3, '0'),
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price,
        stock: stock,
        rating: rndRating(),
        available: stock > 0,
        image: p.image,
      };
    });
  }

  /* -------------------------------------------------------
     Public API
  ------------------------------------------------------- */

  /**
   * Seeds localStorage with default products if key is absent.
   * @private
   */
  function _seed() {
    try {
      if (localStorage.getItem(STOCK_KEY) !== null) return;
      const seed = _buildSeed();
      localStorage.setItem(STOCK_KEY, JSON.stringify(seed));
    } catch (e) {
      console.error('StockManager: seed failed', e);
    }
  }

  /**
   * Forces a fresh seed, clearing existing data.
   * Call this once to reset to the guaranteed low-stock dataset.
   */
  function resetSeed() {
    try {
      localStorage.removeItem(STOCK_KEY);
      const seed = _buildSeed();
      localStorage.setItem(STOCK_KEY, JSON.stringify(seed));
    } catch (e) {
      console.error('StockManager: resetSeed failed', e);
    }
  }

  /**
   * Returns all ProductRecords from localStorage. Seeds on first call.
   * @returns {Array}
   */
  function getProducts() {
    _seed();
    try {
      return JSON.parse(localStorage.getItem(STOCK_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Serialises and writes the products array to localStorage.
   * @param {Array} products
   */
  function saveProducts(products) {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('StockManager: saveProducts failed', e);
    }
  }

  /**
   * Adds a new product record. Returns the new record with generated id.
   * @param {Object} data
   * @returns {Object}
   */
  function addProduct(data) {
    const products = getProducts();
    const record = Object.assign({}, data, { id: _uuid() });
    products.push(record);
    saveProducts(products);
    return record;
  }

  /**
   * Updates an existing product by id. Returns updated record or null.
   * @param {string} id
   * @param {Object} data  — partial patch
   * @returns {Object|null}
   */
  function updateProduct(id, data) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = Object.assign({}, products[idx], data, { id });
    saveProducts(products);
    return products[idx];
  }

  /**
   * Deletes a product by id. Returns true if found, false otherwise.
   * @param {string} id
   * @returns {boolean}
   */
  function deleteProduct(id) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    saveProducts(products);
    return true;
  }

  /**
   * Returns a single product by id or null.
   * @param {string} id
   * @returns {Object|null}
   */
  function getProductById(id) {
    const products = getProducts();
    return products.find(p => p.id === id) || null;
  }

  return {
    getProducts,
    saveProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    resetSeed,
    _seed,
  };
})();
