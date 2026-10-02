import { MARKETPLACE_PRODUCTS, DEFAULT_BUYER_USER, SAMPLE_BUYER_ORDERS } from './data';
import { Product, BuyerUser, BuyerOrder } from './types';
import { authManager } from './auth';

/**
 * GRAMBANDHAN (গ্রামীণ বন্ধন) - COMPREHENSIVE MARKETPLACE CONTROLLER
 * Feature Domain: Marketplace Sector (src/marketplace.ts)
 * 
 * Features:
 * 1. Storefront matching Image 1:
 *    - Search bar with instant autocomplete (typing 'R' suggests 16+ products starting with 'R')
 *    - Category Filter Chips (ALL, Farming, Handicrafts, Dairy, Fisheries, Spices, Fruits)
 *    - ⚡ Flash Offers section with live countdown timer
 *    - 100 authentic Bangladeshi products in Taka (৳) with discount tags, seller info, and ratings
 * 2. Product Detail modal matching Image 2:
 *    - Carousel gallery, pricing, ৳20 voucher banner, verified producer card, bilingual specs, reviews
 *    - Sticky bottom bar: Chat, Save, ADD TO CART, BUY NOW
 * 3. Cart Drawer matching Image 3:
 *    - Grouped by seller, stepper buttons [-] qty [+], voucher code input, free shipping bar, recommendations
 * 4. Checkout View matching Image 4:
 *    - Address card, items list, official bKash, Nagad, and Cash on Delivery payment gateways with SVG logos
 *    - Order confirmation screen with tracking link
 * 5. Buyer Profile & Order Tracking:
 *    - 🚚 On The Way / In Transit (পথিমধ্যে ডেলিভারি) active orders with multi-step live tracking
 *    - ✅ Previous Purchases / Delivered (পূর্ববর্তী ক্রয়কৃত পণ্য)
 *    - ❌ Cancelled Orders (বাতিলকৃত অর্ডার)
 *    - ⚙️ Settings (অ্যাকাউন্ট ও সেটিংস)
 * 6. Mandatory Sign-in Protection:
 *    - Clicking '+' on product cards or 'Buy Now' / 'Checkout' prompts sign-in (with 1-Click Demo Login)
 */

interface CartItem {
  product: Product;
  quantity: number;
}

export class MarketplaceController {
  private cart: CartItem[] = [];
  private activeView: 'storefront' | 'detail' | 'cart' | 'checkout' | 'profile' = 'storefront';
  private selectedProductId: string | null = null;
  private currentCategory: string = 'all';
  private searchQuery: string = '';
  private appliedVoucher: { code: string; discountBDT: number } | null = null;
  private selectedPaymentMethod: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash on Delivery' = 'bKash';
  private currentProfileTab: 'on_the_way' | 'delivered' | 'cancelled' | 'settings' = 'on_the_way';
  private buyerSession: BuyerUser | null = null;
  private orders: BuyerOrder[] = [];
  private pendingAuthAction: (() => void) | null = null;
  private flashTimerSeconds: number = 15512; // ~04h 18m 32s
  private timerInterval: any = null;

  constructor() {
    this.loadState();
  }

  public init(): void {
    this.renderHomepagePreviewGrid();
    this.setupGlobalTriggers();
    this.startFlashTimer();
    this.initBuyerAuthDialog();
  }

  private loadState(): void {
    try {
      const savedCart = localStorage.getItem('gb_market_cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
      const savedBuyer = localStorage.getItem('gb_buyer_session');
      if (savedBuyer) {
        this.buyerSession = JSON.parse(savedBuyer);
      } else if (authManager.isAuthenticated()) {
        const u = authManager.getUser();
        if (u) {
          this.buyerSession = {
            name: u.name,
            email: u.email,
            phone: u.phone,
            address: 'House 14, Road 5, Dhanmondi',
            city: 'Dhaka',
            district: 'Dhaka',
            preferredPayment: 'bKash',
            memberSince: 'March 2026'
          };
        }
      }
      const savedOrders = localStorage.getItem('gb_buyer_orders');
      if (savedOrders) {
        this.orders = JSON.parse(savedOrders);
      } else {
        this.orders = [...SAMPLE_BUYER_ORDERS];
        localStorage.setItem('gb_buyer_orders', JSON.stringify(this.orders));
      }
    } catch (e) {
      console.warn('LocalStorage error in MarketplaceController:', e);
      this.orders = [...SAMPLE_BUYER_ORDERS];
    }
  }

  private saveCart(): void {
    try {
      localStorage.setItem('gb_market_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.warn(e);
    }
    this.updateCartBadge();
  }

  private saveOrders(): void {
    try {
      localStorage.setItem('gb_buyer_orders', JSON.stringify(this.orders));
    } catch (e) {
      console.warn(e);
    }
  }

  private startFlashTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.flashTimerSeconds > 0) {
        this.flashTimerSeconds--;
        this.updateFlashTimerDisplay();
      }
    }, 1000);
  }

  private updateFlashTimerDisplay(): void {
    const hours = Math.floor(this.flashTimerSeconds / 3600);
    const mins = Math.floor((this.flashTimerSeconds % 3600) / 60);
    const secs = this.flashTimerSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hEl = document.getElementById('flash-h');
    const mEl = document.getElementById('flash-m');
    const sEl = document.getElementById('flash-s');

    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(mins);
    if (sEl) sEl.textContent = pad(secs);
  }

  // --------------------------------------------------------------------------
  // HOMEPAGE PREVIEW (Preserving existing layout)
  // --------------------------------------------------------------------------
  public renderHomepagePreviewGrid(): void {
    const container = document.getElementById('marketplace-preview-grid');
    if (!container) return;

    // Show 4 representative items on homepage preview
    const previewItems = MARKETPLACE_PRODUCTS.slice(0, 4);
    container.innerHTML = previewItems.map(product => `
      <article class="market-card" data-product-id="${product.id}">
        <div class="market-card-image-wrap">
          <img src="${product.image}" alt="${product.name}" class="market-card-img" loading="lazy" />
          <span class="artisan-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            ${product.artisanName} (${product.artisanDistrict})
          </span>
          ${product.discountPercent ? `<span class="market-demo-tag">-${product.discountPercent}%</span>` : ''}
        </div>
        <div class="market-card-content">
          <h4 class="market-title">${product.name}</h4>
          <p class="market-bengali">${product.bengaliName}</p>
          <div class="market-price-row">
            <span class="price">৳${product.priceBDT.toLocaleString()}</span>
            <span class="craft-type">${product.craftType}</span>
          </div>
          <button class="btn btn-sm btn-market" data-action="open-marketplace" data-product-id="${product.id}">
            View in Marketplace →
          </button>
        </div>
      </article>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // GLOBAL LISTENERS FOR MARKETPLACE OPENING & CLOSING
  // --------------------------------------------------------------------------
  private setupGlobalTriggers(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const openBtn = target.closest('[data-action="open-marketplace"]');
      if (openBtn) {
        e.preventDefault();
        const prodId = openBtn.getAttribute('data-product-id');
        if (prodId) {
          this.openProductDetail(prodId);
        } else {
          this.openMarketplace('storefront');
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('marketplace-modal');
        if (modal?.classList.contains('active')) {
          this.closeMarketplace();
        }
      }
    });
  }

  public openMarketplace(view: 'storefront' | 'detail' | 'cart' | 'checkout' | 'profile' = 'storefront'): void {
    const modal = document.getElementById('marketplace-modal');
    if (!modal) return;

    this.activeView = view;
    this.renderMarketplaceApp();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  public closeMarketplace(): void {
    const modal = document.getElementById('marketplace-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  public openMarketplaceModal(): void {
    this.openMarketplace('storefront');
  }

  public closeMarketplaceModal(): void {
    this.closeMarketplace();
  }

  public openProductDetail(productId: string): void {
    this.selectedProductId = productId;
    this.openMarketplace('detail');
  }

  public openCart(): void {
    this.openMarketplace('cart');
  }

  public openCheckout(): void {
    this.requireBuyerAuth(() => {
      if (this.cart.length === 0) {
        this.showToast('Your bag is empty! Add products first.');
        this.openMarketplace('storefront');
        return;
      }
      this.openMarketplace('checkout');
    });
  }

  public openBuyerProfile(tab: 'on_the_way' | 'delivered' | 'cancelled' | 'settings' = 'on_the_way'): void {
    this.requireBuyerAuth(() => {
      this.currentProfileTab = tab;
      this.openMarketplace('profile');
    });
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION GUARD FOR BUYERS
  // --------------------------------------------------------------------------
  private requireBuyerAuth(action: () => void): void {
    if (this.buyerSession) {
      action();
      return;
    }

    this.pendingAuthAction = action;
    this.openBuyerAuthDialog();
  }

  private initBuyerAuthDialog(): void {
    let dialog = document.getElementById('buyer-auth-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'buyer-auth-dialog';
      dialog.className = 'buyer-auth-dialog';
      dialog.innerHTML = `
        <div class="buyer-auth-card">
          <button class="modal-close-btn" id="close-buyer-auth-btn" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748B;">✕</button>
          
          <div class="auth-header-wrap">
            <div style="font-size: 2.2rem; margin-bottom: 6px;">🛍️</div>
            <h3>Sign in to GramBondhon</h3>
            <p>Please sign in to add products to your cart, place orders, and track live deliveries directly from rural producers.</p>
          </div>

          <button type="button" class="btn-demo-buyer-login" id="btn-demo-buyer-auth">
            ⚡ 1-Click Demo Login as Tanvir Ahmed (Dhaka Buyer)
          </button>

          <div class="auth-divider">
            <span>OR SIGN IN WITH MOBILE</span>
          </div>

          <form id="buyer-manual-auth-form" style="display:flex;flex-direction:column;gap:12px;">
            <div class="auth-form-group">
              <label>Mobile Number / Email</label>
              <input type="text" class="auth-form-input" id="auth-input-phone" placeholder="e.g. 01712-889900" value="01712-889900" required />
            </div>
            <div class="auth-form-group">
              <label>Password</label>
              <input type="password" class="auth-form-input" id="auth-input-pwd" placeholder="Enter password" value="password123" required />
            </div>
            <button type="submit" class="btn-submit-auth">Sign In to Continue</button>
          </form>
        </div>
      `;
      document.body.appendChild(dialog);

      // Event listeners for auth dialog
      dialog.querySelector('#close-buyer-auth-btn')?.addEventListener('click', () => {
        this.closeBuyerAuthDialog();
      });

      dialog.querySelector('#btn-demo-buyer-auth')?.addEventListener('click', () => {
        this.loginBuyerAsDemo();
      });

      dialog.querySelector('#buyer-manual-auth-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = (document.getElementById('auth-input-phone') as HTMLInputElement)?.value || '+880 1712-889900';
        this.loginBuyerCustom(phone);
      });
    }
  }

  private openBuyerAuthDialog(): void {
    const dialog = document.getElementById('buyer-auth-dialog');
    if (dialog) dialog.classList.add('active');
  }

  private closeBuyerAuthDialog(): void {
    const dialog = document.getElementById('buyer-auth-dialog');
    if (dialog) dialog.classList.remove('active');
    this.pendingAuthAction = null;
  }

  private loginBuyerAsDemo(): void {
    this.buyerSession = { ...DEFAULT_BUYER_USER };
    try {
      localStorage.setItem('gb_buyer_session', JSON.stringify(this.buyerSession));
    } catch (e) {
      console.warn(e);
    }
    this.closeBuyerAuthDialog();
    this.showToast(`Welcome back, ${this.buyerSession.name}!`);
    this.renderTopBarRight();

    if (this.pendingAuthAction) {
      const act = this.pendingAuthAction;
      this.pendingAuthAction = null;
      act();
    }
  }

  private loginBuyerCustom(phone: string): void {
    this.buyerSession = {
      name: 'Tanvir Ahmed',
      email: 'tanvir.ahmed@buyer.bd',
      phone: phone,
      address: 'Flat 4B, House 18, Road 11, Banani',
      city: 'Dhaka',
      district: 'Dhaka',
      preferredPayment: 'bKash',
      memberSince: 'March 2026'
    };
    try {
      localStorage.setItem('gb_buyer_session', JSON.stringify(this.buyerSession));
    } catch (e) {
      console.warn(e);
    }
    this.closeBuyerAuthDialog();
    this.showToast(`Logged in successfully as ${this.buyerSession.name}!`);
    this.renderTopBarRight();

    if (this.pendingAuthAction) {
      const act = this.pendingAuthAction;
      this.pendingAuthAction = null;
      act();
    }
  }

  public logoutBuyer(): void {
    this.buyerSession = null;
    try {
      localStorage.removeItem('gb_buyer_session');
    } catch (e) {
      console.warn(e);
    }
    this.showToast('Signed out of buyer account');
    this.openMarketplace('storefront');
  }

  // --------------------------------------------------------------------------
  // MASTER RENDERER FOR MARKETPLACE APP WINDOW
  // --------------------------------------------------------------------------
  public renderMarketplaceApp(): void {
    const modal = document.getElementById('marketplace-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="market-app-window" id="market-app-window">
        <!-- Top Sticky Header -->
        <header class="market-top-bar">
          <div class="market-nav-left">
            <button class="market-back-btn" id="market-back-nav" title="Back">
              ←
            </button>
            <div class="market-brand-badge">
              <div class="market-brand-title" style="display:flex;align-items:center;gap:6px;">
                <img src="/images/logo-white.png" alt="GramBandhan" style="height:26px;width:auto;max-width:140px;object-fit:contain;" />
                <span style="font-size:0.75rem;background:#10B981;color:#FFF;padding:1px 6px;border-radius:10px;font-weight:700;">Store</span>
              </div>
            </div>
          </div>

          <!-- Dynamic Search with 'R' Autocomplete Dropdown -->
          <div class="market-search-wrapper">
            <div class="market-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                class="market-search-input" 
                id="market-search-input" 
                placeholder="Search 50+ rural items (try typing 'r' for Rice, Rui, Radhuni...)" 
                value="${this.searchQuery}"
                autocomplete="off"
              />
              <button class="market-search-clear ${this.searchQuery ? 'active' : ''}" id="market-search-clear" title="Clear">✕</button>
            </div>

            <!-- Autocomplete Suggestion Dropdown -->
            <div class="market-search-dropdown" id="market-search-dropdown"></div>
          </div>

          <!-- Right Action Icons: Profile & Cart -->
          <div class="market-nav-right" id="market-nav-right">
            <!-- Rendered by renderTopBarRight() -->
          </div>

          <button class="market-close-modal-btn" id="market-close-all" title="Close Store">✕</button>
        </header>

        <!-- Main View Container -->
        <main class="market-view-container" id="market-view-container">
          <!-- Dynamically inserted view -->
        </main>
      </div>
    `;

    this.renderTopBarRight();
    this.setupTopBarEvents();
    this.renderCurrentView();
  }

  private renderTopBarRight(): void {
    const container = document.getElementById('market-nav-right');
    if (!container) return;

    const totalCartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    container.innerHTML = `
      <!-- Improved Account Button -->
      <button class="market-account-btn" id="btn-top-profile" title="My Account & Orders">
        <div class="account-icon-wrap">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="account-btn-label">
          <span class="account-name-tag">${this.buyerSession ? this.buyerSession.name.split(' ')[0] : 'Account'}</span>
          <span class="account-sub-tag">${this.buyerSession ? 'Orders & Track' : 'Sign In'}</span>
        </div>
        <span class="account-caret">▾</span>
      </button>

      <!-- White & Bold Pill BAG Button -->
      <button class="market-shajgooj-bag-btn" id="btn-top-cart" title="Shopping Bag">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D382A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span class="bag-btn-text">BAG</span>
        <span class="bag-btn-badge" id="top-cart-badge">${totalCartCount}</span>
      </button>
    `;

    document.getElementById('btn-top-profile')?.addEventListener('click', () => {
      this.openBuyerProfile('on_the_way');
    });

    document.getElementById('btn-top-cart')?.addEventListener('click', () => {
      this.openCart();
    });
  }

  private setupTopBarEvents(): void {
    const backBtn = document.getElementById('market-back-nav');
    backBtn?.addEventListener('click', () => {
      if (this.activeView === 'storefront') {
        this.closeMarketplace();
      } else {
        this.activeView = 'storefront';
        this.renderCurrentView();
      }
    });

    const closeBtn = document.getElementById('market-close-all');
    closeBtn?.addEventListener('click', () => {
      this.closeMarketplace();
    });

    // Search input & autocomplete
    const searchInput = document.getElementById('market-search-input') as HTMLInputElement;
    const clearBtn = document.getElementById('market-search-clear');
    const dropdown = document.getElementById('market-search-dropdown');

    searchInput?.addEventListener('input', () => {
      const q = searchInput.value;
      this.searchQuery = q;
      if (clearBtn) {
        if (q.length > 0) clearBtn.classList.add('active');
        else clearBtn.classList.remove('active');
      }
      this.handleSearchAutocomplete(q);

      if (this.activeView === 'storefront') {
        this.renderStorefrontGridOnly();
      }
    });

    searchInput?.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        this.handleSearchAutocomplete(searchInput.value);
      }
    });

    clearBtn?.addEventListener('click', () => {
      this.searchQuery = '';
      if (searchInput) searchInput.value = '';
      clearBtn.classList.remove('active');
      if (dropdown) dropdown.classList.remove('active');
      if (this.activeView === 'storefront') {
        this.renderStorefrontGridOnly();
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      const searchWrap = (e.target as HTMLElement).closest('.market-search-wrapper');
      if (!searchWrap && dropdown) {
        dropdown.classList.remove('active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // SEARCH AUTOCOMPLETE WITH 'R' RECOMMENDATION LOGIC
  // --------------------------------------------------------------------------
  // SEARCH AUTOCOMPLETE WITH 'R' -> RICE RECOMMENDATION LOGIC
  // --------------------------------------------------------------------------
  private handleSearchAutocomplete(query: string): void {
    const dropdown = document.getElementById('market-search-dropdown');
    if (!dropdown) return;

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      dropdown.classList.remove('active');
      return;
    }

    const isRiceProduct = (p: Product) => 
      p.id.toLowerCase().includes('rice') ||
      p.name.toLowerCase().includes('rice') ||
      p.bengaliName.includes('চাল') ||
      p.bengaliName.includes('ধান') ||
      (p.craftType && p.craftType.toLowerCase().includes('paddy'));

    const isRiceSearch = trimmed === 'r' || trimmed === 'র' || trimmed.startsWith('ri') || trimmed === 'rice' || trimmed === 'chal' || trimmed === 'চাল';

    // Filter products:
    // If query is 'r' or 'rice', prioritize all authentic Rice products first
    let matching = MARKETPLACE_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(trimmed) ||
      p.bengaliName.toLowerCase().includes(trimmed) ||
      p.artisanDistrict.toLowerCase().includes(trimmed) ||
      p.category.toLowerCase().includes(trimmed) ||
      (isRiceSearch && isRiceProduct(p))
    );

    if (isRiceSearch) {
      const riceProducts = matching.filter(isRiceProduct);
      const otherProducts = matching.filter(p => !isRiceProduct(p));
      matching = [...riceProducts, ...otherProducts];
    }

    if (matching.length === 0) {
      dropdown.innerHTML = `
        <div class="search-drop-header">
          <span>Search Results</span>
          <span>0 found</span>
        </div>
        <div style="padding: 18px; text-align: center; color: #64748B; font-size: 0.85rem;">
          No products found matching "<strong>${query}</strong>"
        </div>
      `;
      dropdown.classList.add('active');
      return;
    }

    const headerText = isRiceSearch
      ? `🌾 Recommended Rice & Heritage Grains (সুগন্ধি চাল ও শস্য) (${matching.length} items)`
      : `✨ Suggested Matches for "${query}" (${matching.length} items)`;

    dropdown.innerHTML = `
      <div class="search-drop-header">
        <span>${headerText}</span>
        <span style="color:#059669;font-weight:800;">Fast Delivery</span>
      </div>
      <div class="search-drop-list">
        ${matching.slice(0, 8).map(p => {
          const isRice = isRiceProduct(p);
          return `
            <div class="search-drop-item" data-product-id="${p.id}">
              <img src="${p.image}" alt="${p.name}" class="search-drop-img" />
              <div class="search-drop-info">
                <div class="search-drop-name">${p.name}</div>
                <div class="search-drop-meta">
                  <span class="search-drop-tag" ${isRice ? 'style="background:#DCFCE7;color:#166534;font-weight:700;"' : ''}>
                    ${isRice ? '🌾 Rice Special' : p.category}
                  </span>
                  <span>📍 ${p.artisanDistrict}</span>
                  <span>★ ${p.rating}</span>
                </div>
              </div>
              <div class="search-drop-price">
                ৳${p.priceBDT.toLocaleString()}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    dropdown.classList.add('active');

    // Attach click listeners to suggestions
    dropdown.querySelectorAll('.search-drop-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const prodId = (e.currentTarget as HTMLElement).getAttribute('data-product-id');
        if (prodId) {
          dropdown.classList.remove('active');
          this.openProductDetail(prodId);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // CURRENT VIEW ROUTER
  // --------------------------------------------------------------------------
  private renderCurrentView(): void {
    const container = document.getElementById('market-view-container');
    if (!container) return;

    // Scroll view to top
    container.scrollTop = 0;

    switch (this.activeView) {
      case 'storefront':
        this.renderStorefrontView(container);
        break;
      case 'detail':
        this.renderDetailView(container);
        break;
      case 'cart':
        this.renderCartView(container);
        break;
      case 'checkout':
        this.renderCheckoutView(container);
        break;
      case 'profile':
        this.renderProfileView(container);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // VIEW 1: STOREFRONT (IMAGE 1 STYLE)
  // --------------------------------------------------------------------------
  private renderStorefrontView(container: HTMLElement): void {
    const flashProducts = MARKETPLACE_PRODUCTS.filter(p => p.flashDeal).slice(0, 8);

    container.innerHTML = `
      <div class="storefront-view">
        
        <!-- Category Filter Chips Bar -->
        <div class="market-chips-bar" id="market-chips-bar">
          <button class="market-chip ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">
            🌟 ALL (সব)
          </button>
          <button class="market-chip ${this.currentCategory === 'farming' ? 'active' : ''}" data-cat="farming">
            🌾 Farming (কৃষি ও চাল)
          </button>
          <button class="market-chip ${this.currentCategory === 'handicrafts' ? 'active' : ''}" data-cat="handicrafts">
            🧵 Handicrafts (হস্তশিল্প)
          </button>
          <button class="market-chip ${this.currentCategory === 'dairy' ? 'active' : ''}" data-cat="dairy">
            🥛 Dairy (ঘি ও মিষ্টি)
          </button>
          <button class="market-chip ${this.currentCategory === 'fisheries' ? 'active' : ''}" data-cat="fisheries">
            🐟 Fisheries (মাছ ও ইলিশ)
          </button>
          <button class="market-chip ${this.currentCategory === 'spices' ? 'active' : ''}" data-cat="spices">
            🌶️ Spices (তেল ও মসলা)
          </button>
          <button class="market-chip ${this.currentCategory === 'fruits' ? 'active' : ''}" data-cat="fruits">
            🥭 Fruits (আম ও ফল)
          </button>
        </div>

        <!-- ⚡ Flash Offers Section -->
        <section class="flash-offers-card">
          <div class="flash-header-row">
            <div class="flash-title-wrap">
              <span class="flash-badge-pill">⚡ FLASH DEALS</span>
              <h3 class="flash-heading">Direct from Farmers</h3>
            </div>
            <div class="flash-countdown">
              <span class="flash-countdown-label">Ends in:</span>
              <span class="flash-timer-box" id="flash-h">04</span>
              <span class="flash-timer-colon">:</span>
              <span class="flash-timer-box" id="flash-m">18</span>
              <span class="flash-timer-colon">:</span>
              <span class="flash-timer-box" id="flash-s">32</span>
            </div>
          </div>

          <div class="flash-deals-carousel">
            ${flashProducts.map(p => `
              <div class="flash-deal-item" data-product-id="${p.id}">
                <div class="flash-img-box">
                  <img src="${p.image}" alt="${p.name}" loading="lazy" />
                  <span class="flash-discount-tag">-${p.discountPercent}%</span>
                </div>
                <div class="flash-item-body">
                  <div class="flash-item-title">${p.name}</div>
                  <div class="flash-price-action-row">
                    <div class="flash-price-row">
                      <span class="flash-curr-price">৳${p.priceBDT.toLocaleString()}</span>
                      ${p.originalPriceBDT ? `<span class="flash-orig-price">৳${p.originalPriceBDT.toLocaleString()}</span>` : ''}
                    </div>
                    <button 
                      type="button" 
                      class="prod-add-btn flash-add-btn" 
                      data-action="add-cart" 
                      data-product-id="${p.id}" 
                      title="Add to Shopping Bag"
                    >
                      +
                    </button>
                  </div>
                  <div class="flash-stock-meter">
                    <div class="flash-stock-fill" style="width: 78%;"></div>
                  </div>
                  <div class="flash-stock-text">
                    <span>⚡ 78% Sold</span>
                    <span>In Stock</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Main Products Grid Header -->
        <div class="store-grid-header">
          <div class="store-grid-title">
            <span>🌿 Authentic Village Produce</span>
            <span class="store-count-badge" id="product-count-label">100 Products</span>
          </div>
        </div>

        <!-- Main Products Grid -->
        <div class="market-products-grid" id="market-products-grid">
          <!-- Rendered by renderStorefrontGridOnly() -->
        </div>

      </div>
    `;

    this.updateFlashTimerDisplay();
    this.renderStorefrontGridOnly();

    // Category chips click handler
    const chipsBar = document.getElementById('market-chips-bar');
    chipsBar?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.market-chip') as HTMLElement;
      if (!btn) return;
      const cat = btn.getAttribute('data-cat') || 'all';
      chipsBar.querySelectorAll('.market-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.currentCategory = cat;
      this.renderStorefrontGridOnly();
    });

    // Flash deal clicks
    container.querySelectorAll('.flash-deal-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-action="add-cart"]')) {
          return; // handled by add-cart handler
        }
        const prodId = (e.currentTarget as HTMLElement).getAttribute('data-product-id');
        if (prodId) this.openProductDetail(prodId);
      });
    });

    // Add-to-bag handlers (including Flash Deals and main products)
    container.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = (e.currentTarget as HTMLElement).getAttribute('data-product-id');
        if (!prodId) return;

        this.requireBuyerAuth(() => {
          this.addToCart(prodId);
        });
      });
    });
  }

  private renderStorefrontGridOnly(): void {
    const grid = document.getElementById('market-products-grid');
    const countLabel = document.getElementById('product-count-label');
    if (!grid) return;

    let items = MARKETPLACE_PRODUCTS;

    if (this.currentCategory !== 'all') {
      items = items.filter(p => p.category === this.currentCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.bengaliName.toLowerCase().includes(q) ||
        p.artisanDistrict.toLowerCase().includes(q) ||
        p.craftType.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );

      const isRiceProduct = (p: Product) => 
        p.id.toLowerCase().includes('rice') ||
        p.name.toLowerCase().includes('rice') ||
        p.bengaliName.includes('চাল') ||
        p.bengaliName.includes('ধান') ||
        (p.craftType && p.craftType.toLowerCase().includes('paddy'));

      const isRiceSearch = q === 'r' || q === 'র' || q.startsWith('ri') || q === 'rice' || q === 'chal' || q === 'চাল';
      if (isRiceSearch) {
        const riceItems = items.filter(isRiceProduct);
        const other = items.filter(p => !isRiceProduct(p));
        items = [...riceItems, ...other];
      }
    }

    if (countLabel) {
      countLabel.textContent = `${items.length} Products`;
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="market-empty-state" style="grid-column: 1 / -1;">
          <div style="font-size: 2.5rem;">🔍</div>
          <h4>No products found</h4>
          <p>Try searching for rice, ghee, mango, fish, or clear your filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(product => `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-img-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
          ${product.discountPercent ? `<span class="prod-badge-discount">-${product.discountPercent}% OFF</span>` : ''}
          <span class="prod-badge-organic">100% Shariah</span>
        </div>
        <div class="product-card-body">
          <div class="prod-seller-chip">
            <span>🌾</span>
            <span>${product.artisanName} (${product.artisanDistrict})</span>
          </div>
          <h4 class="prod-title">${product.name}</h4>
          <div class="prod-bengali-sub">${product.bengaliName}</div>
          <div class="prod-rating-row">
            <span>★ ${product.rating}</span>
            <span class="prod-reviews-count">(${product.reviewsCount})</span>
          </div>
          <div class="prod-bottom-row">
            <div class="prod-price-box">
              <span class="prod-unit">${product.unit || '1 Unit'}</span>
              <div>
                <span class="prod-main-price">৳${product.priceBDT.toLocaleString()}</span>
                ${product.originalPriceBDT ? `<span class="prod-orig-price">৳${product.originalPriceBDT.toLocaleString()}</span>` : ''}
              </div>
            </div>
            <button 
              type="button" 
              class="prod-add-btn" 
              data-action="add-cart" 
              data-product-id="${product.id}"
              title="Add to Shopping Bag"
            >
              +
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Attach click listener to product card body to open details
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-action="add-cart"]')) {
          // Handled by add button
          return;
        }
        const prodId = card.getAttribute('data-product-id');
        if (prodId) this.openProductDetail(prodId);
      });
    });

    // Attach click listener to '+' button: MANDATORY SIGN-IN PROTECTION!
    grid.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = (e.currentTarget as HTMLElement).getAttribute('data-product-id');
        if (!prodId) return;

        this.requireBuyerAuth(() => {
          this.addToCart(prodId);
        });
      });
    });
  }

  // --------------------------------------------------------------------------
  // VIEW 2: PRODUCT DETAIL (IMAGE 2 STYLE)
  // --------------------------------------------------------------------------
  private renderDetailView(container: HTMLElement): void {
    const product = MARKETPLACE_PRODUCTS.find(p => p.id === this.selectedProductId) || MARKETPLACE_PRODUCTS[0];

    container.innerHTML = `
      <div class="detail-view">
        <div class="detail-nav-row">
          <button class="btn-detail-back" id="btn-back-to-store">
            ← Back to Store
          </button>
          <div style="font-size: 0.85rem; color: #64748B; font-weight: 600;">
            Product ID: #${product.id}
          </div>
        </div>

        <div class="detail-grid">
          <!-- Gallery -->
          <div class="detail-gallery">
            <img src="${product.image}" alt="${product.name}" class="detail-main-img" id="detail-main-img" />
            <div class="detail-thumbs-strip">
              <img src="${product.image}" class="detail-thumb active" alt="View 1" />
              <img src="/images/chinigura-rice.jpg" class="detail-thumb" alt="View 2" />
              <img src="/images/pure-cow-ghee.jpg" class="detail-thumb" alt="View 3" />
            </div>
          </div>

          <!-- Product Info Column -->
          <div class="detail-info-col">
            <span class="detail-category-badge">${product.category.toUpperCase()} • 100% NATURAL</span>
            
            <h2 class="detail-title-en">${product.name}</h2>
            <h3 class="detail-title-bn">${product.bengaliName}</h3>

            <div class="detail-price-banner">
              <span class="detail-price-main">৳${product.priceBDT.toLocaleString()}</span>
              ${product.originalPriceBDT ? `<span class="detail-price-orig">৳${product.originalPriceBDT.toLocaleString()}</span>` : ''}
              ${product.discountPercent ? `<span class="detail-discount-chip">Save ${product.discountPercent}%</span>` : ''}
              <span style="font-size:0.85rem;color:#64748B;font-weight:600;">/ ${product.unit || '1 Unit'}</span>
            </div>

            <!-- Voucher Banner -->
            <div class="detail-voucher-box">
              <span>🎟️</span>
              <div>
                <strong>Special Voucher Available:</strong> Use code <code style="background:#FFF;padding:2px 6px;border-radius:4px;font-weight:800;">GRAM20</code> for ৳20 OFF on orders above ৳500!
              </div>
            </div>

            <!-- Verified Producer / Farmer Card -->
            <div class="detail-seller-box">
              <div class="seller-meta">
                <div class="seller-avatar">🌾</div>
                <div>
                  <div class="seller-name">${product.artisanName}</div>
                  <div class="seller-origin">📍 ${product.originVillage || product.artisanDistrict} • Verified Producer</div>
                </div>
              </div>
              <div class="platform-fulfillment-chip" style="background:#E2E8F0;color:#0D382A;font-size:0.75rem;font-weight:700;padding:6px 14px;border-radius:20px;display:inline-flex;align-items:center;gap:6px;">
                <span>🛡️</span>
                <span>Platform Fulfilled & Quality Inspected</span>
              </div>
            </div>

            <!-- Delivery Guarantees -->
            <div class="detail-perks-row">
              <div class="detail-perk">
                <span>🚚</span>
                <span>2-3 Days Delivery</span>
              </div>
              <div class="detail-perk">
                <span>🔄</span>
                <span>7-Day Return</span>
              </div>
              <div class="detail-perk">
                <span>🛡️</span>
                <span>Zero Middlemen</span>
              </div>
            </div>

            <!-- Bilingual Description -->
            <div style="background:#F8FAFC;padding:14px;border-radius:10px;border:1px solid #E2E8F0;font-size:0.88rem;line-height:1.5;color:#334155;">
              <p style="margin-bottom:8px;"><strong>About this Harvest:</strong> ${product.description}</p>
              <p style="margin:0;font-family:'Tiro Bangla',serif;color:#475569;">
                <strong>খামারের তথ্য:</strong> এই পণ্যটি রাসায়নিক কীটনাশকমুক্ত উপায়ে সরাসরি প্রান্তিক কৃষক ও পল্লী কারিগরদের তত্ত্বাবধানে তৈরি ও সংগৃহীত। আপনার ক্রয়ের সম্পূর্ণ অর্থ সরাসরি উৎপাদকের পরিবারকে স্বাবলম্বী করে।
              </p>
            </div>

            <!-- Customer Reviews -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid #E2E8F0;">
              <div style="display:flex;align-items:center;gap:6px;font-weight:800;color:#0D382A;">
                <span style="color:#F59E0B;font-size:1.1rem;">★ ${product.rating}</span>
                <span>Customer Ratings (${product.reviewsCount} verified reviews)</span>
              </div>
              <span style="color:#059669;font-size:0.8rem;font-weight:700;">100% Positive Feedback</span>
            </div>

            <!-- Sticky Bottom Action Bar -->
            <div class="detail-action-bar">
              <button class="btn-detail-add-cart" id="btn-detail-add">
                🛒 Add to Bag
              </button>
              <button class="btn-detail-buy-now" id="btn-detail-buy">
                ⚡ BUY NOW
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-back-to-store')?.addEventListener('click', () => {
      this.activeView = 'storefront';
      this.renderCurrentView();
    });

    // Contact with farmer removed: GramBondhon sells and guarantees products directly

    // Add to Bag click
    document.getElementById('btn-detail-add')?.addEventListener('click', () => {
      this.requireBuyerAuth(() => {
        this.addToCart(product.id);
        const btn = document.getElementById('btn-detail-add');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Added to Bag!';
          setTimeout(() => { btn.innerHTML = orig; }, 1400);
        }
      });
    });

    // Buy Now click
    document.getElementById('btn-detail-buy')?.addEventListener('click', () => {
      this.requireBuyerAuth(() => {
        this.addToCart(product.id, 1, false);
        this.openCheckout();
      });
    });
  }

  // --------------------------------------------------------------------------
  // VIEW 3: CART DRAWER / MODAL (IMAGE 3 STYLE)
  // --------------------------------------------------------------------------
  private renderCartView(container: HTMLElement): void {
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.cart.reduce((sum, item) => sum + (item.product.priceBDT * item.quantity), 0);
    const freeShippingThreshold = 1000;
    const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
    const shippingFee = isFreeShipping ? 0 : 60;
    const discount = this.appliedVoucher ? this.appliedVoucher.discountBDT : 0;
    const grandTotal = Math.max(0, subtotal + shippingFee - discount);

    // Group items by artisan/seller
    const sellerGroups: { [key: string]: CartItem[] } = {};
    this.cart.forEach(item => {
      const seller = item.product.artisanName;
      if (!sellerGroups[seller]) sellerGroups[seller] = [];
      sellerGroups[seller].push(item);
    });

    container.innerHTML = `
      <div class="cart-view">
        <div class="cart-header-row">
          <div class="cart-heading">
            <span>🛍️ My Shopping Bag (আমার শপিং ব্যাগ)</span>
            <span style="font-size:0.85rem;background:#E2E8F0;color:#334155;padding:2px 8px;border-radius:12px;">${totalCount} items</span>
          </div>
          <button class="btn-detail-back" id="btn-cart-back">
            ← Continue Shopping
          </button>
        </div>

        <!-- Free Delivery Progress Meter -->
        <div class="cart-free-shipping-box">
          <div style="display:flex;justify-content:space-between;">
            <span>${isFreeShipping && subtotal > 0 ? '🎉 You unlocked FREE Delivery across Bangladesh!' : `Add ৳${Math.max(0, freeShippingThreshold - subtotal)} more to get FREE Delivery!`}</span>
            <span>Threshold: ৳1,000</span>
          </div>
          <div class="free-ship-meter">
            <div class="free-ship-fill" style="width: ${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%;"></div>
          </div>
        </div>

        ${this.cart.length === 0 ? `
          <div class="market-empty-state">
            <div style="font-size: 3rem; margin-bottom: 12px;">🛍️</div>
            <h3>Your Shopping Bag is Empty</h3>
            <p>Explore 50+ authentic village items from verified Bangladeshi producers.</p>
            <button class="btn btn-primary" id="btn-empty-shop-now" style="margin-top: 14px;">
              Start Shopping Now
            </button>
          </div>
        ` : `
          <!-- Items List Grouped by Seller -->
          <div class="cart-items-container">
            ${Object.keys(sellerGroups).map(seller => `
              <div class="cart-seller-group">
                <div class="cart-seller-header">
                  <span>🌾</span>
                  <span><strong>Seller:</strong> ${seller} (${sellerGroups[seller][0].product.artisanDistrict})</span>
                </div>
                <div class="cart-seller-items">
                  ${sellerGroups[seller].map(item => `
                    <div class="cart-item-row" data-product-id="${item.product.id}">
                      <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-thumb" />
                      <div class="cart-item-info">
                        <div class="cart-item-name">${item.product.name}</div>
                        <div class="cart-item-unit">${item.product.unit || '1 Unit'} • ৳${item.product.priceBDT.toLocaleString()} each</div>
                        <div class="cart-item-price">৳${(item.product.priceBDT * item.quantity).toLocaleString()}</div>
                      </div>
                      <div class="cart-item-stepper">
                        <button class="btn-stepper" data-action="qty-minus" data-id="${item.product.id}">−</button>
                        <span class="stepper-qty">${item.quantity}</span>
                        <button class="btn-stepper" data-action="qty-plus" data-id="${item.product.id}">+</button>
                      </div>
                      <button class="btn-remove-item" data-action="remove-item" data-id="${item.product.id}" title="Remove">🗑️</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Voucher Promo Code -->
          <div class="cart-voucher-row">
            <input 
              type="text" 
              class="cart-voucher-input" 
              id="cart-voucher-input" 
              placeholder="Enter voucher code (e.g. GRAM20, EID100)" 
              value="${this.appliedVoucher ? this.appliedVoucher.code : ''}"
            />
            <button class="btn-apply-voucher" id="btn-apply-voucher">Apply Voucher</button>
          </div>
          ${this.appliedVoucher ? `
            <div style="font-size:0.82rem;color:#059669;font-weight:700;">
              ✓ Voucher "${this.appliedVoucher.code}" applied! You saved ৳${this.appliedVoucher.discountBDT}.
            </div>
          ` : ''}

          <!-- Bill Summary -->
          <div class="cart-bill-summary">
            <div class="cart-bill-line">
              <span>Subtotal</span>
              <span>৳${subtotal.toLocaleString()}</span>
            </div>
            <div class="cart-bill-line">
              <span>Delivery Fee (Standard 2-3 Days)</span>
              <span>${shippingFee === 0 ? '<strong style="color:#059669;">FREE</strong>' : `৳${shippingFee}`}</span>
            </div>
            ${discount > 0 ? `
              <div class="cart-bill-line" style="color:#059669;font-weight:700;">
                <span>Voucher Discount</span>
                <span>−৳${discount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="cart-bill-line total">
              <span>Grand Total Payable</span>
              <span>৳${grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <!-- Proceed to Checkout -->
          <button class="btn-checkout-proceed" id="btn-proceed-checkout">
            <span>Proceed to Checkout (অর্ডার সম্পন্ন করুন) • ৳${grandTotal.toLocaleString()}</span>
            <span>→</span>
          </button>
        `}

        <!-- Just For You Recommendation Strip -->
        <div style="margin-top: 10px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #0D382A; margin-bottom: 12px;">
            ✨ Recommended For You (আপনার জন্য প্রস্তাবিত)
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            ${MARKETPLACE_PRODUCTS.slice(4, 7).map(rec => `
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;display:flex;align-items:center;gap:10px;">
                <img src="${rec.image}" style="width:45px;height:45px;border-radius:8px;object-fit:cover;" />
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rec.name}</div>
                  <div style="font-size:0.75rem;color:#0D382A;font-weight:800;">৳${rec.priceBDT}</div>
                </div>
                <button class="btn-stepper" data-action="quick-add" data-id="${rec.id}" style="width:28px;height:28px;background:#0D382A;color:#FFF;border-radius:6px;" title="Add">+</button>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    document.getElementById('btn-cart-back')?.addEventListener('click', () => {
      this.activeView = 'storefront';
      this.renderCurrentView();
    });

    document.getElementById('btn-empty-shop-now')?.addEventListener('click', () => {
      this.activeView = 'storefront';
      this.renderCurrentView();
    });

    // Quantity Stepper handlers
    container.querySelectorAll('[data-action="qty-plus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.updateCartQuantity(id, 1);
      });
    });

    container.querySelectorAll('[data-action="qty-minus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.updateCartQuantity(id, -1);
      });
    });

    container.querySelectorAll('[data-action="remove-item"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.removeFromCart(id);
      });
    });

    container.querySelectorAll('[data-action="quick-add"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          this.requireBuyerAuth(() => {
            this.addToCart(id);
          });
        }
      });
    });

    // Voucher application
    document.getElementById('btn-apply-voucher')?.addEventListener('click', () => {
      const code = (document.getElementById('cart-voucher-input') as HTMLInputElement)?.value.trim().toUpperCase();
      this.applyVoucher(code);
    });

    // Proceed to Checkout button
    document.getElementById('btn-proceed-checkout')?.addEventListener('click', () => {
      this.openCheckout();
    });
  }

  // --------------------------------------------------------------------------
  // VIEW 4: CHECKOUT WITH OFFICIAL BKASH & NAGAD LOGOS (IMAGE 4 STYLE)
  // --------------------------------------------------------------------------
  private renderCheckoutView(container: HTMLElement): void {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.product.priceBDT * item.quantity), 0);
    const shippingFee = subtotal >= 1000 ? 0 : 60;
    const discount = this.appliedVoucher ? this.appliedVoucher.discountBDT : 0;
    const grandTotal = Math.max(0, subtotal + shippingFee - discount);
    const buyer = this.buyerSession || DEFAULT_BUYER_USER;

    container.innerHTML = `
      <div class="checkout-view" id="checkout-view-content">
        <div class="cart-header-row">
          <div class="cart-heading">
            <span>🔒 Secure Checkout (পেমেন্ট ও ডেলিভারি)</span>
          </div>
          <button class="btn-detail-back" id="btn-checkout-to-cart">
            ← Back to Bag
          </button>
        </div>

        <div class="checkout-grid">
          <!-- Left Column: Address & Payment Methods -->
          <div style="display:flex;flex-direction:column;gap:20px;">
            
            <!-- Delivery Address Card -->
            <div>
              <div class="checkout-section-title">
                <span>📍 1. Delivery Address (ডেলিভারি ঠিকানা)</span>
              </div>
              <div class="checkout-address-card">
                <div>
                  <div class="address-buyer-name">${buyer.name} <span style="background:#D1FAE5;color:#065F46;font-size:0.7rem;padding:2px 6px;border-radius:10px;margin-left:4px;">Home</span></div>
                  <div class="address-buyer-phone">📞 Mobile: ${buyer.phone}</div>
                  <div class="address-buyer-street">${buyer.address}, ${buyer.city}, Bangladesh</div>
                </div>
                <button class="btn-edit-addr" id="btn-edit-checkout-addr">Edit</button>
              </div>
            </div>

            <!-- Payment Methods Stack -->
            <div>
              <div class="checkout-section-title">
                <span>💳 2. Payment Method (পেমেন্ট মাধ্যম বেছে নিন)</span>
              </div>
              
              <div class="payment-methods-stack">
                
                <!-- bKash (বিকাশ) -->
                <div class="payment-method-card bkash-card ${this.selectedPaymentMethod === 'bKash' ? 'selected' : ''}" data-method="bKash">
                  <div class="payment-method-header">
                    <div class="payment-brand-label">
                      <input type="radio" name="pay_opt" class="payment-radio" ${this.selectedPaymentMethod === 'bKash' ? 'checked' : ''} />
                      <div class="payment-logo-wrap">
                        <!-- Official bKash Bird SVG -->
                        <svg width="34" height="26" viewBox="0 0 100 70" fill="none">
                          <path d="M5 25 L35 5 L65 25 L35 45 Z" fill="#E2136E"/>
                          <path d="M35 45 L65 25 L85 55 L45 55 Z" fill="#D10056"/>
                          <path d="M65 25 L95 20 L85 55 Z" fill="#E2136E"/>
                          <path d="M35 5 L55 2 L50 18 Z" fill="#C0004C"/>
                        </svg>
                        <div>
                          <strong style="color:#E2136E;font-size:1.05rem;">bKash (বিকাশ)</strong>
                          <div style="font-size:0.75rem;color:#64748B;">Instant Shariah Compliant Mobile Banking</div>
                        </div>
                      </div>
                    </div>
                    <span style="font-size:0.72rem;background:#FCE7F3;color:#BE185D;padding:3px 8px;border-radius:12px;font-weight:700;">Instant</span>
                  </div>
                  
                  <div class="payment-method-body">
                    <label class="payment-input-label">bKash Account Number</label>
                    <input type="tel" class="payment-account-input" id="bkash-phone-input" placeholder="017XXXXXXXX" value="${buyer.phone.replace(/[^0-9]/g, '').slice(-11)}" />
                    <div class="payment-security-note">
                      <span>🔒</span>
                      <span>You will receive an OTP notification on your phone to complete payment securely.</span>
                    </div>
                  </div>
                </div>

                <!-- Nagad (নগদ) -->
                <div class="payment-method-card nagad-card ${this.selectedPaymentMethod === 'Nagad' ? 'selected' : ''}" data-method="Nagad">
                  <div class="payment-method-header">
                    <div class="payment-brand-label">
                      <input type="radio" name="pay_opt" class="payment-radio" ${this.selectedPaymentMethod === 'Nagad' ? 'checked' : ''} />
                      <div class="payment-logo-wrap">
                        <!-- Official Nagad Swirl SVG -->
                        <svg width="30" height="26" viewBox="0 0 100 75" fill="none">
                          <path d="M50 5 C25 5 10 25 15 48 C18 62 32 70 48 70 C72 70 90 50 85 28 C82 14 68 8 50 15 C35 21 28 35 32 48 C35 57 45 60 52 56 C58 52 60 44 56 38 C53 34 47 34 45 37" stroke="#F7941D" stroke-width="11" stroke-linecap="round" fill="none"/>
                        </svg>
                        <div>
                          <strong style="color:#F7941D;font-size:1.05rem;">Nagad (নগদ)</strong>
                          <div style="font-size:0.75rem;color:#64748B;">Bangladesh Post Office Digital Financial Service</div>
                        </div>
                      </div>
                    </div>
                    <span style="font-size:0.72rem;background:#FFEDD5;color:#C2410C;padding:3px 8px;border-radius:12px;font-weight:700;">Fast</span>
                  </div>

                  <div class="payment-method-body">
                    <label class="payment-input-label">Nagad Account Number</label>
                    <input type="tel" class="payment-account-input" id="nagad-phone-input" placeholder="01XXXXXXXXX" value="${buyer.phone.replace(/[^0-9]/g, '').slice(-11)}" />
                    <div class="payment-security-note">
                      <span>🔒</span>
                      <span>Encrypted direct payment through Bangladesh Postal Service network.</span>
                    </div>
                  </div>
                </div>

                <!-- Bank Transfer (ইসলামী ব্যাংক / BEFTN) -->
                <div class="payment-method-card bank-card ${this.selectedPaymentMethod === 'Bank Transfer' ? 'selected' : ''}" data-method="Bank Transfer">
                  <div class="payment-method-header">
                    <div class="payment-brand-label">
                      <input type="radio" name="pay_opt" class="payment-radio" ${this.selectedPaymentMethod === 'Bank Transfer' ? 'checked' : ''} />
                      <div class="payment-logo-wrap">
                        <span style="font-size:1.5rem;">🏛️</span>
                        <div>
                          <strong style="color:#047857;font-size:1.05rem;">Bank Transfer (ইসলামী ব্যাংক / BEFTN)</strong>
                          <div style="font-size:0.75rem;color:#64748B;">Direct Bank Transfer to GramBandhan Shariah Escrow</div>
                        </div>
                      </div>
                    </div>
                    <span style="font-size:0.72rem;background:#DCFCE7;color:#166534;padding:3px 8px;border-radius:12px;font-weight:700;">Shariah</span>
                  </div>

                  <div class="payment-method-body">
                    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:0.8rem;color:#166534;">
                      <div><strong>Bank:</strong> Islami Bank Bangladesh Ltd (IBBL)</div>
                      <div><strong>Account:</strong> GramBandhan Agro Shariah Escrow Fund Ltd</div>
                      <div><strong>A/C No:</strong> 2050 7710 8899 001 (Branch: Dilkusha C/A, Dhaka)</div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
                      <div>
                        <label class="payment-input-label">Your Bank & Branch</label>
                        <input type="text" class="payment-account-input" id="bank-name-input" placeholder="e.g. City Bank, Gulshan" />
                      </div>
                      <div>
                        <label class="payment-input-label">Your Account Number</label>
                        <input type="text" class="payment-account-input" id="bank-acc-input" placeholder="e.g. 110284912001" />
                      </div>
                    </div>
                    <div>
                      <label class="payment-input-label">Deposit Slip No. / TrxID / Reference</label>
                      <input type="text" class="payment-account-input" id="bank-trx-input" placeholder="e.g. FT-2026-98124 or Slip #4019" />
                    </div>
                  </div>
                </div>

                <!-- Cash on Delivery -->
                <div class="payment-method-card ${this.selectedPaymentMethod === 'Cash on Delivery' ? 'selected' : ''}" data-method="Cash on Delivery">
                  <div class="payment-method-header">
                    <div class="payment-brand-label">
                      <input type="radio" name="pay_opt" class="payment-radio" ${this.selectedPaymentMethod === 'Cash on Delivery' ? 'checked' : ''} />
                      <div class="payment-logo-wrap">
                        <span style="font-size:1.5rem;">💵</span>
                        <div>
                          <strong style="color:#0F172A;font-size:1.05rem;">Cash on Delivery (ক্যাশ অন ডেলিভারি)</strong>
                          <div style="font-size:0.75rem;color:#64748B;">Pay in cash when delivery courier reaches your door</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="payment-method-body">
                    <div style="font-size:0.8rem;color:#475569;">
                      Please keep <strong>৳${grandTotal.toLocaleString()}</strong> cash ready upon parcel handover.
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <!-- Right Column: Order Summary -->
          <div class="checkout-summary-box">
            <h4 style="font-size: 1rem; font-weight: 800; color: #0F172A; margin: 0;">Order Summary</h4>
            
            <div class="checkout-items-preview">
              ${this.cart.map(item => `
                <div class="checkout-preview-item">
                  <span class="title">${item.product.name} × ${item.quantity}</span>
                  <strong>৳${(item.product.priceBDT * item.quantity).toLocaleString()}</strong>
                </div>
              `).join('')}
            </div>

            <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;color:#475569;">
              <div style="display:flex;justify-content:space-between;">
                <span>Subtotal</span>
                <span>৳${subtotal.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span>Delivery Charge</span>
                <span>${shippingFee === 0 ? '<span style="color:#047857;font-weight:700;">FREE</span>' : `৳${shippingFee}`}</span>
              </div>
              ${discount > 0 ? `
                <div style="display:flex;justify-content:space-between;color:#047857;">
                  <span>Promo Voucher</span>
                  <span>-৳${discount.toLocaleString()}</span>
                </div>
              ` : ''}
              <div style="display:flex;justify-content:space-between;border-top:1px dashed #CBD5E1;padding-top:8px;margin-top:4px;font-weight:800;font-size:1.05rem;color:#0F172A;">
                <span>Total Amount</span>
                <span>৳${grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button class="btn-confirm-order" id="btn-confirm-place-order">
              Confirm Order (অর্ডার নিশ্চিত করুন) • ৳${grandTotal.toLocaleString()}
            </button>

            <div style="font-size:0.72rem;text-align:center;color:#64748B;">
              By confirming, you support ethical rural agriculture and women artisans of Bangladesh.
            </div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('btn-checkout-to-cart')?.addEventListener('click', () => {
      this.openCart();
    });

    // Payment method selector
    container.querySelectorAll('.payment-method-card').forEach(card => {
      card.addEventListener('click', () => {
        const method = card.getAttribute('data-method') as 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash on Delivery';
        if (method) {
          this.selectedPaymentMethod = method;
          this.renderCheckoutView(container);
        }
      });
    });

    // Place Order Button
    document.getElementById('btn-confirm-place-order')?.addEventListener('click', () => {
      this.processOrderPlacement(container, grandTotal, subtotal, shippingFee, discount, buyer);
    });
  }

  private processOrderPlacement(
    container: HTMLElement, 
    grandTotal: number, 
    subtotal: number, 
    shippingFee: number, 
    discount: number,
    buyer: BuyerUser
  ): void {
    const orderId = `GB-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNum = `REDX-GB-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = 'Just Now';

    const newOrder: BuyerOrder = {
      id: orderId,
      date: '17 Sep 2026',
      status: 'on_the_way',
      statusBengali: 'পথিমধ্যে রয়েছে (চলমান ডেলিভারি)',
      statusBadgeClass: 'badge-transit',
      items: [...this.cart],
      subtotal: subtotal,
      shippingFee: shippingFee,
      discount: discount,
      total: grandTotal,
      paymentMethod: this.selectedPaymentMethod,
      paymentDetails: `${this.selectedPaymentMethod} (${buyer.phone}) - TxnID: GB${Math.floor(100000 + Math.random() * 900000)}`,
      shippingAddress: `${buyer.address}, ${buyer.city}`,
      recipientPhone: buyer.phone,
      trackingNumber: trackingNum,
      courierPartner: 'RedX Express Logistics',
      estimatedDelivery: 'Tomorrow, by 4:00 PM',
      trackingSteps: [
        { label: 'Order Confirmed', bengaliLabel: 'অর্ডার গৃহীত হয়েছে', time: nowStr, completed: true },
        { label: 'Packed by Village Cooperative', bengaliLabel: 'পণ্য প্রস্তুত ও প্যাকিং', time: 'In Progress', completed: true, active: true },
        { label: 'In Transit / On The Way', bengaliLabel: 'পথিমধ্যে রয়েছে (ঢাকা হাবের পথে)', time: 'Expected Tonight', completed: false },
        { label: 'Out for Delivery', bengaliLabel: 'ডেলিভারির জন্য বের হবে', time: 'Tomorrow 10:00 AM', completed: false },
        { label: 'Delivered', bengaliLabel: 'পৌঁছে গেছে', time: 'Pending', completed: false }
      ]
    };

    // Prepend to orders
    this.orders.unshift(newOrder);
    this.saveOrders();

    // Auto-upgrade logged-in user to include Buyer role without requiring re-auth
    if (authManager.isAuthenticated()) {
      authManager.addRole('buyer');
      const updatedRoles = authManager.getRoleBadgeText();
      this.showToast(`🎉 Order Placed! Your account is now active as ${updatedRoles}.`);
    }

    // Clear cart
    this.cart = [];
    this.appliedVoucher = null;
    this.saveCart();

    // Render Order Success Screen
    container.innerHTML = `
      <div class="order-success-wrap">
        <div class="success-check-icon">✓</div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #0D382A; margin: 0;">
          Order Placed Successfully!
        </h2>
        <div style="font-family: 'Tiro Bangla', serif; font-size: 1.05rem; color: #059669;">
          আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে।
        </div>
        <div class="success-order-id">
          Order ID: ${orderId} • Tracking: ${trackingNum}
        </div>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:16px 24px;border-radius:12px;max-width:480px;text-align:left;font-size:0.88rem;color:#334155;line-height:1.6;">
          <div><strong>Payment Method:</strong> ${this.selectedPaymentMethod} (Verified)</div>
          <div><strong>Delivery Address:</strong> ${buyer.address}, ${buyer.city}</div>
          <div><strong>Estimated Arrival:</strong> Tomorrow, by 4:00 PM via RedX Express</div>
        </div>

        <button class="btn-track-profile" id="btn-success-track">
          🚚 Track in Buyer Profile (অর্ডার ট্র্যাক করুন)
        </button>
      </div>
    `;

    document.getElementById('btn-success-track')?.addEventListener('click', () => {
      this.openBuyerProfile('on_the_way');
    });
  }

  // --------------------------------------------------------------------------
  // VIEW 5: BUYER PROFILE & ORDER TRACKING
  // --------------------------------------------------------------------------
  private renderProfileView(container: HTMLElement): void {
    const buyer = this.buyerSession || DEFAULT_BUYER_USER;
    const onTheWayOrders = this.orders.filter(o => o.status === 'on_the_way');
    const deliveredOrders = this.orders.filter(o => o.status === 'delivered');
    const cancelledOrders = this.orders.filter(o => o.status === 'cancelled');

    container.innerHTML = `
      <div class="profile-view">
        
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-user-left">
            <div class="profile-big-avatar">${buyer.name.charAt(0)}</div>
            <div class="profile-user-info">
              <h3>${buyer.name}</h3>
              <p>✉️ ${buyer.email} • 📞 ${buyer.phone}</p>
              <div class="profile-status-pill">✓ Verified Buyer (যাচাইকৃত ক্রেতা)</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;text-align:right;">
            <div style="background:rgba(255,255,255,0.12);padding:8px 16px;border-radius:10px;">
              <div style="font-size:1.25rem;font-weight:800;">${onTheWayOrders.length}</div>
              <div style="font-size:0.72rem;color:#D1FAE5;">On The Way</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);padding:8px 16px;border-radius:10px;">
              <div style="font-size:1.25rem;font-weight:800;">${deliveredOrders.length}</div>
              <div style="font-size:0.72rem;color:#D1FAE5;">Delivered</div>
            </div>
          </div>
        </div>

        <!-- 4 Profile Tabs -->
        <div class="profile-tabs-bar" id="profile-tabs-bar">
          <button class="profile-tab-btn ${this.currentProfileTab === 'on_the_way' ? 'active' : ''}" data-tab="on_the_way">
            🚚 On The Way (পথিমধ্যে ডেলিভারি) [${onTheWayOrders.length}]
          </button>
          <button class="profile-tab-btn ${this.currentProfileTab === 'delivered' ? 'active' : ''}" data-tab="delivered">
            ✅ Previous Purchases (সম্পন্ন অর্ডার) [${deliveredOrders.length}]
          </button>
          <button class="profile-tab-btn ${this.currentProfileTab === 'cancelled' ? 'active' : ''}" data-tab="cancelled">
            ❌ Cancelled Orders (বাতিলকৃত অর্ডার) [${cancelledOrders.length}]
          </button>
          <button class="profile-tab-btn ${this.currentProfileTab === 'settings' ? 'active' : ''}" data-tab="settings">
            ⚙️ Settings (অ্যাকাউন্ট সেটিংস)
          </button>
        </div>

        <!-- Tab Content Body -->
        <div id="profile-tab-body">
          <!-- Rendered by renderProfileTabContent() -->
        </div>

      </div>
    `;

    this.renderProfileTabContent();

    // Tab Switchers
    const tabContainer = document.getElementById('profile-tabs-bar');
    tabContainer?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.profile-tab-btn') as HTMLElement;
      if (!btn) return;
      const tab = btn.getAttribute('data-tab') as 'on_the_way' | 'delivered' | 'cancelled' | 'settings';
      tabContainer.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.currentProfileTab = tab;
      this.renderProfileTabContent();
    });
  }

  private renderProfileTabContent(): void {
    const tabBody = document.getElementById('profile-tab-body');
    if (!tabBody) return;

    if (this.currentProfileTab === 'on_the_way') {
      const activeOrders = this.orders.filter(o => o.status === 'on_the_way');
      if (activeOrders.length === 0) {
        tabBody.innerHTML = `
          <div class="market-empty-state">
            <div style="font-size:2.5rem;">🚚</div>
            <h4>No orders currently on the way</h4>
            <p>Your newly placed shipments will show real-time tracking here.</p>
          </div>
        `;
        return;
      }

      tabBody.innerHTML = `
        <div class="orders-list-stack">
          ${activeOrders.map(order => `
            <div class="buyer-order-card">
              <div class="order-card-header">
                <div class="order-id-group">
                  <span>Order #${order.id}</span>
                  <span class="order-date-label">Placed: ${order.date}</span>
                </div>
                <span class="${order.statusBadgeClass}">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2563EB;animation:pulse 1.2s infinite;"></span>
                  ${order.statusBengali}
                </span>
              </div>

              <!-- Multi-step Live Tracking Timeline -->
              <div class="tracking-timeline-box">
                <div class="timeline-courier-row">
                  <div>
                    <strong>Partner:</strong> ${order.courierPartner || 'Express Courier'} • 
                    <strong>Track ID:</strong> <code>${order.trackingNumber || 'N/A'}</code>
                  </div>
                  <div style="color:#2563EB;">ETA: ${order.estimatedDelivery || 'Tomorrow'}</div>
                </div>

                <div class="timeline-stepper">
                  ${(order.trackingSteps || []).map((step, idx) => `
                    <div class="timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}">
                      <div class="step-dot">${step.completed ? '✓' : idx + 1}</div>
                      <div class="step-text">${step.label}</div>
                      <div class="step-time">${step.time}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Items in shipment -->
              <div class="order-items-detail-list">
                ${order.items.map(item => `
                  <div class="order-item-mini-row">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <img src="${item.product.image}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" />
                      <div>
                        <strong>${item.product.name}</strong>
                        <div style="font-size:0.75rem;color:#64748B;">Qty: ${item.quantity} • Seller: ${item.product.artisanName}</div>
                      </div>
                    </div>
                    <strong>৳${(item.product.priceBDT * item.quantity).toLocaleString()}</strong>
                  </div>
                `).join('')}
              </div>

              <div class="order-card-footer">
                <div>
                  <span>Total Paid: <strong>৳${order.total.toLocaleString()}</strong></span>
                  <span style="font-size:0.75rem;color:#64748B;margin-left:8px;">(${order.paymentMethod})</span>
                </div>
                <button class="btn-order-action" data-action="call-partner" data-courier="${order.courierPartner}">
                  📞 Call Courier Agent
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      tabBody.querySelectorAll('[data-action="call-partner"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showToast('Calling RedX delivery dispatcher (+880 9612-445566)...');
        });
      });

    } else if (this.currentProfileTab === 'delivered') {
      const delivered = this.orders.filter(o => o.status === 'delivered');
      tabBody.innerHTML = `
        <div class="orders-list-stack">
          ${delivered.map(order => `
            <div class="buyer-order-card">
              <div class="order-card-header">
                <div class="order-id-group">
                  <span>Order #${order.id}</span>
                  <span class="order-date-label">Delivered on: ${order.date}</span>
                </div>
                <span class="${order.statusBadgeClass}">✓ ${order.statusBengali}</span>
              </div>

              <div class="order-items-detail-list">
                ${order.items.map(item => `
                  <div class="order-item-mini-row">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <img src="${item.product.image}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" />
                      <div>
                        <strong>${item.product.name}</strong>
                        <div style="font-size:0.75rem;color:#64748B;">Qty: ${item.quantity} • ${item.product.artisanName}</div>
                      </div>
                    </div>
                    <strong>৳${(item.product.priceBDT * item.quantity).toLocaleString()}</strong>
                  </div>
                `).join('')}
              </div>

              <div class="order-card-footer">
                <div>Total: <strong>৳${order.total.toLocaleString()}</strong> via ${order.paymentMethod}</div>
                <div style="display:flex;gap:8px;">
                  <button class="btn-order-action" data-action="buy-again" data-id="${order.items[0]?.product.id}">
                    🔄 Buy Again
                  </button>
                  <button class="btn-order-action" data-action="rate-order">
                    ★ Leave 5★ Rating
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      tabBody.querySelectorAll('[data-action="buy-again"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (id) {
            this.addToCart(id);
            this.openCart();
          }
        });
      });

      tabBody.querySelectorAll('[data-action="rate-order"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showToast('Thank you! 5★ review recorded for village producer.');
        });
      });

    } else if (this.currentProfileTab === 'cancelled') {
      const cancelled = this.orders.filter(o => o.status === 'cancelled');
      tabBody.innerHTML = `
        <div class="orders-list-stack">
          ${cancelled.map(order => `
            <div class="buyer-order-card">
              <div class="order-card-header">
                <div class="order-id-group">
                  <span>Order #${order.id}</span>
                  <span class="order-date-label">Cancelled on: ${order.date}</span>
                </div>
                <span class="${order.statusBadgeClass}">✕ ${order.statusBengali}</span>
              </div>

              <div style="padding:14px 18px;background:#FFF5F5;border-bottom:1px solid #FED7D7;font-size:0.85rem;color:#C53030;">
                <div><strong>Reason:</strong> ${order.cancelReason || 'Requested by customer'}</div>
                <div style="margin-top:4px;color:#2F855A;font-weight:700;"><strong>Refund Status:</strong> ${order.refundStatus || 'Refunded in full to original method'}</div>
              </div>

              <div class="order-items-detail-list">
                ${order.items.map(item => `
                  <div class="order-item-mini-row">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <img src="${item.product.image}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" />
                      <div>
                        <strong>${item.product.name}</strong>
                        <div style="font-size:0.75rem;color:#64748B;">Amount: ৳${order.total.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="order-card-footer">
                <span style="color:#64748B;font-size:0.8rem;">100% Refund Complete</span>
                <button class="btn-order-action" data-action="reorder-fresh" data-id="${order.items[0]?.product.id}">
                  Re-order Fresh Batch
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      tabBody.querySelectorAll('[data-action="reorder-fresh"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (id) {
            this.addToCart(id);
            this.openCart();
          }
        });
      });

    } else if (this.currentProfileTab === 'settings') {
      const buyer = this.buyerSession || DEFAULT_BUYER_USER;
      tabBody.innerHTML = `
        <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;padding:20px;">
          <h4 style="font-size:1.05rem;font-weight:800;color:#0D382A;margin-bottom:16px;">
            Account & Delivery Preferences
          </h4>

          <div class="settings-form-grid">
            <div class="settings-group">
              <label>Full Name</label>
              <input type="text" class="settings-input" id="set-buyer-name" value="${buyer.name}" />
            </div>
            <div class="settings-group">
              <label>Contact Phone</label>
              <input type="tel" class="settings-input" id="set-buyer-phone" value="${buyer.phone}" />
            </div>
            <div class="settings-group">
              <label>Email Address</label>
              <input type="email" class="settings-input" id="set-buyer-email" value="${buyer.email}" />
            </div>
            <div class="settings-group">
              <label>Default Shipping Address</label>
              <input type="text" class="settings-input" id="set-buyer-addr" value="${buyer.address}" />
            </div>
            <div class="settings-group">
              <label>City / Division</label>
              <input type="text" class="settings-input" id="set-buyer-city" value="${buyer.city}" />
            </div>
            <div class="settings-group">
              <label>Preferred Payment Gateway</label>
              <select class="settings-input" id="set-buyer-payment">
                <option value="bKash" ${buyer.preferredPayment === 'bKash' ? 'selected' : ''}>bKash (বিকাশ)</option>
                <option value="Nagad" ${buyer.preferredPayment === 'Nagad' ? 'selected' : ''}>Nagad (নগদ)</option>
                <option value="Cash on Delivery" ${buyer.preferredPayment === 'Cash on Delivery' ? 'selected' : ''}>Cash on Delivery</option>
              </select>
            </div>
          </div>

          <div class="settings-actions-row">
            <button class="btn-order-action" id="btn-save-settings" style="background:#0D382A;color:#FFF;padding:10px 20px;">
              Save Profile Changes
            </button>
            <button class="btn-order-action" id="btn-logout-buyer" style="color:#DC2626;border-color:#FCA5A5;">
              Sign Out (লগআউট)
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-save-settings')?.addEventListener('click', () => {
        const name = (document.getElementById('set-buyer-name') as HTMLInputElement)?.value;
        const phone = (document.getElementById('set-buyer-phone') as HTMLInputElement)?.value;
        const addr = (document.getElementById('set-buyer-addr') as HTMLInputElement)?.value;
        if (this.buyerSession) {
          this.buyerSession.name = name;
          this.buyerSession.phone = phone;
          this.buyerSession.address = addr;
          localStorage.setItem('gb_buyer_session', JSON.stringify(this.buyerSession));
          this.showToast('Profile settings saved successfully!');
          const viewCont = document.getElementById('market-view-container');
          if (viewCont) this.renderProfileView(viewCont);
        }
      });

      document.getElementById('btn-logout-buyer')?.addEventListener('click', () => {
        this.logoutBuyer();
      });
    }
  }

  // --------------------------------------------------------------------------
  // CART HELPERS
  // --------------------------------------------------------------------------
  public addToCart(productId: string, quantity: number = 1, showFeedback: boolean = true): void {
    const product = MARKETPLACE_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(item => item.product.id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ product, quantity });
    }

    this.saveCart();

    if (showFeedback) {
      this.showToast(`✓ Added ${product.name} to Shopping Bag!`);
    }
  }

  private updateCartQuantity(productId: string, delta: number): void {
    const item = this.cart.find(i => i.product.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.saveCart();
      const container = document.getElementById('market-view-container');
      if (container && this.activeView === 'cart') {
        this.renderCartView(container);
      }
    }
  }

  private removeFromCart(productId: string): void {
    this.cart = this.cart.filter(i => i.product.id !== productId);
    this.saveCart();
    const container = document.getElementById('market-view-container');
    if (container && this.activeView === 'cart') {
      this.renderCartView(container);
    }
    this.showToast('Item removed from Shopping Bag');
  }

  private applyVoucher(code: string): void {
    if (!code) return;
    if (code === 'GRAM20') {
      this.appliedVoucher = { code: 'GRAM20', discountBDT: 20 };
      this.showToast('🎉 Voucher GRAM20 applied! ৳20 discount deducted.');
    } else if (code === 'EID100') {
      this.appliedVoucher = { code: 'EID100', discountBDT: 100 };
      this.showToast('🎉 Voucher EID100 applied! ৳100 discount deducted.');
    } else if (code === 'FARMERLOVE') {
      this.appliedVoucher = { code: 'FARMERLOVE', discountBDT: 50 };
      this.showToast('🎉 Voucher FARMERLOVE applied! ৳50 discount deducted.');
    } else {
      this.showToast('Invalid voucher code. Try GRAM20 or EID100.');
    }

    const container = document.getElementById('market-view-container');
    if (container && this.activeView === 'cart') {
      this.renderCartView(container);
    }
  }

  private updateCartBadge(): void {
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('top-cart-badge');
    if (badge) badge.textContent = totalCount.toString();

    // Also update legacy count on homepage if present
    const legacyCount = document.getElementById('market-cart-count');
    if (legacyCount) legacyCount.textContent = totalCount.toString();
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATION UTILITY
  // --------------------------------------------------------------------------
  public showToast(message: string): void {
    let toast = document.getElementById('market-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'market-toast';
      toast.className = 'market-toast-notification';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
      toast?.classList.remove('active');
    }, 2400);
  }
}
