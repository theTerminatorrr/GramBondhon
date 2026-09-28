import { authManager } from './auth';
import { HeroSectionController } from './homepage';
import { JoinAsInvestorController, InvestorProfileController } from './investor';
import { ActiveProjectsController } from './projects';
import { MarketplaceController } from './marketplace';
import { JoinAsFarmerController } from './join-as-farmer';
import { bondhonChatbot } from './chatbot';
import { initSDGImpact } from './sdg-impact';
import { StaffPortalController } from './staff-portal';
import './styles/sdg-impact.css';

/**
 * =========================================================================
 * GRAMBONDHON MAIN ORCHESTRATOR
 * 
 * Easily understand which file manages which sector:
 * - hero-section.ts       -> Hero Section (slideshow, text, chat)
 * - join-as-investor.ts   -> Investor Sector (join as investor, auth, KYC)
 * - investor-profile.ts   -> Investor Profile & Dashboard (Photos 1, 2, 3, 4)
 * - active-projects.ts    -> Active Projects Sector (30 projects grid, returns)
 * - marketplace.ts        -> Marketplace Sector (crafts, products, cart)
 * - join-as-farmer.ts     -> Farmer Sector (join as farmer, women artisans, portal)
 * =========================================================================
 */

class GramBondhonApp {
  private heroSection: HeroSectionController;
  private joinAsInvestor: JoinAsInvestorController;
  private investorProfile: InvestorProfileController;
  private activeProjects: ActiveProjectsController;
  private marketplace: MarketplaceController;
  private joinAsFarmer: JoinAsFarmerController;
  private staffPortal: StaffPortalController;

  constructor() {
    this.heroSection = new HeroSectionController();
    this.activeProjects = new ActiveProjectsController();
    this.marketplace = new MarketplaceController();
    this.investorProfile = new InvestorProfileController(this.activeProjects, this.showToast.bind(this), this.marketplace);
    this.joinAsFarmer = new JoinAsFarmerController(this.showToast.bind(this));
    this.joinAsInvestor = new JoinAsInvestorController(this.activeProjects, this.showToast.bind(this));
    this.staffPortal = new StaffPortalController(this.showToast.bind(this));
  }

  public init(): void {
    // 1. Initialize all sector controllers
    this.heroSection.init();
    this.activeProjects.init();
    this.marketplace.init();
    this.joinAsFarmer.init();
    this.joinAsInvestor.init();
    this.investorProfile.init();
    this.staffPortal.init();

    // 2. Initialize authentic Bondhon AI Chatbot (from jony_gm.new)
    bondhonChatbot.init();

    // 3. Initialize SDG Impact Alignment section
    initSDGImpact();

    // 4. Setup Navigation & Shared Global Handlers
    this.setupNavbar();
    this.setupProjectsAndHeroButtons();
    this.setupModalEscapeKeys();
    this.setupSmoothScroll();
    this.setupFaqAccordion();

    // 3. Route to dedicated page view if opening specific HTML file
    this.routeDedicatedPageView();

    // Global developer & quick-test hooks
    (window as any).investorProfile = this.investorProfile;
    (window as any).staffPortal = this.staffPortal;
    (window as any).openStaffPortal = () => this.staffPortal.open();
    (window as any).openSampleCertificate = () => {
      this.investorProfile.openInvestmentCertificateModal({
        project: {
          id: 'proj-sample',
          name: 'Red Chilli farming - 1',
          district: 'বগুড়া • Sariakandi, Bogura',
          category: 'crops',
          duration: '24 Days Left',
          minInvestmentBDT: 5000,
          expectedRoiPercent: 18.2,
          fundingGoalBDT: 300000,
          fundingRaisedBDT: 240000,
          image: '/images/red-chilli.jpg'
        } as any,
        units: 1,
        totalAmount: 20000,
        profit: 3640,
        roiPercentage: 18.2,
        paymentMethod: 'bKash',
        trxId: '1htdfrs'
      });
    };

    console.log('🌾 GramBondhon (গ্রামীণ বন্ধন) initialized successfully with sector modules.');
  }

  private setupNavbar(): void {
    const navLoginBtn = document.getElementById('nav-login-btn');
    const navInvestBtn = document.getElementById('nav-invest-btn');
    const navUserBadge = document.getElementById('nav-user-badge');
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');

    // Auth state reactivity in Navbar
    authManager.onAuthChange((user) => {
      if (user) {
        if (navLoginBtn) navLoginBtn.style.display = 'none';
        if (navInvestBtn) navInvestBtn.style.display = 'none';
        if (navUserBadge) {
          navUserBadge.style.display = 'inline-flex';
          navUserBadge.style.alignItems = 'center';
          navUserBadge.style.gap = '10px';

          const initials = user.name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'GB';
          const roleBadge = authManager.getRoleBadgeText();

          navUserBadge.innerHTML = `
            <div id="btn-nav-profile-open" class="user-nav-badge-pill" title="Click to open portal/dashboard" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;background:#E8F5EF;padding:5px 14px;border-radius:20px;border:1px solid #A7F3D0;transition:all 0.2s ease;">
              <span class="user-pill-avatar" style="background:#02221A;color:#FFF;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">${initials}</span>
              <span class="user-pill-name" style="font-weight:700;font-size:0.85rem;color:#02221A;">${user.name}</span>
              <span style="font-size:0.725rem;background:#10B981;color:#fff;padding:2px 8px;border-radius:12px;font-weight:700;">${roleBadge}</span>
            </div>
            <button class="btn-nav-logout" id="logout-btn" title="Log Out" style="background:#02221A;color:#FFFFFF;border:none;padding:7px 16px;border-radius:20px;font-size:0.825rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s ease;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Log Out</span>
            </button>
          `;

          document.getElementById('btn-nav-profile-open')?.addEventListener('click', () => {
            if (authManager.hasRole('investor')) {
              this.investorProfile.openDashboard();
            } else if (authManager.hasRole('farmer')) {
              window.location.href = '/Farmer/farmer.html?sso=1';
            } else {
              this.marketplace.openMarketplace('profile');
            }
          });

          document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            authManager.logout();
            this.showToast('Logged out successfully');
          });
        }
      } else {
        if (navLoginBtn) navLoginBtn.style.display = 'inline-block';
        if (navInvestBtn) navInvestBtn.style.display = 'inline-block';
        if (navUserBadge) navUserBadge.style.display = 'none';
      }
    });

    // Nav Login button click -> opens login tab
    navLoginBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.joinAsInvestor.openAuthModal('login');
    });

    // Nav Sign Up button click -> opens signup tab
    navInvestBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.joinAsInvestor.openAuthModal('signup');
    });

    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', () => {
      const projectsSection = document.getElementById('projects');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  private setupProjectsAndHeroButtons(): void {
    // "View All Projects" toggle link
    const viewAllBtn = document.getElementById('btn-view-all-projects');
    viewAllBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.activeProjects.toggleShowAllProjects();
      const isAll = this.activeProjects.isShowingAll();
      this.showToast(isAll ? 'Showing all 30 verified Bangladeshi projects' : 'Showing top 4 projects');
    });

    // Project Details Modal Close button
    const closeDetailBtn = document.getElementById('close-project-detail');
    closeDetailBtn?.addEventListener('click', () => {
      this.activeProjects.closeProjectDetailsModal();
    });

    // Wire up hero chat button and any chat triggers to open Bondhon AI Chatbot
    document.querySelectorAll('#hero-chat-btn, .btn-chat-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        bondhonChatbot.openChat();
      });
    });
  }

  private setupModalEscapeKeys(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.activeProjects.closeAuthModal();
        this.activeProjects.closeProjectDetailsModal();
        this.marketplace.closeMarketplaceModal();
        this.joinAsFarmer.closePortal();
        this.investorProfile.closeDashboard();
      }
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  }

  private setupSmoothScroll(): void {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  private routeDedicatedPageView(): void {
    const rawPath = window.location.pathname.toLowerCase();
    const rawHash = window.location.hash.toLowerCase();
    const pageName = rawPath.split('/').pop() || '';

    // Expose controllers globally
    (window as any).gramBondhon = {
      app: this,
      auth: authManager,
      hero: this.heroSection,
      investor: this.investorProfile,
      projects: this.activeProjects,
      marketplace: this.marketplace,
      farmer: this.joinAsFarmer,
      chatbot: bondhonChatbot
    };
    (window as any).bondhonChatbot = bondhonChatbot;

    // 1. INVESTOR MARKETPLACE: investor_marketplace.html
    if (pageName.includes('investor_marketplace')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      setTimeout(() => {
        this.investorProfile.openDashboard('marketplace');
      }, 50);
      return;
    }

    // 2. INVESTOR PROJECTS: investor_projects.html
    if (pageName.includes('investor_projects') || pageName.includes('projects') || rawHash.includes('projects')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      setTimeout(() => {
        this.investorProfile.openDashboard('projects');
      }, 50);
      return;
    }

    // 3. INVESTOR DASHBOARD: investor_dashboard.html
    if (pageName.includes('investor_dashboard') || pageName.includes('dashboard') || rawHash.includes('dashboard')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      setTimeout(() => {
        this.investorProfile.openDashboard('dashboard');
      }, 50);
      return;
    }

    // 4. INVESTOR FINANCIALS / PORTFOLIO: investor_financials.html
    if (pageName.includes('investor_financials') || pageName.includes('financials') || pageName.includes('portfolio')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      setTimeout(() => {
        this.investorProfile.openDashboard('financials');
      }, 50);
      return;
    }

    // 5. INVESTOR AI RISK: investor_airisk.html
    if (pageName.includes('investor_airisk') || pageName.includes('airisk')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      setTimeout(() => {
        this.investorProfile.openDashboard('airisk');
      }, 50);
      return;
    }

    // 6. INVESTOR PROFILE: investor_profile.html
    if (pageName.includes('investor_profile') || pageName.includes('profile')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      setTimeout(() => {
        this.investorProfile.openDashboard('settings');
      }, 50);
      return;
    }

    // 7. INVESTOR HOMEPAGE: investor.html
    if (pageName.includes('investor') || rawHash.includes('investor')) {
      if (!authManager.isAuthenticated()) {
        authManager.demoLogin('investor');
      }
      this.investorProfile.handleAuthChange(authManager.getUser());
      return;
    }

    // 8. PUBLIC MARKETPLACE STORE: marketplace.html
    if (pageName.includes('market') || rawHash.includes('marketplace')) {
      setTimeout(() => {
        this.marketplace.openMarketplace('storefront');
      }, 50);
      return;
    }

    // 9. ORDERS PAGE: orders.html
    if (pageName.includes('orders') || rawHash.includes('orders')) {
      setTimeout(() => {
        this.marketplace.openBuyerProfile('on_the_way');
      }, 50);
      return;
    }

    // 10. LOGIN: login.html
    if (pageName.includes('login') || rawHash.includes('login')) {
      setTimeout(() => {
        this.joinAsInvestor.openAuthModal('login');
      }, 50);
      return;
    }

    // 11. REGISTER: register.html
    if (pageName.includes('register') || rawHash.includes('register')) {
      setTimeout(() => {
        this.joinAsInvestor.openAuthModal('signup');
      }, 50);
        return;
    }
  }

  private setupFaqAccordion(): void {
    const faqItems = document.querySelectorAll<HTMLElement>('.faq-item');
    const tabButtons = document.querySelectorAll<HTMLElement>('.faq-tab-btn');

    // Accordion toggle click
    faqItems.forEach(item => {
      const btn = item.querySelector<HTMLButtonElement>('.faq-question-btn');
      const pane = item.querySelector<HTMLElement>('.faq-answer-pane');
      if (!btn || !pane) return;

      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other open items for clean accordion UX
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
            const otherBtn = otherItem.querySelector<HTMLButtonElement>('.faq-question-btn');
            const otherPane = otherItem.querySelector<HTMLElement>('.faq-answer-pane');
            const otherIcon = otherItem.querySelector<HTMLElement>('.faq-toggle-icon');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            if (otherPane) otherPane.style.maxHeight = '0px';
            if (otherIcon) otherIcon.textContent = '+';
          }
        });

        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          pane.style.maxHeight = '0px';
          const icon = item.querySelector<HTMLElement>('.faq-toggle-icon');
          if (icon) icon.textContent = '+';
        } else {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
          pane.style.maxHeight = `${pane.scrollHeight + 30}px`;
          const icon = item.querySelector<HTMLElement>('.faq-toggle-icon');
          if (icon) icon.textContent = '−';
        }
      });
    });

    // Category filter tabs
    tabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-faq-cat') || 'all';

        tabButtons.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        faqItems.forEach(item => {
          const itemCat = item.getAttribute('data-category');
          if (cat === 'all' || itemCat === cat) {
            item.classList.remove('hidden-by-filter');
          } else {
            item.classList.add('hidden-by-filter');
          }
        });
      });
    });

    // FAQ Bottom Live Chat button triggers Bondhon AI Chatbot
    document.getElementById('btn-faq-ask-chat')?.addEventListener('click', (e) => {
      e.preventDefault();
      bondhonChatbot.openChat('faq');
    });
  }

  public showToast(message: string): void {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
}

// Instantiate on DOM ready or immediately if already loaded
function startApp(): void {
  const app = new GramBondhonApp();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
