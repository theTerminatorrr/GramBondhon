/**
 * =========================================================================
 * GRAMBONDHON FARMER & PRODUCER CONTROLLER
 * Feature Domain: Farmer & Women Artisan Portal (Teammate's Workspace)
 * 
 * Separated into this independent module so that the Farmer feature team
 * can build registration, harvest submission, GPS verification, and producer
 * dashboards without creating Git merge conflicts with Marketplace or Investor modules.
 * =========================================================================
 */

import { authManager } from './auth';

export class JoinAsFarmerController {
  private portalModal: HTMLElement | null = null;
  private closeBtn: HTMLElement | null = null;
  private navFarmerLink: HTMLElement | null = null;
  private joinFarmerBtn: HTMLElement | null = null;
  private tabFarmer: HTMLElement | null = null;
  private tabArtisan: HTMLElement | null = null;
  private contentFarmer: HTMLElement | null = null;
  private contentArtisan: HTMLElement | null = null;
  private dashboard: HTMLElement | null = null;
  private btnDemoFarmer: HTMLElement | null = null;
  private btnDemoArtisan: HTMLElement | null = null;
  private formFarmer: HTMLElement | null = null;
  private formArtisan: HTMLElement | null = null;
  private btnProducerLogout: HTMLElement | null = null;
  private btnProducerNew: HTMLElement | null = null;

  private onToastNotification?: (message: string) => void;

  constructor(onToast?: (message: string) => void) {
    this.onToastNotification = onToast;
  }

  public init(): void {
    this.bindElements();
    this.setupEventListeners();
  }

  private bindElements(): void {
    this.portalModal = document.getElementById('farmer-women-modal');
    this.closeBtn = document.getElementById('close-farmer-modal');
    this.navFarmerLink = document.getElementById('nav-farmer-women-link');
    this.joinFarmerBtn = document.getElementById('cta-join-farmer');
    this.tabFarmer = document.getElementById('tab-btn-farmer');
    this.tabArtisan = document.getElementById('tab-btn-artisan');
    this.contentFarmer = document.getElementById('tab-content-farmer');
    this.contentArtisan = document.getElementById('tab-content-artisan');
    this.dashboard = document.getElementById('producer-dashboard');
    this.btnDemoFarmer = document.getElementById('btn-demo-farmer');
    this.btnDemoArtisan = document.getElementById('btn-demo-artisan');
    this.formFarmer = document.getElementById('form-farmer-login');
    this.formArtisan = document.getElementById('form-artisan-login');
    this.btnProducerLogout = document.getElementById('btn-producer-logout');
    this.btnProducerNew = document.getElementById('btn-producer-new-project');
  }

  private setupEventListeners(): void {
    // Open portal on clicking "Farmers & Women" in Nav or "Join as Farmer" in Hero
    this.navFarmerLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openPortal('farmer');
    });

    this.joinFarmerBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openPortal('farmer');
    });

    this.closeBtn?.addEventListener('click', () => this.closePortal());

    this.tabFarmer?.addEventListener('click', () => this.switchTab('farmer'));
    this.tabArtisan?.addEventListener('click', () => this.switchTab('artisan'));

    // 1-Click Demo Farmer -> Go to Farmer Dashboard
    this.btnDemoFarmer?.addEventListener('click', () => {
      authManager.demoLogin('farmer');
      try {
        localStorage.setItem('grambandhan_farmer_sso', 'true');
        localStorage.setItem('grambandhan.farmer.v1', JSON.stringify({
          user: { name: 'Md. Rafiqul Islam', phone: '01712345678', role: 'Farmer', district: 'Bogura', upazila: 'Shibganj' }
        }));
      } catch (e) {}
      this.closePortal();
      this.notifyToast('🌾 Welcome, Md. Rafiqul Islam! Opening Farmer Dashboard...');
      setTimeout(() => {
        window.location.href = '/Farmer/farmer.html?sso=1';
      }, 350);
    });

    // 1-Click Demo Artisan
    this.btnDemoArtisan?.addEventListener('click', () => {
      authManager.demoLogin('farmer');
      this.showProducerDashboard(
        'Fatima Begum (ফাতেমা বেগম)',
        '🧵 Rural Nakshi Kantha Artisan • Islampur, Jamalpur',
        'Jamalpur Women Artisan Handicraft Collective',
        '24 Hand-Stitched Quilts Live in Marketplace',
        'Nagad Verified • 01823-456789'
      );
      this.notifyToast('🧵 Welcome, Fatima Begum! Logged in as Verified Rural Artisan.');
    });

    // Forms
    this.formFarmer?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = (document.getElementById('farmer-name') as HTMLInputElement)?.value.trim() || 'Md. Rafiqul Islam';
      const phoneInput = (document.getElementById('farmer-phone') as HTMLInputElement)?.value.trim() || '01712-345678';
      const district = (document.getElementById('farmer-district') as HTMLSelectElement)?.value || 'Gazipur';
      const category = (document.getElementById('farmer-category') as HTMLSelectElement)?.value || 'Poultry';

      // Auto-upgrade logged in user to Farmer role without needing separate registration
      if (authManager.isAuthenticated()) {
        authManager.addRole('farmer');
      } else {
        authManager.signUp(nameInput, phoneInput, ['farmer']);
      }

      this.showProducerDashboard(
        nameInput,
        `🌾 ${category} Producer • ${district} Hub`,
        `${district} ${category} Development Project`,
        'Under Agronomist Review (GPS Verified)',
        'bKash Account Verified'
      );
      const roleBadge = authManager.getRoleBadgeText();
      this.notifyToast(`🌾 Project proposal submitted successfully! Your account now has ${roleBadge} privileges.`);
    });

    this.formArtisan?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = (document.getElementById('artisan-name') as HTMLInputElement)?.value.trim() || 'Fatima Begum';
      const phoneInput = (document.getElementById('artisan-phone') as HTMLInputElement)?.value.trim() || '01823-456789';
      const district = (document.getElementById('artisan-district') as HTMLSelectElement)?.value || 'Jamalpur';
      const craft = (document.getElementById('artisan-craft') as HTMLSelectElement)?.value || 'Nakshi Kantha';

      if (authManager.isAuthenticated()) {
        authManager.addRole('farmer');
      } else {
        authManager.signUp(nameInput, phoneInput, ['farmer']);
      }

      this.showProducerDashboard(
        nameInput,
        `🧵 ${craft} Artisan • ${district}`,
        `${district} Handcrafted Collection`,
        'Active Marketplace Storefront',
        'bKash / Nagad Verified'
      );
      const roleBadge = authManager.getRoleBadgeText();
      this.notifyToast(`🧵 Store opened successfully! Your account now has ${roleBadge} privileges.`);
    });

    this.btnProducerLogout?.addEventListener('click', () => {
      authManager.logout();
      this.resetProducerState();
      this.notifyToast('Logged out of Producer account');
    });

    this.btnProducerNew?.addEventListener('click', () => {
      this.switchTab('farmer');
      this.notifyToast('Ready for new project submission');
    });
  }

  public openPortal(defaultTab: 'farmer' | 'artisan' = 'farmer'): void {
    if (!this.portalModal) return;
    this.portalModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.switchTab(defaultTab);
  }

  public closePortal(): void {
    if (!this.portalModal) return;
    this.portalModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  public switchTab(tab: 'farmer' | 'artisan'): void {
    if (this.dashboard) this.dashboard.style.display = 'none';
    if (tab === 'farmer') {
      this.tabFarmer?.classList.add('active');
      this.tabArtisan?.classList.remove('active');
      if (this.contentFarmer) this.contentFarmer.style.display = 'block';
      if (this.contentArtisan) this.contentArtisan.style.display = 'none';
    } else {
      this.tabArtisan?.classList.add('active');
      this.tabFarmer?.classList.remove('active');
      if (this.contentArtisan) this.contentArtisan.style.display = 'block';
      if (this.contentFarmer) this.contentFarmer.style.display = 'none';
    }
  }

  public showProducerDashboard(name: string, role: string, project: string, status: string, wallet: string): void {
    if (this.contentFarmer) this.contentFarmer.style.display = 'none';
    if (this.contentArtisan) this.contentArtisan.style.display = 'none';
    if (this.dashboard) this.dashboard.style.display = 'block';

    const elName = document.getElementById('dash-producer-name');
    const elRole = document.getElementById('dash-producer-role');
    const elProject = document.getElementById('dash-project-title');
    const elStatus = document.getElementById('dash-funding-status');
    const elWallet = document.getElementById('dash-payout-wallet');

    if (elName) elName.textContent = name;
    if (elRole) elRole.textContent = role;
    if (elProject) elProject.textContent = project;
    if (elStatus) elStatus.textContent = status;
    if (elWallet) elWallet.textContent = wallet;

    // Central authManager will reactively update the navbar badge and single logout button
  }

  public resetProducerState(): void {
    if (this.dashboard) this.dashboard.style.display = 'none';
    this.switchTab('farmer');
  }

  private notifyToast(message: string): void {
    if (this.onToastNotification) {
      this.onToastNotification(message);
    }
  }
}
