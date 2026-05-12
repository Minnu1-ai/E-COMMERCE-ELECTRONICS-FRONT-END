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

/* =========================================================
   CART PAGE (pages/cart.html)
========================================================= */
(function () {
    if (!document.getElementById('cart-items-container')) return;

    const getCart = () => { try { return JSON.parse(localStorage.getItem('cartItems')) || []; } catch(e) { return []; } };
    const saveCart = (items) => { localStorage.setItem('cartItems', JSON.stringify(items)); window.dispatchEvent(new Event('cartUpdated')); };

    const renderCart = () => {
        const cart = getCart();
        const container = document.getElementById('cart-items-container');
        const itemCount = document.getElementById('item-count');
        const clearBtn = document.getElementById('clear-cart-btn');
        const checkoutBtn = document.getElementById('checkout-btn');
        const totalItems = cart.reduce((s, i) => s + i.qty, 0);
        itemCount.textContent = totalItems > 0 ? `(${totalItems} item${totalItems !== 1 ? 's' : ''})` : '';
        if (cart.length > 0) { clearBtn.classList.remove('hidden-btn'); } else { clearBtn.classList.add('hidden-btn'); }

        if (cart.length === 0) {
            container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Your cart is empty</h3><p>Looks like you haven't added anything yet.</p><a href="shop.html" class="btn lg-button">Start Shopping</a></div>`;
            updateSummary(0);
            checkoutBtn.classList.add('btn-disabled');
            return;
        }
        checkoutBtn.classList.remove('btn-disabled');

        container.innerHTML = cart.map((item, i) => `
            <div class="cart-item-row" data-index="${i}">
                <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='../Sources/laptops/Product1.jpg'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-cat">${item.category}</div>
                    <div class="cart-item-unit">Unit: $${item.price.toFixed(2)}</div>
                </div>
                <div class="qty-control">
                    <button class="qty-dec" data-index="${i}">-</button>
                    <input type="number" value="${item.qty}" min="1" max="99" data-index="${i}" class="qty-input">
                    <button class="qty-inc" data-index="${i}">+</button>
                </div>
                <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                <button class="remove-btn" data-index="${i}" aria-label="Remove item"><i class="fas fa-times"></i></button>
            </div>`).join('');

        container.querySelectorAll('.qty-dec').forEach(btn => btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.index); const c = getCart(); if (c[idx].qty > 1) { c[idx].qty--; saveCart(c); renderCart(); } }));
        container.querySelectorAll('.qty-inc').forEach(btn => btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.index); const c = getCart(); c[idx].qty++; saveCart(c); renderCart(); }));
        container.querySelectorAll('.qty-input').forEach(input => input.addEventListener('change', () => { const idx = parseInt(input.dataset.index); const val = Math.max(1, parseInt(input.value) || 1); const c = getCart(); c[idx].qty = val; saveCart(c); renderCart(); }));
        container.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.index); const c = getCart(); c.splice(idx, 1); saveCart(c); renderCart(); }));

        updateSummary(cart.reduce((s, i) => s + i.price * i.qty, 0));
    };

    const updateSummary = (subtotal) => {
        const tax = subtotal * 0.08;
        document.getElementById('summary-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('summary-tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('summary-total').textContent = '$' + (subtotal + tax).toFixed(2);
    };

    document.getElementById('clear-cart-btn').addEventListener('click', () => { if (confirm('Remove all items from your cart?')) { saveCart([]); renderCart(); } });
    window.addEventListener('cartUpdated', renderCart);
    renderCart();
})();

/* =========================================================
   CHECKOUT PAGE (pages/checkout.html)
========================================================= */
(function () {
    if (!document.getElementById('checkout-order-items')) return;

    const getCart = () => { try { return JSON.parse(localStorage.getItem('cartItems')) || []; } catch(e) { return []; } };

    const renderOrderItems = () => {
        const cart = getCart();
        const container = document.getElementById('checkout-order-items');
        if (cart.length === 0) { container.innerHTML = '<p class="checkout-empty-msg">Your cart is empty.</p>'; updateTotals(0); return; }
        container.innerHTML = cart.map(item => `
            <div class="order-item">
                <img class="order-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='../Sources/laptops/Product1.jpg'">
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-qty">Qty: ${item.qty} &times; $${item.price.toFixed(2)}</div>
                </div>
                <div class="order-item-price">$${(item.price * item.qty).toFixed(2)}</div>
            </div>`).join('');
        updateTotals(cart.reduce((s, i) => s + i.price * i.qty, 0));
    };

    const updateTotals = (subtotal) => {
        const tax = subtotal * 0.08;
        document.getElementById('co-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('co-tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('co-total').textContent = '$' + (subtotal + tax).toFixed(2);
    };

    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const ccFields = document.getElementById('credit-card-fields');
            const ccInputs = document.querySelectorAll('.cc-input');
            if (radio.value === 'credit') { ccFields.classList.remove('cc-fields-hidden'); ccInputs.forEach(i => i.required = true); }
            else { ccFields.classList.add('cc-fields-hidden'); ccInputs.forEach(i => { i.required = false; i.value = ''; }); }
        });
    });

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const cart = getCart();
        if (cart.length === 0) { alert('Your cart is empty!'); return; }
        const btn = document.querySelector('button[form="checkout-form"]');
        btn.innerHTML = '<i class="icon-fa-spinner"></i> Processing...';
        btn.disabled = true;
        setTimeout(() => {
            localStorage.removeItem('cartItems');
            window.dispatchEvent(new Event('cartUpdated'));
            const orderNum = '#TH' + Math.floor(10000 + Math.random() * 90000);
            document.getElementById('main-content').innerHTML = `
                <div class="checkout-success">
                    <div class="checkout-success-icon"><i class="fas fa-check"></i></div>
                    <h2>Order Placed!</h2>
                    <p>Thank you for shopping with TechHaven.</p>
                    <p class="checkout-success-order">Order ${orderNum}</p>
                    <p>A confirmation email will be sent to you shortly.</p>
                    <div class="checkout-success-actions">
                        <a href="../index.html" class="btn lg-button">Back to Home</a>
                        <a href="shop.html" class="btn-outline-lg">Continue Shopping</a>
                    </div>
                </div>`;
        }, 1800);
    });

    renderOrderItems();
})();

/* =========================================================
   CONTACT PAGE (pages/contact.html)
========================================================= */
(function () {
    const contactForm = document.querySelector('.contact-form-inner');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        setTimeout(() => {
            btn.textContent = 'Message Sent!';
            e.target.reset();
            setTimeout(() => { btn.textContent = originalText; }, 3000);
        }, 1500);
    });
})();

/* =========================================================
   PRODUCT PAGE (pages/product.html)
========================================================= */
(function () {
    const qtyInput = document.getElementById('qty-input');
    if (!qtyInput) return;

    qtyInput.previousElementSibling.addEventListener('click', () => { if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1; });
    qtyInput.nextElementSibling.addEventListener('click', () => { qtyInput.value = parseInt(qtyInput.value) + 1; });

    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
        const product = { id: 'prod-1', name: 'Premium Wireless Headphones', price: 349.99, image: '../Sources/audio/Product1.jpg', category: 'Audio', qty: parseInt(qtyInput.value) };
        let cartItems = [];
        try { cartItems = JSON.parse(localStorage.getItem('cartItems')) || []; } catch(e) {}
        const idx = cartItems.findIndex(i => i.id === product.id);
        if (idx > -1) cartItems[idx].qty += product.qty;
        else cartItems.push(product);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        window.dispatchEvent(new Event('cartUpdated'));
        const btn = document.getElementById('add-to-cart-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Added!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    });
})();

/* =========================================================
   SHOP PAGE (pages/shop.html) - Static filter/search
========================================================= */
(function () {
    if (!document.querySelector('.shop-grid')) return;

    function applyFilters() {
        const selectedCategory = document.querySelector('input[name="category"]:checked').value;
        const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
        const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;

        const cards = document.querySelectorAll('.shop-grid .card');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category') || '';
            const priceEl = card.querySelector('.price');
            const price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
            const categoryMatch = selectedCategory === 'All Products' || cardCategory === selectedCategory;
            const priceMatch = price >= minPrice && price <= maxPrice;

            if (categoryMatch && priceMatch) {
                card.classList.remove('card-hidden');
                visibleCount++;
            } else {
                card.classList.add('card-hidden');
            }
        });

        const resultText = document.getElementById('result-count');
        if (resultText) {
            resultText.textContent = 'Showing ' + visibleCount + ' result' + (visibleCount !== 1 ? 's' : '');
        }
    }

    const applyBtn = document.getElementById('apply-filters-btn');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);

    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', applyFilters);
    });

    document.addEventListener('DOMContentLoaded', () => {
        const params = new URLSearchParams(window.location.search);

        const categoryParam = params.get('category');
        if (categoryParam) {
            const radio = document.querySelector('input[name="category"][value="' + categoryParam + '"]');
            if (radio) { radio.checked = true; applyFilters(); }
        }

        const searchParam = params.get('search');
        if (searchParam) {
            const searchTerm = searchParam.toLowerCase();
            document.querySelectorAll('.card[data-category]').forEach(card => {
                const name = (card.querySelector('.card-body a') || card.querySelector('a'))?.textContent.toLowerCase() || '';
                const category = (card.dataset.category || '').toLowerCase();
                if (name.includes(searchTerm) || category.includes(searchTerm)) {
                    card.classList.remove('card-hidden');
                } else {
                    card.classList.add('card-hidden');
                }
            });
            const visible = document.querySelectorAll('.card[data-category]:not(.card-hidden)').length;
            const countEl = document.getElementById('result-count');
            if (countEl) countEl.textContent = `Showing ${visible} result${visible !== 1 ? 's' : ''} for "${searchParam}"`;
        }
    });
})();

/* =========================================================
   SHOP PAGE - Static HTML fallback sort
========================================================= */
document.addEventListener('DOMContentLoaded', function () {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function () {
        const grid = document.querySelector('.shop-grid');
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.card[data-category]'));
        if (cards.length === 0) return;

        const val = sortSelect.value;
        const getPrice = card => {
            const el = card.querySelector('.price');
            return el ? parseFloat(el.textContent.replace(/[^0-9.]/g, '')) : 0;
        };

        let sorted;
        if (val === 'price-asc') {
            sorted = cards.slice().sort((a, b) => getPrice(a) - getPrice(b));
        } else if (val === 'price-desc') {
            sorted = cards.slice().sort((a, b) => getPrice(b) - getPrice(a));
        } else if (val === 'latest') {
            sorted = cards.slice().reverse();
        } else if (val === 'rating' || val === 'popularity') {
            sorted = cards.slice().sort((a, b) => {
                const na = a.querySelector('.card-body a')?.textContent.trim() || '';
                const nb = b.querySelector('.card-body a')?.textContent.trim() || '';
                return na.localeCompare(nb);
            });
        } else {
            sorted = cards.slice().sort((a, b) => parseInt(a.dataset.origIndex || 0) - parseInt(b.dataset.origIndex || 0));
        }

        if (!cards[0].dataset.origIndex) {
            cards.forEach((c, i) => c.dataset.origIndex = i);
            sorted.forEach((c, i) => c.dataset.origIndex = cards.indexOf(c));
        }

        sorted.forEach(card => grid.appendChild(card));
    });
});

/* =========================================================
   SHOP PAGE - Enhanced dynamic rendering & advanced filters
========================================================= */
(function () {
    if (typeof StockManager === 'undefined') return;

    const products = StockManager.getProducts();
    if (!products || products.length === 0) return;

    const shopGrid = document.querySelector('.shop-grid');
    if (!shopGrid) return;

    function renderProducts(filteredProducts) {
        shopGrid.innerHTML = filteredProducts.map(p => `
            <article class="card" data-category="${p.category}" data-brand="${p.brand}" data-price="${p.price}" data-rating="${p.rating}" data-stock="${p.stock}">
                <a href="product.html">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='../Sources/laptops/Product1.jpg'">
                </a>
                <div class="card-body">
                    <a href="product.html">${p.name}</a>
                    <span class="category-tag">${p.category}</span>
                    <div class="price-row">
                        <span class="price">$${p.price.toFixed(2)}</span>
                        <button class="btn add-btn" aria-label="Add to cart"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </article>
        `).join('');

        document.querySelectorAll('button[aria-label="Add to cart"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest('.card');
                let name = 'Product', price = 0, image = '', category = '';
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
                if (existing) { existing.qty++; } else { cartItems.push({ name, price, image, category, qty: 1 }); }
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                window.dispatchEvent(new Event('cartUpdated'));
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.classList.add('btn-added');
                setTimeout(() => { btn.innerHTML = original; btn.classList.remove('btn-added'); }, 1500);
            });
        });
    }

    const sidebar = document.querySelector('.shop-sidebar-card');
    if (!sidebar) return;

    const brands = [...new Set(products.map(p => p.brand))].sort();

    sidebar.innerHTML = `
        <h3 class="sidebar-filter-title">Filters</h3>
        <div class="shop-filter-section">
            <h4>Categories</h4>
            <label class="shop-filter-label"><input type="radio" name="category" value="" checked class="shop-filter-radio"> All Products</label>
            <label class="shop-filter-label"><input type="radio" name="category" value="Laptops & PCs" class="shop-filter-radio"> Laptops &amp; PCs</label>
            <label class="shop-filter-label"><input type="radio" name="category" value="Smartphones" class="shop-filter-radio"> Smartphones</label>
            <label class="shop-filter-label"><input type="radio" name="category" value="Audio" class="shop-filter-radio"> Audio</label>
            <label class="shop-filter-label"><input type="radio" name="category" value="Wearables" class="shop-filter-radio"> Wearables</label>
            <label class="shop-filter-label"><input type="radio" name="category" value="Cameras" class="shop-filter-radio"> Cameras</label>
        </div>
        <div class="shop-filter-section">
            <h4>Price Range</h4>
            <div class="shop-price-row">
                <input type="number" id="min-price" placeholder="Min" class="shop-price-input">
                <span>-</span>
                <input type="number" id="max-price" placeholder="Max" class="shop-price-input">
            </div>
            <div id="price-error" class="shop-price-error"></div>
        </div>
        <div class="shop-filter-section">
            <h4>Brands</h4>
            <div id="brand-checkboxes" class="brand-checkboxes-list">
                ${brands.map(b => `<label class="shop-filter-label"><input type="checkbox" name="brand" value="${b}" class="shop-filter-radio"> ${b}</label>`).join('')}
            </div>
        </div>
        <div class="shop-filter-section">
            <h4>Minimum Rating</h4>
            <select id="min-rating" class="shop-sort-select">
                <option value="0">Any Rating</option>
                <option value="1">1&#9733; &amp; up</option>
                <option value="2">2&#9733; &amp; up</option>
                <option value="3">3&#9733; &amp; up</option>
                <option value="4">4&#9733; &amp; up</option>
                <option value="5">5&#9733; only</option>
            </select>
        </div>
        <div class="shop-filter-section">
            <h4>Availability</h4>
            <label class="shop-filter-label"><input type="checkbox" id="in-stock-only" class="shop-filter-radio"> In Stock Only</label>
        </div>
        <button id="apply-filters-btn" class="btn border-button">Apply Filters</button>
        <button id="clear-filters-btn" class="btn link-button">Clear All Filters</button>
    `;

    function applyFilters() {
        const category = document.querySelector('input[name="category"]:checked')?.value || '';
        const minPrice = parseFloat(document.getElementById('min-price').value) || null;
        const maxPrice = parseFloat(document.getElementById('max-price').value) || null;
        const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
        const minRating = parseFloat(document.getElementById('min-rating').value) || 0;
        const inStockOnly = document.getElementById('in-stock-only').checked;

        const priceError = document.getElementById('price-error');
        if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
            priceError.textContent = 'Minimum price cannot exceed maximum price';
            priceError.classList.add('price-error-visible');
            return;
        }
        priceError.classList.remove('price-error-visible');

        let filtered = products.filter(p => {
            if (category && p.category !== category) return false;
            if (minPrice !== null && p.price < minPrice) return false;
            if (maxPrice !== null && p.price > maxPrice) return false;
            if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
            if (p.rating < minRating) return false;
            if (inStockOnly && p.stock <= 0) return false;
            return true;
        });

        const sortVal = document.getElementById('sort-select')?.value || 'default';
        if (sortVal === 'price-asc') filtered = filtered.slice().sort((a, b) => a.price - b.price);
        else if (sortVal === 'price-desc') filtered = filtered.slice().sort((a, b) => b.price - a.price);
        else if (sortVal === 'rating') filtered = filtered.slice().sort((a, b) => b.rating - a.rating);
        else if (sortVal === 'popularity') filtered = filtered.slice().sort((a, b) => b.stock - a.stock);
        else if (sortVal === 'latest') filtered = filtered.slice().reverse();

        renderProducts(filtered);

        const resultCount = document.getElementById('result-count');
        if (resultCount) resultCount.textContent = `Showing ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (minPrice !== null) params.set('minPrice', minPrice);
        if (maxPrice !== null) params.set('maxPrice', maxPrice);
        if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
        if (minRating > 0) params.set('minRating', minRating);
        if (inStockOnly) params.set('inStock', '1');
        const newUrl = params.toString() ? `?${params.toString()}` : location.pathname;
        history.replaceState(null, '', newUrl);
    }

    function clearFilters() {
        document.querySelector('input[name="category"][value=""]').checked = true;
        document.getElementById('min-price').value = '';
        document.getElementById('max-price').value = '';
        document.querySelectorAll('input[name="brand"]:checked').forEach(cb => cb.checked = false);
        document.getElementById('min-rating').value = '0';
        document.getElementById('in-stock-only').checked = false;
        applyFilters();
    }

    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
    document.querySelectorAll('input[name="category"]').forEach(r => r.addEventListener('change', applyFilters));
    document.getElementById('sort-select').addEventListener('change', applyFilters);

    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) {
        const radio = document.querySelector(`input[name="category"][value="${params.get('category')}"]`);
        if (radio) radio.checked = true;
    }
    if (params.get('minPrice')) document.getElementById('min-price').value = params.get('minPrice');
    if (params.get('maxPrice')) document.getElementById('max-price').value = params.get('maxPrice');
    if (params.get('brands')) {
        params.get('brands').split(',').forEach(b => {
            const cb = document.querySelector(`input[name="brand"][value="${b}"]`);
            if (cb) cb.checked = true;
        });
    }
    if (params.get('minRating')) document.getElementById('min-rating').value = params.get('minRating');
    if (params.get('inStock') === '1') document.getElementById('in-stock-only').checked = true;

    applyFilters();
})();

/* =========================================================
   DASHBOARD PAGE (pages/dashboard.html)
========================================================= */
(function () {
    if (!document.getElementById('view-admin')) return;

    // SPA ROUTER
    const VIEWS = {
        login:     document.getElementById('view-login'),
        register:  document.getElementById('view-register'),
        admin:     document.getElementById('view-admin'),
        home:      document.getElementById('adm-home'),
        stock:     document.getElementById('adm-stock'),
        stockForm: document.getElementById('adm-stock-form'),
        cart:      document.getElementById('adm-cart'),
    };

    function showView(name) {
        VIEWS.login.classList.add('hidden-btn');
        VIEWS.register.classList.add('hidden-btn');
        VIEWS.admin.classList.remove('hidden-btn');
        VIEWS.home.classList.toggle('hidden-btn', name !== 'home');
        VIEWS.stock.classList.toggle('hidden-btn', name !== 'stock');
        VIEWS.stockForm.classList.toggle('hidden-btn', name !== 'stockForm');
        VIEWS.cart.classList.toggle('hidden-btn', name !== 'cart');
        document.querySelectorAll('.admin-sidebar nav a[data-view]').forEach(a => {
            a.classList.toggle('active', a.dataset.view === name);
        });
        const titles = { home: 'Dashboard', stock: 'Stock Management', stockForm: 'Product Form', cart: 'Cart View' };
        document.getElementById('adm-page-title').textContent = titles[name] || 'Dashboard';
    }

    document.addEventListener('click', e => {
        const link = e.target.closest('[data-view]');
        if (!link) return;
        e.preventDefault();
        const v = link.dataset.view;
        if (v === 'stock-form') navigate('stockForm');
        else navigate(v);
    });

    function navigate(view) {
        if (view === 'stockForm') {
            currentEditId = null;
            document.getElementById('adm-page-title').textContent = 'Add New Product';
            resetStockForm();
        }
        if (view === 'stock') renderTable();
        if (view === 'cart') renderAdminCart();
        if (view === 'home') renderDashboard();
        showView(view);
    }

    // INIT
    function init() {
        document.getElementById('adm-uname').textContent = 'Admin';
        document.getElementById('welcome-name').textContent = 'Admin';
        document.getElementById('adm-avatar').textContent = 'A';
        document.getElementById('logout-btn').classList.add('hidden-btn');
        document.getElementById('logout-top').classList.add('hidden-btn');
        showView('home');
        renderDashboard();
        const products = StockManager.getProducts();
        if (!products.some(p => p.stock > 0 && p.stock <= 5)) { StockManager.resetSeed(); renderDashboard(); }
    }

    // MOBILE SIDEBAR
    const adminSidebar = document.getElementById('adm-sidebar');
    const adminOverlay = document.getElementById('adm-overlay');
    document.getElementById('adm-menu-toggle').addEventListener('click', () => {
        adminSidebar.classList.toggle('sidebar-open');
        adminOverlay.classList.toggle('active');
    });
    adminOverlay.addEventListener('click', () => {
        adminSidebar.classList.remove('sidebar-open');
        adminOverlay.classList.remove('active');
    });

    // DASHBOARD
    let barChart = null, doughnutChart = null;
    const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

    function computeKPIs(products) {
        const cats = ['Laptops & PCs', 'Smartphones', 'Audio', 'Wearables', 'Cameras'];
        const perCatP = {}, perCatS = {};
        cats.forEach(c => { perCatP[c] = 0; perCatS[c] = 0; });
        let totalStock = 0, outOfStock = 0, totalValue = 0;
        const lowStock = [];
        products.forEach(p => {
            totalStock += p.stock;
            if (p.stock === 0) outOfStock++;
            totalValue += p.price * p.stock;
            if (p.stock > 0 && p.stock <= 5) lowStock.push(p);
            if (perCatP[p.category] !== undefined) { perCatP[p.category]++; perCatS[p.category] += p.stock; }
        });
        return { total: products.length, totalStock, outOfStock, totalValue, perCatP, perCatS, lowStock };
    }

    function renderDashboard() {
        const products = StockManager.getProducts();
        const k = computeKPIs(products);
        const cats = Object.keys(k.perCatP);

        document.getElementById('kpi-grid').innerHTML = `
            <div class="adm-kpi k-blue"><div class="adm-kpi-icon k-blue"><i class="fas fa-box-open"></i></div><div><p class="adm-kpi-val">${k.total}</p><p class="adm-kpi-lbl">Total Products</p></div></div>
            <div class="adm-kpi k-green"><div class="adm-kpi-icon k-green"><i class="fas fa-cubes"></i></div><div><p class="adm-kpi-val">${k.totalStock.toLocaleString()}</p><p class="adm-kpi-lbl">Stock Units</p></div></div>
            <div class="adm-kpi k-red"><div class="adm-kpi-icon k-red"><i class="fas fa-times-circle"></i></div><div><p class="adm-kpi-val">${k.outOfStock}</p><p class="adm-kpi-lbl">Out of Stock</p></div></div>
            <div class="adm-kpi k-amber"><div class="adm-kpi-icon k-amber"><i class="fas fa-dollar-sign"></i></div><div><p class="adm-kpi-val">$${(k.totalValue / 1000).toFixed(1)}K</p><p class="adm-kpi-lbl">Inventory Value</p></div></div>`;

        const barCtx = document.getElementById('bar-chart').getContext('2d');
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, { type: 'bar', data: { labels: cats, datasets: [{ label: 'Products', data: cats.map(c => k.perCatP[c]), backgroundColor: COLORS, borderRadius: 6, borderSkipped: false }] }, options: { responsive: true, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8 } }, scales: { y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { display: false } } } } });
        document.getElementById('bar-chart-body').innerHTML = cats.map(c => `<tr><td>${c}</td><td>${k.perCatP[c]}</td></tr>`).join('');

        const dCtx = document.getElementById('doughnut-chart').getContext('2d');
        if (doughnutChart) doughnutChart.destroy();
        doughnutChart = new Chart(dCtx, { type: 'doughnut', data: { labels: cats, datasets: [{ data: cats.map(c => k.perCatS[c]), backgroundColor: COLORS, borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }] }, options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 }, color: '#334155', usePointStyle: true, pointStyleWidth: 8 } }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8 } } } });
        document.getElementById('doughnut-chart-body').innerHTML = cats.map(c => `<tr><td>${c}</td><td>${k.perCatS[c]}</td></tr>`).join('');

        const tbl = document.getElementById('low-stock-table');
        if (k.lowStock.length === 0) {
            tbl.innerHTML = `<div class="alert-table-empty"><i class="icon-fa-check-ok"></i><strong>All good!</strong> No products are running low on stock.</div>`;
        } else {
            tbl.innerHTML = `<table><thead><tr><th>Product</th><th>Category</th><th>Brand</th><th>Stock</th><th>Action</th></tr></thead><tbody>${k.lowStock.map(p => `<tr><td class="stock-product-name">${p.name}</td><td><span class="category-tag">${p.category}</span></td><td>${p.brand}</td><td><span class="stock-badge-low"><i class="icon-fa-exclamation"></i> ${p.stock} left</span></td><td><a href="#" class="edit-product-btn" data-id="${p.id}"><i class="fas fa-edit"></i> Update</a></td></tr>`).join('')}</tbody></table>`;
            document.querySelectorAll('.edit-product-btn').forEach(btn => {
                btn.addEventListener('click', e => { e.preventDefault(); openEditForm(btn.dataset.id); });
            });
        }
    }

    window.addEventListener('storage', e => {
        if (e.key === 'techhavenStock' && !document.getElementById('adm-home').classList.contains('hidden-btn')) renderDashboard();
    });

    // STOCK TABLE
    const PAGE_SIZE = 10;
    let currentPage = 1, sortCol = 'name', sortDir = 'asc', searchQuery = '', categoryFilter = '';

    function showNotification(msg) {
        const bar = document.getElementById('notification-bar');
        document.getElementById('notification-msg').textContent = msg;
        bar.classList.add('success');
        setTimeout(() => bar.classList.remove('success'), 4000);
    }

    function getFiltered() {
        let products = StockManager.getProducts();
        if (searchQuery) { const q = searchQuery.toLowerCase(); products = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)); }
        if (categoryFilter) products = products.filter(p => p.category === categoryFilter);
        products.sort((a, b) => {
            let av = a[sortCol], bv = b[sortCol];
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return products;
    }

    function renderTable() {
        const products = getFiltered();
        const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * PAGE_SIZE;
        const pageItems = products.slice(start, start + PAGE_SIZE);
        const container = document.getElementById('stock-table-container');

        if (products.length === 0) {
            container.innerHTML = `<div class="admin-empty-state"><i class="fas fa-box-open"></i><h3>No products found</h3><p>Add your first product to get started.</p><a href="#" class="btn lg-button" data-view="stock-form">Add New Product</a></div>`;
            document.getElementById('pagination-bar').innerHTML = '';
            return;
        }

        const cols = [{ key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'brand', label: 'Brand' }, { key: 'price', label: 'Price' }, { key: 'stock', label: 'Stock' }, { key: 'rating', label: 'Rating' }, { key: 'available', label: 'Available' }];
        const thead = cols.map(c => {
            const isSorted = sortCol === c.key;
            const icon = isSorted ? (sortDir === 'asc' ? 'icon-fa-sort-up' : 'icon-fa-sort-down') : 'icon-fa-sort';
            return `<th class="${isSorted ? 'sorted' : ''}" data-col="${c.key}" aria-sort="${isSorted ? sortDir + 'ending' : 'none'}">${c.label} <i class="${icon}"></i></th>`;
        }).join('') + '<th>Actions</th>';

        const tbody = pageItems.map(p => `
            <tr>
                <td class="stock-product-name">${p.name}</td>
                <td><span class="category-tag">${p.category}</span></td>
                <td>${p.brand}</td>
                <td><strong class="cart-price">$${p.price.toFixed(2)}</strong></td>
                <td>${p.stock === 0 ? '<span class="stock-badge-out">Out of Stock</span>' : p.stock <= 5 ? `<span class="stock-badge-low">${p.stock}</span>` : `<span class="stock-badge-ok">${p.stock}</span>`}</td>
                <td>${p.rating.toFixed(1)}</td>
                <td>${p.available ? '<span class="status-yes"><i class="fas fa-check-circle"></i> Yes</span>' : '<span class="status-no"><i class="fas fa-times-circle"></i> No</span>'}</td>
                <td><div class="action-btns"><button class="btn-edit edit-btn" data-id="${p.id}" title="Edit"><i class="fas fa-edit"></i></button><button class="btn-delete delete-btn" data-id="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" title="Delete"><i class="fas fa-trash"></i></button></div></td>
            </tr>`).join('');

        container.innerHTML = `<table class="stock-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;

        container.querySelectorAll('th[data-col]').forEach(th => {
            th.addEventListener('click', () => {
                if (sortCol === th.dataset.col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
                else { sortCol = th.dataset.col; sortDir = 'asc'; }
                currentPage = 1;
                renderTable();
            });
        });
        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditForm(btn.dataset.id)));
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete "${btn.dataset.name}"? This action cannot be undone.`)) {
                    StockManager.deleteProduct(btn.dataset.id);
                    showNotification(`"${btn.dataset.name}" has been deleted.`);
                    renderTable();
                }
            });
        });

        const pageCount = Math.ceil(products.length / PAGE_SIZE);
        let pageButtons = '';
        for (let i = 1; i <= pageCount; i++) pageButtons += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        document.getElementById('pagination-bar').innerHTML = `
            <span class="pagination-info">Showing ${start + 1}&ndash;${Math.min(start + PAGE_SIZE, products.length)} of ${products.length} products</span>
            <div class="pagination-controls">
                <button class="page-btn" id="prev-btn" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                ${pageButtons}
                <button class="page-btn" id="next-btn" ${currentPage === pageCount ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
            </div>`;

        document.querySelectorAll('.page-btn[data-page]').forEach(btn => btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderTable(); }));
        const prev = document.getElementById('prev-btn'), next = document.getElementById('next-btn');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < pageCount) { currentPage++; renderTable(); } });
    }

    let searchTimer;
    document.getElementById('search-input').addEventListener('input', e => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { searchQuery = e.target.value.trim(); currentPage = 1; renderTable(); }, 300); });
    document.getElementById('category-filter').addEventListener('change', e => { categoryFilter = e.target.value; currentPage = 1; renderTable(); });

    // STOCK FORM
    let currentEditId = null;

    function resetStockForm() {
        document.getElementById('stock-form').reset();
        document.getElementById('f-available').checked = true;
        document.getElementById('not-found-banner').classList.remove('visible');
        document.getElementById('stock-form').classList.remove('hidden-form');
        document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
        document.querySelectorAll('#stock-form input,#stock-form select').forEach(el => el.classList.remove('error'));
        currentEditId = null;
        document.getElementById('adm-page-title').textContent = 'Add New Product';
    }

    function openEditForm(id) {
        const product = StockManager.getProductById(id);
        resetStockForm();
        if (!product) {
            document.getElementById('not-found-banner').classList.add('visible');
            document.getElementById('stock-form').classList.add('hidden-form');
        } else {
            currentEditId = id;
            document.getElementById('adm-page-title').textContent = 'Edit Product';
            document.getElementById('f-name').value = product.name;
            document.getElementById('f-category').value = product.category;
            document.getElementById('f-brand').value = product.brand;
            document.getElementById('f-price').value = product.price;
            document.getElementById('f-stock').value = product.stock;
            document.getElementById('f-rating').value = product.rating;
            document.getElementById('f-image').value = product.image || '';
            document.getElementById('f-available').checked = product.available;
        }
        showView('stockForm');
    }

    function showFormError(id, msg) {
        const el = document.getElementById(id + '-error');
        const inp = document.getElementById(id);
        if (el) { el.textContent = msg; el.classList.add('visible'); }
        if (inp) inp.classList.add('error');
    }

    function clearFormErrors() {
        document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
        document.querySelectorAll('#stock-form input,#stock-form select').forEach(el => el.classList.remove('error'));
    }

    document.getElementById('stock-form').addEventListener('submit', function (e) {
        e.preventDefault();
        clearFormErrors();
        const name = document.getElementById('f-name').value.trim();
        const category = document.getElementById('f-category').value;
        const brand = document.getElementById('f-brand').value.trim();
        const price = parseFloat(document.getElementById('f-price').value);
        const stock = parseInt(document.getElementById('f-stock').value, 10);
        const rating = parseFloat(document.getElementById('f-rating').value) || 0;
        const image = document.getElementById('f-image').value.trim();
        const available = document.getElementById('f-available').checked;
        let valid = true;
        if (!name) { showFormError('f-name', 'Product name is required'); valid = false; }
        if (!category) { showFormError('f-category', 'Category is required'); valid = false; }
        if (!brand) { showFormError('f-brand', 'Brand is required'); valid = false; }
        if (isNaN(price) || price < 0) { showFormError('f-price', 'Price must be 0 or greater'); valid = false; }
        if (isNaN(stock) || stock < 0) { showFormError('f-stock', 'Stock quantity must be 0 or greater'); valid = false; }
        if (rating < 0 || rating > 5) { showFormError('f-rating', 'Rating must be between 0 and 5'); valid = false; }
        if (!valid) return;
        const data = { name, category, brand, price, stock, rating, available, image };
        if (currentEditId) StockManager.updateProduct(currentEditId, data);
        else StockManager.addProduct(data);
        showNotification(currentEditId ? 'Product updated successfully!' : 'Product added successfully!');
        navigate('stock');
    });

    // ADMIN CART VIEW
    function renderAdminCart() {
        let cartItems = [];
        try { cartItems = JSON.parse(localStorage.getItem('cartItems')) || []; } catch (e) {}
        const container = document.getElementById('cart-content');
        if (cartItems.length === 0) {
            container.innerHTML = `<div class="cart-table-card"><div class="admin-cart-empty"><i class="fas fa-shopping-cart"></i><h3>The cart is currently empty</h3><p>No items have been added to the cart yet.</p><a href="shop.html" class="btn border-button">View Store</a></div></div>`;
            return;
        }
        const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
        const rows = cartItems.map(item => `
            <tr>
                <td><img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='../Sources/laptops/Product1.jpg'"></td>
                <td><div class="cart-item-name">${item.name}</div><div class="cart-item-cat">${item.category}</div></td>
                <td>$${item.price.toFixed(2)}</td>
                <td><strong>${item.qty}</strong></td>
                <td><strong class="cart-price">$${(item.price * item.qty).toFixed(2)}</strong></td>
            </tr>`).join('');
        container.innerHTML = `
            <div class="admin-cart-layout">
                <div class="cart-table-card">
                    <table class="admin-cart-table">
                        <thead><tr><th>Image</th><th>Product</th><th>Unit Price</th><th>Qty</th><th>Line Total</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div class="admin-summary-card">
                    <h3 class="admin-summary-title">Order Summary</h3>
                    <div class="summary-row"><span>Items (${totalQty})</span><span class="summary-row-value">$${subtotal.toFixed(2)}</span></div>
                    <div class="summary-row"><span>Shipping</span><span class="summary-row-free">Free</span></div>
                    <div class="summary-row"><span>Tax (8%)</span><span class="summary-row-value">$${tax.toFixed(2)}</span></div>
                    <div class="summary-total-row"><span>Total</span><span class="summary-total-value">$${total.toFixed(2)}</span></div>
                    <p class="summary-note"><i class="fas fa-info-circle"></i> Read-only snapshot of the current cart.</p>
                </div>
            </div>`;
    }

    // DELETE STOCK MODAL
    const deleteModal = document.getElementById('delete-modal');
    let deleteSelected = new Set();

    function openDeleteModal() {
        deleteSelected.clear();
        renderDeleteList('');
        document.getElementById('delete-modal-search').value = '';
        deleteModal.classList.add('open');
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('open');
    }

    function renderDeleteList(query) {
        const products = StockManager.getProducts();
        const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase())) : products;
        const list = document.getElementById('delete-modal-list');
        if (filtered.length === 0) { list.innerHTML = '<div class="delete-modal-empty">No products found</div>'; return; }
        list.innerHTML = filtered.map(p => `
            <label class="delete-modal-item">
                <input type="checkbox" data-id="${p.id}" ${deleteSelected.has(p.id) ? 'checked' : ''} class="delete-modal-item-checkbox">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='../Sources/laptops/Product1.jpg'" class="delete-modal-item-img">
                <div class="delete-modal-item-info">
                    <div class="delete-modal-item-name">${p.name}</div>
                    <div class="delete-modal-item-meta">${p.category} &middot; ${p.brand}</div>
                </div>
                <span class="delete-modal-item-price">$${p.price.toFixed(2)}</span>
            </label>`).join('');
        list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) deleteSelected.add(cb.dataset.id);
                else deleteSelected.delete(cb.dataset.id);
                updateDeleteCount();
            });
        });
    }

    function updateDeleteCount() {
        const n = deleteSelected.size;
        document.getElementById('delete-modal-count').textContent = `${n} selected`;
        document.getElementById('delete-modal-confirm').disabled = n === 0;
    }

    document.getElementById('delete-stock-btn').addEventListener('click', e => { e.preventDefault(); openDeleteModal(); });
    document.getElementById('delete-modal-cancel').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-modal-backdrop').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-modal-search').addEventListener('input', e => { renderDeleteList(e.target.value.trim()); });
    document.getElementById('delete-modal-confirm').addEventListener('click', () => {
        const count = deleteSelected.size;
        if (!confirm(`Permanently delete ${count} product${count > 1 ? 's' : ''}? This cannot be undone.`)) return;
        deleteSelected.forEach(id => StockManager.deleteProduct(id));
        closeDeleteModal();
        showNotification(`${count} product${count > 1 ? 's' : ''} deleted successfully.`);
        renderDashboard();
        if (!document.getElementById('adm-stock').classList.contains('hidden-btn')) renderTable();
    });

    init();
})();
