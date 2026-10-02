import { UnifiedUser, UserRole } from './types';

/**
 * GRAMBANDHAN UNIFIED MULTI-ROLE AUTHENTICATION CONTROLLER
 * 
 * Supports dynamic cross-role lifecycle:
 * - Roles: Farmer, Investor, Buyer
 * - Farmers & Investors don't need to re-login when purchasing at Marketplace;
 *   buying a product automatically adds the Buyer role (e.g. Farmer, Investor & Buyer).
 * - Buyers can directly submit farming project proposals without re-signing up;
 *   submitting automatically adds the Farmer role.
 * - Non-investors cannot directly invest without verifying as an Investor.
 * - Persists and synchronizes across localStorage keys for seamless multi-sector integration.
 */

type AuthChangeListener = (user: UnifiedUser | null) => void;

class AuthManager {
  private currentUser: UnifiedUser | null = null;
  private pendingProjectId: string | null = null;
  private listeners: AuthChangeListener[] = [];

  constructor() {
    this.loadPersistedSession();
  }

  private loadPersistedSession(): void {
    try {
      // 1. Try unified session
      const savedUnified = localStorage.getItem('grambandhan_unified_session');
      if (savedUnified) {
        this.currentUser = JSON.parse(savedUnified);
        if (this.currentUser && (!this.currentUser.roles || this.currentUser.roles.length === 0)) {
          this.currentUser.roles = ['investor'];
        }
        return;
      }

      // 2. Fallback to investor session
      const savedInvestor = localStorage.getItem('grambandhan_investor_session');
      if (savedInvestor) {
        const inv = JSON.parse(savedInvestor);
        this.currentUser = {
          name: inv.name || 'Tariq Rahman',
          email: inv.email || 'tariq.rahman@investor.bd',
          phone: inv.phone || '+880 1711-234567',
          roles: inv.roles || ['investor'],
          nidVerified: inv.nidVerified !== false,
          portfolioValueBDT: inv.portfolioValueBDT || 150000,
          address: 'House 14, Road 5, Dhanmondi',
          city: 'Dhaka',
          district: 'Dhaka',
          memberSince: 'March 2026'
        };
        this.syncStorage();
        return;
      }

      // 3. Fallback to buyer session
      const savedBuyer = localStorage.getItem('gb_buyer_session');
      if (savedBuyer) {
        const b = JSON.parse(savedBuyer);
        this.currentUser = {
          name: b.name || 'Tanvir Ahmed',
          email: b.email || 'tanvir.ahmed@buyer.bd',
          phone: b.phone || '+880 1712-889900',
          roles: ['buyer'],
          nidVerified: false,
          portfolioValueBDT: 0,
          address: b.address || 'Flat 4B, House 18, Road 11, Banani',
          city: b.city || 'Dhaka',
          district: b.district || 'Dhaka',
          memberSince: b.memberSince || 'March 2026'
        };
        this.syncStorage();
        return;
      }
    } catch {
      this.currentUser = null;
    }
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getUser(): UnifiedUser | null {
    return this.currentUser;
  }

  public hasRole(role: UserRole): boolean {
    if (!this.currentUser || !this.currentUser.roles) return false;
    return this.currentUser.roles.includes(role);
  }

  public addRole(role: UserRole): void {
    if (!this.currentUser) return;
    if (!this.currentUser.roles) {
      this.currentUser.roles = [];
    }
    if (!this.currentUser.roles.includes(role)) {
      this.currentUser.roles.push(role);
      this.syncStorage();
      this.notifyListeners();
    }
  }

  public getRoleBadgeText(): string {
    if (!this.currentUser || !this.currentUser.roles || this.currentUser.roles.length === 0) {
      return 'Member';
    }
    const roles = this.currentUser.roles;
    const hasFarmer = roles.includes('farmer');
    const hasInvestor = roles.includes('investor');
    const hasBuyer = roles.includes('buyer');

    if (hasFarmer && hasInvestor && hasBuyer) {
      return 'Farmer, Investor & Buyer';
    }
    if (hasFarmer && hasInvestor) {
      return 'Farmer & Investor';
    }
    if (hasFarmer && hasBuyer) {
      return 'Farmer & Buyer';
    }
    if (hasInvestor && hasBuyer) {
      return 'Investor & Buyer';
    }
    if (hasFarmer) return 'Farmer';
    if (hasInvestor) return 'Investor';
    if (hasBuyer) return 'Buyer';
    return 'Member';
  }

  public setPendingProject(projectId: string | null): void {
    this.pendingProjectId = projectId;
  }

  public getPendingProject(): string | null {
    return this.pendingProjectId;
  }

  public clearPendingProject(): void {
    this.pendingProjectId = null;
  }

  public signUp(name: string, identifier: string, roles: UserRole[] = ['investor'], phone?: string): UnifiedUser {
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@grambandhan.bd`;
    const resolvedPhone = !isEmail ? identifier : (phone || '+880 1711-234567');

    const user: UnifiedUser = {
      name: name.trim(),
      email: email,
      phone: resolvedPhone,
      roles: roles.length > 0 ? roles : ['investor'],
      nidVerified: roles.includes('investor') || roles.includes('farmer'),
      portfolioValueBDT: roles.includes('investor') ? 150000 : 0,
      address: 'House 14, Road 5, Dhanmondi',
      city: 'Dhaka',
      district: 'Dhaka',
      memberSince: 'March 2026'
    };

    this.currentUser = user;
    this.syncStorage();
    this.notifyListeners();
    return user;
  }

  public login(identifier: string, _password?: string, name?: string, roles: UserRole[] = ['investor']): UnifiedUser {
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : `${(name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@grambandhan.bd`;
    const phone = !isEmail ? identifier : '+880 1711-234567';

    const user: UnifiedUser = {
      name: name || (identifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())),
      email: email,
      phone: phone,
      roles: roles,
      nidVerified: true,
      portfolioValueBDT: roles.includes('investor') ? 150000 : 0,
      address: 'House 14, Road 5, Dhanmondi',
      city: 'Dhaka',
      district: 'Dhaka',
      memberSince: 'March 2026'
    };

    this.currentUser = user;
    this.syncStorage();
    this.notifyListeners();
    return user;
  }

  public loginWithCredentials(identifier: string, password?: string): UnifiedUser {
    return this.login(identifier, password, undefined, ['investor']);
  }

  public demoLogin(roleType: 'investor' | 'farmer' | 'buyer' | 'farmer_investor' = 'investor'): UnifiedUser {
    switch (roleType) {
      case 'farmer':
        return this.login('rafiqul.islam@farmer.bd', 'demo1234', 'Md. Rafiqul Islam', ['farmer']);
      case 'buyer':
        return this.login('tanvir.ahmed@buyer.bd', 'demo1234', 'Tanvir Ahmed', ['buyer']);
      case 'farmer_investor':
        return this.login('tariqul.islam@grambandhan.bd', 'demo1234', 'Md. Tariqul Islam', ['farmer', 'investor']);
      case 'investor':
      default:
        return this.login('tariq.rahman@investor.bd', 'demo1234', 'Tariq Rahman', ['investor']);
    }
  }

  public syncStorage(): void {
    if (!this.currentUser) return;
    try {
      localStorage.setItem('grambandhan_unified_session', JSON.stringify(this.currentUser));
      localStorage.setItem('grambandhan_investor_session', JSON.stringify({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        nidVerified: this.currentUser.nidVerified,
        portfolioValueBDT: this.currentUser.portfolioValueBDT,
        roles: this.currentUser.roles
      }));
      localStorage.setItem('gb_buyer_session', JSON.stringify({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        address: this.currentUser.address || 'House 14, Road 5, Dhanmondi',
        city: this.currentUser.city || 'Dhaka',
        district: this.currentUser.district || 'Dhaka',
        preferredPayment: 'bKash',
        memberSince: this.currentUser.memberSince || 'March 2026'
      }));
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
  }

  public logout(): void {
    this.currentUser = null;
    try {
      localStorage.removeItem('grambandhan_unified_session');
      localStorage.removeItem('grambandhan_investor_session');
      localStorage.removeItem('gb_buyer_session');
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
    this.notifyListeners();
  }

  public onAuthChange(listener: AuthChangeListener): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }
}

export const authManager = new AuthManager();
