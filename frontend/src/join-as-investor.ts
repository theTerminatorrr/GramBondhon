/**
 * =========================================================================
 * GRAMBONDHON INVESTOR CONTROLLER (Join as Investor & Investor Portal)
 * Feature Domain: Investor Registration, Auth & Portfolio Onboarding
 * 
 * Dedicated file for "Join as Investor" workflow, investor verification,
 * demo login, Shariah investment agreements, and investor session management.
 * =========================================================================
 */

import { authManager } from './auth';
import { ActiveProjectsController } from './active-projects';
import { UserRole } from './types';

export class JoinAsInvestorController {
  private closeAuthBtn: HTMLElement | null = null;
  private formSignup: HTMLFormElement | null = null;
  private formLogin: HTMLFormElement | null = null;
  private becomeInvestorBtn: HTMLElement | null = null;
  private navInvestBtn: HTMLElement | null = null;
  private navLoginBtn: HTMLElement | null = null;
  private bannerCtaBtn: HTMLElement | null = null;

  private tabBtnSignup: HTMLElement | null = null;
  private tabBtnLogin: HTMLElement | null = null;
  private signupView: HTMLElement | null = null;
  private loginView: HTMLElement | null = null;

  private projectsController: ActiveProjectsController;
  private onToastNotification?: (message: string) => void;

  constructor(projectsController: ActiveProjectsController, onToast?: (message: string) => void) {
    this.projectsController = projectsController;
    this.onToastNotification = onToast;
  }

  public init(): void {
    this.bindElements();
    this.setupEventListeners();
  }

  private bindElements(): void {
    this.closeAuthBtn = document.getElementById('close-auth-modal');
    this.formSignup = document.getElementById('form-signup') as HTMLFormElement;
    this.formLogin = document.getElementById('form-login') as HTMLFormElement;
    this.becomeInvestorBtn = document.getElementById('cta-become-investor');
    this.navInvestBtn = document.getElementById('nav-invest-btn');
    this.navLoginBtn = document.getElementById('nav-login-btn');
    this.bannerCtaBtn = document.getElementById('cta-invest-banner');

    this.tabBtnSignup = document.getElementById('tab-btn-signup');
    this.tabBtnLogin = document.getElementById('tab-btn-login');
    this.signupView = document.getElementById('form-signup');
    this.loginView = document.getElementById('auth-login-view');
  }

  private setupEventListeners(): void {
    // Tab switching: Sign Up vs Sign In
    this.tabBtnSignup?.addEventListener('click', () => this.switchAuthTab('signup'));
    this.tabBtnLogin?.addEventListener('click', () => this.switchAuthTab('login'));

    // Role selection cards in Sign Up form
    const roleCards = [
      { cardId: 'role-label-farmer', checkId: 'role-check-farmer' },
      { cardId: 'role-label-investor', checkId: 'role-check-investor' },
      { cardId: 'role-label-buyer', checkId: 'role-check-buyer' }
    ];

    roleCards.forEach(({ cardId, checkId }) => {
      const card = document.getElementById(cardId);
      const check = document.getElementById(checkId) as HTMLInputElement;
      card?.addEventListener('click', (e) => {
        e.preventDefault();
        if (check) {
          check.checked = !check.checked;
          if (check.checked) {
            card.classList.add('selected');
            card.style.borderColor = '#10B981';
            card.style.backgroundColor = '#ECFDF5';
          } else {
            // Keep at least one role selected
            const anyChecked = roleCards.some(r => (document.getElementById(r.checkId) as HTMLInputElement)?.checked);
            if (!anyChecked) {
              check.checked = true;
              return;
            }
            card.classList.remove('selected');
            card.style.borderColor = '#CBD5E1';
            card.style.backgroundColor = '#FFFFFF';
          }
        }
      });
    });

    // "Sign Up" button in Navbar
    this.navInvestBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.openAuthModal('signup');
    });

    // "Become an Investor" CTA in hero section
    this.becomeInvestorBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.openAuthModal('signup');
    });

    // "Login" button in Navbar
    this.navLoginBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.openAuthModal('login');
    });

    // Final Banner CTA
    this.bannerCtaBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.openAuthModal('signup');
    });

    // Footer Investor Portal link
    document.getElementById('footer-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      authManager.clearPendingProject();
      this.openAuthModal('login');
    });

    // Close Modal Button
    this.closeAuthBtn?.addEventListener('click', () => {
      this.closeAuthModal();
    });

    // Quick Demo Logins: 3 User Characters
    document.getElementById('btn-quick-demo-farmer')?.addEventListener('click', () => {
      authManager.demoLogin('farmer');
      try {
        localStorage.setItem('grambandhan_farmer_sso', 'true');
        localStorage.removeItem('grambandhan.farmer.v1');
      } catch (e) {}
      this.closeAuthModal();
      this.notifyToast('🌾 Logged in as Farmer (Md. Rafiqul Islam)! Opening Farmer Dashboard...');
      setTimeout(() => {
        window.location.href = '/Farmer/farmer.html?sso=1';
      }, 350);
    });

    document.getElementById('btn-quick-demo-investor')?.addEventListener('click', () => {
      const u = authManager.demoLogin('investor');
      this.handlePostAuthSuccess(u.name);
    });

    document.getElementById('btn-quick-demo-buyer')?.addEventListener('click', () => {
      const u = authManager.demoLogin('buyer');
      this.handlePostAuthSuccess(u.name);
    });

    // Single Sign-In for Admin
    document.getElementById('btn-admin-single-signin')?.addEventListener('click', () => {
      this.handleAdminSingleSignIn();
    });

    // Form Submit: Sign Up
    this.formSignup?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = (document.getElementById('signup-name') as HTMLInputElement)?.value.trim() || 'Tanvir Rahman';
      const idInput = (document.getElementById('signup-identifier') as HTMLInputElement)?.value.trim() || 'tanvir@grambandhan.bd';

      const roles: UserRole[] = [];
      if ((document.getElementById('role-check-farmer') as HTMLInputElement)?.checked) roles.push('farmer');
      if ((document.getElementById('role-check-investor') as HTMLInputElement)?.checked) roles.push('investor');
      if ((document.getElementById('role-check-buyer') as HTMLInputElement)?.checked) roles.push('buyer');

      const user = authManager.signUp(nameInput, idInput, roles.length > 0 ? roles : ['investor']);
      this.handlePostAuthSuccess(user.name);
    });

    // Form Submit: Login
    this.formLogin?.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const raw = emailInput?.value.trim() || '';

      if (raw.toLowerCase().includes('farmer') || raw.startsWith('01712345678') || raw.toLowerCase().includes('rafiqul')) {
        authManager.demoLogin('farmer');
        try {
          localStorage.setItem('grambandhan_farmer_sso', 'true');
        } catch (e) {}
        this.closeAuthModal();
        this.notifyToast('🌾 Logging in as Farmer... Opening Farmer Dashboard!');
        setTimeout(() => {
          window.location.href = '/Farmer/farmer.html?sso=1';
        }, 350);
        return;
      }

      const email = raw || 'investor@grambandhan.bd';
      const user = authManager.login(email);
      this.handlePostAuthSuccess(user.name);
    });
  }

  public switchAuthTab(tab: 'signup' | 'login'): void {
    if (tab === 'signup') {
      if (this.tabBtnSignup) {
        this.tabBtnSignup.style.borderBottom = '3px solid #02221A';
        this.tabBtnSignup.style.color = '#02221A';
      }
      if (this.tabBtnLogin) {
        this.tabBtnLogin.style.borderBottom = '3px solid transparent';
        this.tabBtnLogin.style.color = '#64748B';
      }
      if (this.signupView) this.signupView.style.display = 'block';
      if (this.loginView) this.loginView.style.display = 'none';
    } else {
      if (this.tabBtnLogin) {
        this.tabBtnLogin.style.borderBottom = '3px solid #02221A';
        this.tabBtnLogin.style.color = '#02221A';
      }
      if (this.tabBtnSignup) {
        this.tabBtnSignup.style.borderBottom = '3px solid transparent';
        this.tabBtnSignup.style.color = '#64748B';
      }
      if (this.loginView) this.loginView.style.display = 'block';
      if (this.signupView) this.signupView.style.display = 'none';
    }
  }

  public openAuthModal(defaultTab: 'signup' | 'login' = 'signup', projectId?: string, directInvest: boolean = false): void {
    this.projectsController.openAuthModal(projectId, directInvest);
    this.switchAuthTab(defaultTab);
  }

  public openInvestorModal(projectId?: string, directInvest: boolean = false): void {
    this.openAuthModal('signup', projectId, directInvest);
  }

  public closeAuthModal(): void {
    this.projectsController.closeAuthModal();
  }

  public handlePostAuthSuccess(userName: string): void {
    this.closeAuthModal();
    const roleBadge = authManager.getRoleBadgeText();
    this.notifyToast(`Welcome, ${userName}! Logged in as ${roleBadge}.`);

    const pendingProjectId = authManager.getPendingProject();
    if (pendingProjectId) {
      authManager.clearPendingProject();
      setTimeout(() => {
        this.projectsController.openProjectDetailsModal(pendingProjectId, true);
      }, 350);
    }
  }

  public handleAdminSingleSignIn(): void {
    try {
      localStorage.setItem('grambandhan_admin_sso', 'true');
    } catch (e) {
      console.warn('Storage error', e);
    }
    this.closeAuthModal();
    this.notifyToast('🛡️ Admin Single Sign-In successful! Opening Admin Console...');
    setTimeout(() => {
      window.location.href = '/Admin/admin.html?sso=1';
    }, 400);
  }

  private notifyToast(message: string): void {
    if (this.onToastNotification) {
      this.onToastNotification(message);
    }
  }
}

