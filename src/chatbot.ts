/**
 * =========================================================================
 * GRAMBONDHON AI CHATBOT (বন্ধন এআই)
 * Imported from https://github.com/muhtasim-cs/jony_gm.new
 * Features:
 *  - 💰 Invest in verified cohorts with interactive cards
 *  - 📊 Portfolio and field monitoring table
 *  - 💳 Multi-channel payment simulation (bKash, Nagad, Dutch-Bangla Bank)
 *  - ⛓️ On-chain blockchain proof & transaction receipts (Base Sepolia)
 *  - 🤝 Connect with verified rural impact investors
 *  - 🌸 Women empowerment artisans statistics
 *  - ❓ Shariah & Halal FAQ (Musharakah / Mudarabah, 0% interest)
 * =========================================================================
 */

import { apiClient } from './api-client';
import { authManager } from './auth';

export interface ChatProject {
  id: number;
  name: string;
  location: string;
  funded: number;
  target: number;
  raised: number;
  roi: string;
  duration: string;
  status: 'On Track' | 'Needs Attention';
  category: string;
}

export interface ChatInvestor {
  name: string;
  type: string;
  city: string;
  min: number;
  interest: string[];
  active: number;
}

export interface QuickReply {
  label: string;
  action: string;
}

export interface BlockchainProof {
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  projectName: string;
  amount: number;
  timestamp: string;
  status: 'CONFIRMED' | 'VERIFIED';
  network: string;
  explorerUrl: string;
}

interface ChatbotState {
  step: 'idle' | 'select_project' | 'enter_amount' | 'confirm_invest' | 'enter_payment_amount' | 'payment_project';
  selectedProject: ChatProject | null;
  investAmount: number | null;
  paymentPending: { project: ChatProject; amount: number } | null;
  isOpen: boolean;
  isTyping: boolean;
}

export class BondhonChatbot {
  private static instance: BondhonChatbot | null = null;

  public static getInstance(): BondhonChatbot {
    if (!BondhonChatbot.instance) {
      BondhonChatbot.instance = new BondhonChatbot();
    }
    return BondhonChatbot.instance;
  }

  private projects: ChatProject[] = [
    {
      id: 1,
      name: 'Monsoon Paddy Harvest',
      location: 'Mymensingh & Bogura',
      funded: 90,
      target: 450000,
      raised: 405000,
      roi: '22%',
      duration: '6 months',
      status: 'On Track',
      category: 'Agriculture',
    },
    {
      id: 2,
      name: 'Sustainable Poultry & Organic Eggs',
      location: 'Bogura & Joypurhat',
      funded: 65,
      target: 280000,
      raised: 182000,
      roi: '20%',
      duration: '8 months',
      status: 'On Track',
      category: 'Livestock',
    },
    {
      id: 3,
      name: 'Sylhet Bio-Fish Hatchery',
      location: 'Sylhet & Sunamganj Haor',
      funded: 70,
      target: 850000,
      raised: 595000,
      roi: '25%',
      duration: '10 months',
      status: 'Needs Attention',
      category: 'Fisheries',
    },
    {
      id: 4,
      name: 'Nakshi Kantha Artisans Collective',
      location: 'Rajshahi & Jamalpur',
      funded: 78,
      target: 180000,
      raised: 140400,
      roi: '18%',
      duration: '4 months',
      status: 'On Track',
      category: 'Handicrafts',
    },
    {
      id: 5,
      name: 'Black Bengal Goat Breeding Farm',
      location: 'Kushtia & Meherpur',
      funded: 55,
      target: 220000,
      raised: 121000,
      roi: '21%',
      duration: '5 months',
      status: 'On Track',
      category: 'Livestock',
    },
  ];

  private investors: ChatInvestor[] = [
    {
      name: 'Anwar Hossain',
      type: 'Tech Entrepreneur',
      city: 'Dhaka',
      min: 50000,
      interest: ['Agriculture', 'Fisheries'],
      active: 3,
    },
    {
      name: 'Farah Jahan',
      type: 'Financial Analyst',
      city: 'Chittagong',
      min: 25000,
      interest: ['Handicrafts', 'Livestock'],
      active: 2,
    },
    {
      name: 'Kamrul Islam',
      type: 'NRB Investor',
      city: 'London / Dhaka',
      min: 100000,
      interest: ['Agriculture', 'Fisheries'],
      active: 4,
    },
    {
      name: 'Sumaiya Ahmed',
      type: 'Social Entrepreneur',
      city: 'Dhaka',
      min: 15000,
      interest: ['Handicrafts', 'Women Artisans'],
      active: 1,
    },
    {
      name: 'Rahim Chowdhury',
      type: 'Retired Banker',
      city: 'Sylhet',
      min: 30000,
      interest: ['Livestock', 'Agriculture'],
      active: 2,
    },
  ];

  private quickReplies = {
    main: [
      { label: '💰 Invest in a Project', action: 'invest' },
      { label: '📊 Monitor My Projects', action: 'monitor' },
      { label: '💳 Make a Payment', action: 'payment' },
      { label: '🤝 Find Investors', action: 'find_investors' },
      { label: '🌸 Women Empowerment', action: 'women' },
      { label: '❓ Help & Halal FAQ', action: 'faq' },
      { label: '🔗 Blockchain Ledger', action: 'blockchain' },
    ],
    invest_confirm: [
      { label: '✅ Confirm Investment', action: '__confirm_invest__' },
      { label: '🔄 Choose Different', action: 'invest' },
      { label: '🏠 Main Menu', action: 'main_menu' },
    ],
    payment_methods: [
      { label: '📱 bKash Direct', action: '__pay_bkash__' },
      { label: '💳 Nagad Wallet', action: '__pay_nagad__' },
      { label: '🏦 Bank Transfer (DBBL / IBBL)', action: '__pay_bank__' },
      { label: '🏠 Main Menu', action: 'main_menu' },
    ],
    back_main: [
      { label: '🏠 Back to Main Menu', action: 'main_menu' },
      { label: '💰 Invest in Another Project', action: 'invest' },
    ],
  };

  private state: ChatbotState = {
    step: 'idle',
    selectedProject: null,
    investAmount: null,
    paymentPending: null,
    isOpen: false,
    isTyping: false,
  };

  private chatWindow: HTMLElement | null = null;
  private chatBody: HTMLElement | null = null;
  private chatInput: HTMLInputElement | null = null;
  private chatSend: HTMLElement | null = null;
  private chatToggle: HTMLElement | null = null;
  private chatBadge: HTMLElement | null = null;
  private isInitialized = false;

  public init(): void {
    if (this.isInitialized) return;
    this.injectHTML();
    this.bindEvents();
    this.isInitialized = true;
  }

  private injectHTML(): void {
    if (document.getElementById('gbChatRoot')) return;

    const html = `
      <button class="gb-toggle" id="gbChatToggle" aria-label="Open Bondhon AI chat" title="Chat with Bondhon AI">
        <span class="gb-toggle-icon">
          <img src="/images/chatbot-logo.svg" alt="Bondhon AI Logo" class="gb-toggle-logo" onerror="this.onerror=null;this.src='/images/chatbot-logo.png';" />
        </span>
        <span class="gb-toggle-close">✕</span>
        <span class="gb-badge" id="gbChatBadge">1</span>
      </button>

      <div class="gb-chat-window" id="gbChatWindow" role="dialog" aria-label="Bondhon AI Chat">
        <div class="gb-chat-header">
          <div class="gb-header-info">
            <span class="gb-header-avatar">
              <img src="/images/chatbot-logo.svg" alt="Bondhon AI Logo" class="gb-avatar-img" onerror="this.onerror=null;this.src='/images/chatbot-logo.png';" />
            </span>
            <div>
              <strong>Bondhon AI</strong>
              <span class="gb-header-sub"><span class="gb-online-dot"></span>Online · Halal Assistant</span>
            </div>
          </div>
          <div class="gb-header-auth" id="gbHeaderAuth"></div>
          <button class="gb-close-btn" id="gbChatClose" aria-label="Close chat">✕</button>
        </div>

        <div class="gb-chat-body" id="gbChatBody"></div>

        <div class="gb-chat-footer">
          <input type="text" id="gbChatInput" class="gb-chat-input" placeholder="Ask about projects, ROI, Halal rules, or say Login..." autocomplete="off" maxlength="300" />
          <button id="gbChatSend" class="gb-send-btn" aria-label="Send message">➤</button>
        </div>
        <div class="gb-powered">Powered by <strong>GramBondhon</strong> · Shariah-Compliant Agritech</div>
      </div>
    `;

    const el = document.createElement('div');
    el.id = 'gbChatRoot';
    el.innerHTML = html;
    document.body.appendChild(el);
  }

  private bindEvents(): void {
    this.chatWindow = document.getElementById('gbChatWindow');
    this.chatBody = document.getElementById('gbChatBody');
    this.chatInput = document.getElementById('gbChatInput') as HTMLInputElement;
    this.chatSend = document.getElementById('gbChatSend');
    this.chatToggle = document.getElementById('gbChatToggle');
    this.chatBadge = document.getElementById('gbChatBadge');

    this.chatToggle?.addEventListener('click', () => this.toggleChat());
    this.chatSend?.addEventListener('click', () => this.handleUserInput());
    this.chatInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleUserInput();
      }
    });

    document.getElementById('gbChatClose')?.addEventListener('click', () => this.closeChat());

    // Update & listen to unified authentication changes
    this.updateHeaderAuth();
    authManager.onAuthChange(() => {
      this.updateHeaderAuth();
    });

    // Show initial notification badge after 2.5s
    setTimeout(() => {
      if (this.chatBadge && !this.state.isOpen) {
        this.chatBadge.style.display = 'flex';
      }
    }, 2500);
  }

  public updateHeaderAuth(): void {
    const el = document.getElementById('gbHeaderAuth');
    if (!el) return;

    if (authManager.isAuthenticated()) {
      const user = authManager.getUser();
      const firstName = user?.name ? user.name.split(' ')[0] : 'Investor';
      el.innerHTML = `
        <div class="gb-user-badge" id="gbUserBadgeBtn" role="button" title="Signed in as ${this.escHtml(user?.name || '')} (${authManager.getRoleBadgeText()})">
          <span class="gb-user-dot"></span>
          <span>👤 ${this.escHtml(firstName)} (Verified ✓)</span>
        </div>
      `;
      document.getElementById('gbUserBadgeBtn')?.addEventListener('click', () => {
        this.handleAction('user_profile');
      });
    } else {
      el.innerHTML = `
        <div class="gb-guest-badge" id="gbGuestBadgeBtn" role="button" title="Click to verify or sign in">
          <span>🔒 Guest · Login</span>
        </div>
      `;
      document.getElementById('gbGuestBadgeBtn')?.addEventListener('click', () => {
        this.handleAction('auth_login');
      });
    }
  }

  public getMainQuickReplies(): QuickReply[] {
    if (authManager.isAuthenticated()) {
      return [
        { label: '💰 Invest in a Project', action: 'invest' },
        { label: '📊 Monitor My Projects', action: 'monitor' },
        { label: '💳 Make a Payment', action: 'payment' },
        { label: '👤 My Investor Profile', action: 'user_profile' },
        { label: '🤝 Find Investors', action: 'find_investors' },
        { label: '🌸 Women Empowerment', action: 'women' },
        { label: '❓ Help & Halal FAQ', action: 'faq' },
        { label: '🔗 Blockchain Ledger', action: 'blockchain' },
        { label: '🚪 Sign Out', action: 'auth_logout' },
      ];
    }
    return [
      { label: '🔑 Login / Investor KYC', action: 'auth_login' },
      { label: '💰 Invest in a Project', action: 'invest' },
      { label: '📊 Platform Overview', action: 'monitor' },
      { label: '🤝 Find Investors', action: 'find_investors' },
      { label: '🌸 Women Empowerment', action: 'women' },
      { label: '❓ Help & Halal FAQ', action: 'faq' },
      { label: '🔗 Blockchain Ledger', action: 'blockchain' },
    ];
  }

  public renderAuthCard(customMsg?: string): void {
    const wrap = document.createElement('div');
    wrap.className = 'gb-msg gb-bot';

    const desc = customMsg ||
      `Capital investment in GramBandhan agricultural cohorts requires <strong>NID-verified Investor identity</strong> in compliance with Bangladesh SEC regulations and Shariah contracts.`;

    wrap.innerHTML = `
      <span class="gb-avatar"><img src="/images/chatbot-logo.svg" alt="Bondhon AI" class="gb-avatar-img" onerror="this.onerror=null;this.src='/images/chatbot-logo.png';" /></span>
      <div class="gb-bubble" style="max-width: 95%;">
        <div class="gb-auth-card">
          <div class="gb-auth-card-title">
            <span>🛡️</span>
            <span>Investor Verification & KYC Required</span>
          </div>
          <p class="gb-auth-card-desc">
            ${desc}<br><br>
            Please sign in with your verified investor profile or use Instant Demo Verification to test:
          </p>
          <div class="gb-auth-actions">
            <button class="gb-btn-auth-quick" id="gbQuickAuthBtn">
              ⚡ Instant Demo Verification (Tariq Rahman · NID Verified ✓)
            </button>
            <a href="login.html?redirect=invest" class="gb-btn-auth-portal" target="_blank">
              🔑 Open Investor Login Portal →
            </a>
            <a href="register.html?role=investor" class="gb-btn-auth-portal" target="_blank" style="background:#f8fafc; color:#334155; border:1px solid #cbd5e1;">
              📝 Register New Investor Account →
            </a>
          </div>
        </div>
      </div>
    `;

    this.chatBody?.appendChild(wrap);
    this.scrollBottom();

    wrap.querySelector('#gbQuickAuthBtn')?.addEventListener('click', () => {
      this.handleAction('__quick_login_and_invest__');
    });

    this.showQuickReplies([
      { label: '⚡ Instant Demo Verification', action: '__quick_login_and_invest__' },
      { label: '🔑 Go to Login Page', action: '__goto_login__' },
      { label: '🏠 Main Menu', action: 'main_menu' },
    ]);
  }

  public toggleChat(): void {
    this.state.isOpen ? this.closeChat() : this.openChat();
  }

  public openChat(initialAction?: string): void {
    this.state.isOpen = true;
    this.chatWindow?.classList.add('open');
    this.chatToggle?.classList.add('active');
    if (this.chatBadge) this.chatBadge.style.display = 'none';

    if (this.chatBody && this.chatBody.children.length === 0) {
      this.showGreeting();
    }

    if (initialAction) {
      setTimeout(() => this.handleAction(initialAction), 400);
    }

    setTimeout(() => {
      this.chatInput?.focus();
    }, 300);
  }

  public closeChat(): void {
    this.state.isOpen = false;
    this.chatWindow?.classList.remove('open');
    this.chatToggle?.classList.remove('active');
  }

  private showGreeting(): void {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const user = authManager.getUser();
    const authNote = user 
      ? `Welcome back, <strong>${user.name}</strong>! You are verified as an <strong>${authManager.getRoleBadgeText()}</strong> (NID: Verified ✓).<br><br>`
      : `Welcome to <strong>GramBandhan</strong>! I can help you explore opportunities, verify your investor status, and securely invest in ethical agriculture.<br><br>`;

    this.botMessage(
      `${greet}! 👋 I'm <strong>Bondhon AI</strong>, your personal investment assistant.<br><br>` +
      authNote +
      `What would you like to do today?`
    );
    this.showQuickReplies(this.getMainQuickReplies());
  }

  public botMessage(html: string, delay: number = 0): void {
    this.showTyping();
    setTimeout(() => {
      this.hideTyping();
      if (!this.chatBody) return;
      const msg = document.createElement('div');
      msg.className = 'gb-msg gb-bot';
      msg.innerHTML = `<span class="gb-avatar"><img src="/images/chatbot-logo.svg" alt="Bondhon AI" class="gb-avatar-img" onerror="this.onerror=null;this.src='/images/chatbot-logo.png';" /></span><div class="gb-bubble">${html}</div>`;
      this.chatBody.appendChild(msg);
      this.scrollBottom();
    }, delay + 450);
  }

  public userMessage(text: string): void {
    if (!this.chatBody) return;
    const msg = document.createElement('div');
    msg.className = 'gb-msg gb-user';
    msg.innerHTML = `<div class="gb-bubble">${this.escHtml(text)}</div>`;
    this.chatBody.appendChild(msg);
    this.scrollBottom();
  }

  private showTyping(): void {
    if (!this.chatBody || document.getElementById('gbTyping')) return;
    const el = document.createElement('div');
    el.id = 'gbTyping';
    el.className = 'gb-msg gb-bot';
    el.innerHTML = '<span class="gb-avatar"><img src="/images/chatbot-logo.svg" alt="Bondhon AI" class="gb-avatar-img" onerror="this.onerror=null;this.src=\'/images/chatbot-logo.png\';" /></span><div class="gb-bubble gb-typing"><span></span><span></span><span></span></div>';
    this.chatBody.appendChild(el);
    this.scrollBottom();
  }

  private hideTyping(): void {
    const el = document.getElementById('gbTyping');
    if (el) el.remove();
  }

  private showQuickReplies(replies: QuickReply[]): void {
    if (!this.chatBody) return;
    const wrap = document.createElement('div');
    wrap.className = 'gb-quick-wrap';
    replies.forEach((r) => {
      const btn = document.createElement('button');
      btn.className = 'gb-quick';
      btn.textContent = r.label;
      btn.addEventListener('click', () => {
        wrap.remove();
        this.userMessage(r.label);
        this.handleAction(r.action);
      });
      wrap.appendChild(btn);
    });
    this.chatBody.appendChild(wrap);
    this.scrollBottom();
  }

  private showProjectCards(projects: ChatProject[]): void {
    if (!this.chatBody) return;
    const wrap = document.createElement('div');
    wrap.className = 'gb-cards-wrap';

    projects.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'gb-proj-card';
      const statusCls = p.status === 'On Track' ? 'on-track' : 'watch';

      card.innerHTML = `
        <div class="gb-proj-head">
          <span class="gb-proj-cat">${p.category}</span>
          <span class="gb-proj-status ${statusCls}">${p.status}</span>
        </div>
        <h4>${p.name}</h4>
        <p>📍 ${p.location} &nbsp;|&nbsp; 📅 ${p.duration}</p>
        <div class="gb-proj-bar-wrap">
          <div class="gb-proj-bar" style="width:${p.funded}%"></div>
        </div>
        <div class="gb-proj-meta">
          <span><strong>${p.funded}%</strong> Funded</span>
          <span>Target ROI: <strong style="color:#015546">${p.roi}</strong></span>
          <span>৳${p.raised.toLocaleString()} / ৳${p.target.toLocaleString()}</span>
        </div>
        <button class="gb-proj-btn" data-id="${p.id}">Invest in This Project →</button>
      `;

      card.querySelector('.gb-proj-btn')?.addEventListener('click', () => {
        if (!authManager.isAuthenticated() || !authManager.hasRole('investor')) {
          this.state.selectedProject = p;
          this.userMessage(`I want to invest in: ${p.name}`);
          this.renderAuthCard(`To invest in 🌾 <strong>${p.name}</strong>, NID-verified investor credentials are required under SEC & Shariah compliance.`);
          return;
        }

        wrap.remove();
        this.state.selectedProject = p;
        this.state.step = 'enter_amount';
        this.userMessage(`I want to invest in: ${p.name}`);
        this.botMessage(
          `Great choice! 🌾 <strong>${p.name}</strong> is ${p.funded}% funded with an expected ROI of <strong>${p.roi}</strong>.<br><br>` +
          `Minimum investment: <strong>৳5,000</strong><br>` +
          `Available cohort quota: <strong>৳${(p.target - p.raised).toLocaleString()}</strong><br><br>` +
          `Please type the amount you'd like to invest (e.g. <code>10000</code>):`
        );
      });

      wrap.appendChild(card);
    });

    this.chatBody.appendChild(wrap);
    this.scrollBottom();
  }

  private showInvestorCards(investors: ChatInvestor[]): void {
    if (!this.chatBody) return;
    const wrap = document.createElement('div');
    wrap.className = 'gb-cards-wrap';

    investors.forEach((inv) => {
      const card = document.createElement('div');
      card.className = 'gb-inv-card';
      card.innerHTML = `
        <div class="gb-inv-head">
          <span class="gb-inv-avatar">👤</span>
          <div>
            <h4>${inv.name}</h4>
            <p>${inv.type} · ${inv.city}</p>
          </div>
        </div>
        <div class="gb-inv-tags">
          ${inv.interest.map((t) => `<span>${t}</span>`).join('')}
        </div>
        <div class="gb-inv-meta">
          <span>Min Ticket: <strong>৳${inv.min.toLocaleString()}</strong></span>
          <span>Active Cohorts: <strong>${inv.active}</strong></span>
        </div>
        <button class="gb-proj-btn">Connect with Investor →</button>
      `;

      card.querySelector('.gb-proj-btn')?.addEventListener('click', () => {
        this.userMessage(`Connect with ${inv.name}`);
        this.botMessage(
          `📩 A connection request has been sent to <strong>${inv.name}</strong>! They will receive your project details and respond within 24 hours.<br><br>` +
          `You'll receive an automated notification once accepted.`
        );
        this.showQuickReplies(this.quickReplies.back_main);
      });

      wrap.appendChild(card);
    });

    this.chatBody.appendChild(wrap);
    this.scrollBottom();
  }

  public handleAction(action: string): void {
    switch (action) {
      case 'invest':
        this.state.step = 'select_project';
        this.botMessage('Here are our verified active agricultural opportunities. All projects are <strong>100% Shariah-compliant (Musharakah)</strong> and asset-backed 🌿');
        setTimeout(() => this.showProjectCards(this.projects), 600);
        break;

      case 'monitor':
        this.state.step = 'idle';
        let tableHtml = '<strong>📊 Your Portfolio & Platform Overview</strong><br><br>';
        tableHtml += '<table class="gb-table"><thead><tr><th>Cohort</th><th>Funded</th><th>Status</th></tr></thead><tbody>';
        this.projects.forEach((p) => {
          const dot = p.status === 'On Track' ? '🟢' : '🟡';
          tableHtml += `<tr><td><strong>${p.name}</strong><br><small style="color:#64748B">${p.location}</small></td><td>${p.funded}%</td><td>${dot} ${p.status}</td></tr>`;
        });
        tableHtml += '</tbody></table><br>All disbursements are tracked via IoT field sensors and satellite verification.';
        this.botMessage(tableHtml);
        this.showQuickReplies(this.quickReplies.back_main);
        break;

      case 'payment':
        this.state.step = 'payment_project';
        this.botMessage('Which project would you like to make an investment or payment for? Select below:');
        const payQR: QuickReply[] = this.projects.map((p) => ({
          label: p.name,
          action: `__pay_project_${p.id}__`,
        }));
        payQR.push({ label: '🏠 Main Menu', action: 'main_menu' });
        setTimeout(() => this.showQuickReplies(payQR), 600);
        break;

      case 'find_investors':
        this.state.step = 'idle';
        this.botMessage('Here are <strong>verified ethical investors</strong> currently active on GramBandhan. You can send them a direct connection request 🤝');
        setTimeout(() => this.showInvestorCards(this.investors), 600);
        break;

      case 'women':
        this.state.step = 'idle';
        this.botMessage(
          `🌸 <strong>GramBandhan Women Empowerment Program</strong><br><br>` +
          `Our program directly empowers female farmers and rural artisans across Rangpur, Jamalpur, and Rajshahi:<br><br>` +
          `• Average household income growth: <strong>214%</strong><br>` +
          `• Total ethical capital deployed: <strong>৳3.2 Crore</strong><br>` +
          `• Skills trained: <strong>892 women</strong> in precision agriculture & craft<br>` +
          `• Marketplace artisanal products: <strong>3,480 items</strong> with 0% middleman fees`
        );
        this.showQuickReplies(this.quickReplies.back_main);
        break;

      case 'faq':
        this.state.step = 'idle';
        this.botMessage(
          `<strong>❓ Frequently Asked Questions</strong><br><br>` +
          `<b>Is my investment halal?</b><br>Yes — 100% Shariah-compliant (Musharakah / Mudarabah), zero interest (Riba-free), and backed by physical crops or livestock.<br><br>` +
          `<b>What is the minimum investment?</b><br>As low as <strong>৳5,000 BDT</strong>.<br><br>` +
          `<b>How do I receive returns?</b><br>Profits are distributed directly to your bKash, Nagad, or Bank Account after harvest.<br><br>` +
          `<b>How are projects verified?</b><br>On-site agricultural field officers verify every plot, backed by drone imagery and smart contracts.`
        );
        this.showQuickReplies(this.quickReplies.back_main);
        break;

      case 'blockchain':
        this.state.step = 'idle';
        apiClient.getBlockchainStatus().then((bc) => {
          this.botMessage(
            `🔗 <strong>Base Sepolia Blockchain Ledger</strong><br><br>` +
            `Every investment contract and milestone payout on GramBandhan is cryptographically hashed and minted on-chain for tamper-proof accountability.<br><br>` +
            `<div class="gb-blockchain-card">` +
              `<div class="bc-title">⛓️ Smart Contract: ${bc.verifiedContracts[0]?.name || 'AgriPlatform'}</div>` +
              `<div class="bc-row"><span>Network:</span><span class="bc-val">${bc.network} (Chain ID ${bc.chainId})</span></div>` +
              `<div class="bc-row"><span>Contract:</span><span class="bc-val">${bc.contractAddress}</span></div>` +
              `<div class="bc-row"><span>Latest Block:</span><span class="bc-val">#${bc.blockNumber}</span></div>` +
              `<div class="bc-row"><span>Contracts:</span><span class="bc-val">${bc.verifiedContracts.map(c => c.name).join(', ')}</span></div>` +
              `<div class="bc-row"><span>Status:</span><span class="bc-val" style="color:#34D399">VERIFIED ✓ (Online)</span></div>` +
            `</div>`
          );
        }).catch(() => {
          this.botMessage(
            `🔗 <strong>Base Sepolia Blockchain Ledger</strong><br><br>` +
            `Every investment contract and milestone payout on GramBandhan is cryptographically hashed and minted on-chain for tamper-proof accountability.<br><br>` +
            `<div class="gb-blockchain-card">` +
              `<div class="bc-title">⛓️ Smart Contract: AgriPlatform</div>` +
              `<div class="bc-row"><span>Network:</span><span class="bc-val">Base Sepolia (EVM 84532)</span></div>` +
              `<div class="bc-row"><span>Contract:</span><span class="bc-val">0x9048...d29F</span></div>` +
              `<div class="bc-row"><span>Status:</span><span class="bc-val" style="color:#34D399">VERIFIED ✓</span></div>` +
            `</div>`
          );
        });
        this.showQuickReplies(this.quickReplies.back_main);
        break;

      case 'main_menu':
        this.state.step = 'idle';
        this.state.selectedProject = null;
        this.state.investAmount = null;
        this.botMessage('How else can I assist you today? 😊');
        this.showQuickReplies(this.getMainQuickReplies());
        break;

      case 'auth_login':
        if (authManager.isAuthenticated()) {
          const user = authManager.getUser();
          this.botMessage(
            `You are currently signed in as <strong>${this.escHtml(user?.name || '')}</strong>.<br>` +
            `Role: <strong>${authManager.getRoleBadgeText()}</strong><br>` +
            `NID Status: <strong style="color:#059669">${user?.nidVerified ? 'Verified ✓' : 'Pending'}</strong>.<br><br>` +
            `Would you like to invest in a project, check your profile, or view live telemetry?`
          );
          this.showQuickReplies([
            { label: '💰 Invest in a Project', action: 'invest' },
            { label: '👤 View Profile', action: 'user_profile' },
            { label: '📊 Monitor My Projects', action: 'monitor' },
            { label: '🚪 Sign Out', action: 'auth_logout' },
            { label: '🏠 Main Menu', action: 'main_menu' },
          ]);
        } else {
          this.renderAuthCard('Welcome to GramBandhan! Please log in or verify your investor identity before investing:');
        }
        break;

      case 'user_profile': {
        const u = authManager.getUser();
        if (!u) {
          this.botMessage('You are not currently signed in.');
          this.showQuickReplies([
            { label: '🔑 Login / Verify', action: 'auth_login' },
            { label: '🏠 Main Menu', action: 'main_menu' },
          ]);
          break;
        }
        this.botMessage(
          `👤 <strong>Investor Profile & Verification</strong><br><br>` +
          `• <strong>Name:</strong> ${this.escHtml(u.name)}<br>` +
          `• <strong>Role:</strong> ${authManager.getRoleBadgeText()}<br>` +
          `• <strong>Email:</strong> ${this.escHtml(u.email)}<br>` +
          `• <strong>Phone:</strong> ${this.escHtml(u.phone || 'N/A')}<br>` +
          `• <strong>NID Status:</strong> ${u.nidVerified ? '<span style="color:#059669; font-weight:700;">Verified ✓ (KYC Passed)</span>' : '<span style="color:#DC2626">Unverified</span>'}<br>` +
          `• <strong>Active Portfolio:</strong> ৳${(u.portfolioValueBDT || 150000).toLocaleString()} BDT<br>` +
          `• <strong>Address:</strong> ${this.escHtml(u.address || 'Dhaka, Bangladesh')}<br>` +
          `• <strong>Member Since:</strong> ${u.memberSince || 'March 2026'}`
        );
        this.showQuickReplies([
          { label: '💰 Invest in a Project', action: 'invest' },
          { label: '📊 Monitor My Projects', action: 'monitor' },
          { label: '🚪 Sign Out', action: 'auth_logout' },
          { label: '🏠 Main Menu', action: 'main_menu' },
        ]);
        break;
      }

      case 'auth_logout': {
        authManager.logout();
        this.updateHeaderAuth();
        this.botMessage('You have been signed out successfully. You can continue browsing public agricultural summaries, or log in anytime.');
        this.showQuickReplies(this.getMainQuickReplies());
        break;
      }

      case '__quick_login_and_invest__': {
        const user = authManager.demoLogin('investor');
        this.updateHeaderAuth();
        this.botMessage(
          `✅ <strong>Investor Verification Successful!</strong><br><br>` +
          `👤 <strong>Investor:</strong> ${this.escHtml(user.name)}<br>` +
          `📧 <strong>Email:</strong> ${this.escHtml(user.email)}<br>` +
          `📱 <strong>Phone:</strong> ${this.escHtml(user.phone || '')}<br>` +
          `🆔 <strong>NID Status:</strong> 1988269120485921 (Verified ✓)<br>` +
          `🛡️ <strong>Compliance:</strong> KYC Approved · Musharakah Partner Authorized<br><br>` +
          `You are now authenticated to invest and receive cryptographic dividend receipts.`
        );

        if (this.state.selectedProject) {
          const p = this.state.selectedProject;
          this.state.step = 'enter_amount';
          setTimeout(() => {
            this.botMessage(
              `Resuming investment in 🌾 <strong>${p.name}</strong>.<br>` +
              `Please enter your investment amount in BDT (minimum ৳5,000):`
            );
          }, 600);
        } else {
          setTimeout(() => {
            this.handleAction('invest');
          }, 600);
        }
        break;
      }

      case '__goto_login__':
        window.open('login.html?redirect=invest', '_blank');
        this.botMessage('The investor login portal was opened in a new tab. After signing in, click below to refresh:');
        this.showQuickReplies([
          { label: '🔄 Refresh Status', action: 'user_profile' },
          { label: '⚡ Instant Demo Verification', action: '__quick_login_and_invest__' },
          { label: '🏠 Main Menu', action: 'main_menu' },
        ]);
        break;

      case '__goto_register__':
        window.open('register.html?role=investor', '_blank');
        this.botMessage('The investor registration portal was opened in a new tab.');
        this.showQuickReplies([
          { label: '⚡ Instant Demo Verification', action: '__quick_login_and_invest__' },
          { label: '🏠 Main Menu', action: 'main_menu' },
        ]);
        break;

      case '__confirm_invest__':
        if (!authManager.isAuthenticated() || !authManager.hasRole('investor')) {
          this.renderAuthCard('Investor identity verification is required before confirming this investment.');
          break;
        }
        if (this.state.selectedProject && this.state.investAmount) {
          const p = this.state.selectedProject;
          const amt = this.state.investAmount;
          this.state.paymentPending = { project: p, amount: amt };
          this.botMessage(
            `✅ <strong>Investment Confirmed!</strong><br><br>` +
            `📋 <strong>Project:</strong> ${p.name}<br>` +
            `💰 <strong>Committed Capital:</strong> ৳${amt.toLocaleString()}<br>` +
            `📍 <strong>Location:</strong> ${p.location}<br>` +
            `📈 <strong>Expected ROI:</strong> ${p.roi} (${p.duration})<br><br>` +
            `Please choose your preferred <strong>payment method</strong> to complete the transaction:`
          );
          setTimeout(() => this.showQuickReplies(this.quickReplies.payment_methods), 600);
        }
        break;

      case '__pay_bkash__':
      case '__pay_nagad__':
      case '__pay_bank__': {
        const method =
          action === '__pay_bkash__'
            ? 'bKash'
            : action === '__pay_nagad__'
            ? 'Nagad'
            : 'Bank Transfer';
        const p2 = this.state.paymentPending;
        if (p2) {
          const user = authManager.getUser();
          const investorName = user ? user.name : 'Tariq Rahman';
          const nidDisplay = user?.nidVerified ? 'Verified ✓ (NID 198826...)' : 'Verified ✓';
          const txId = 'GB' + Date.now().toString().slice(-8).toUpperCase();
          const txHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          const blockNumber = 19824000 + Math.floor(Math.random() * 5000);

          // Post to live backend ledger with authenticated investor details
          apiClient.createPayment({
            deal: p2.project.name,
            amount: p2.amount,
            method,
            type: 'INVESTMENT',
            investor: investorName,
            email: user?.email,
            phone: user?.phone
          }).catch(console.warn);

          const instructions =
            method === 'Bank Transfer'
              ? 'Bank: <strong>Dutch-Bangla Bank Ltd</strong><br>A/C: <strong>1481140025784</strong><br>Branch: Dhanmondi, Dhaka<br><br>Transfer the funds and reference <strong>' + txId + '</strong>.<br>'
              : 'Send <strong>৳' + p2.amount.toLocaleString() + '</strong> to <strong>01712-345678</strong> (' + method + ' merchant).<br>Reference ID: <strong>' + txId + '</strong><br>';

          this.botMessage(
            `🎉 <strong>Payment Initiated via ${method}!</strong><br><br>` +
            `👤 <strong>Verified Investor:</strong> ${this.escHtml(investorName)}<br>` +
            `🆔 <strong>KYC Status:</strong> <span style="color:#059669; font-weight:700;">${nidDisplay}</span><br>` +
            `🧾 <strong>Reference ID:</strong> <code>${txId}</code><br>` +
            `💰 <strong>Amount:</strong> ৳${p2.amount.toLocaleString()} BDT<br>` +
            `🌾 <strong>Cohort:</strong> ${p2.project.name}<br><br>` +
            instructions + `<br>` +
            `<div class="gb-blockchain-card">` +
              `<div class="bc-title">⛓️ Blockchain Verification Proof</div>` +
              `<div class="bc-row"><span>Network:</span><span class="bc-val">Base Sepolia</span></div>` +
              `<div class="bc-row"><span>Investor:</span><span class="bc-val">${this.escHtml(investorName)}</span></div>` +
              `<div class="bc-row"><span>Tx Hash:</span><span class="bc-val">${txHash.slice(0, 16)}...</span></div>` +
              `<div class="bc-row"><span>Block:</span><span class="bc-val">#${blockNumber}</span></div>` +
              `<div class="bc-row"><span>Status:</span><span class="bc-val" style="color:#34D399">CONFIRMED (12 Block Confirmations)</span></div>` +
            `</div><br>` +
            `📊 Your investment certificate and live plot telemetry are now active in your dashboard.`
          );

          this.state.paymentPending = null;
          this.state.selectedProject = null;
          this.state.investAmount = null;
          this.state.step = 'idle';
          setTimeout(() => this.showQuickReplies(this.quickReplies.back_main), 800);
        }
        break;
      }

      default:
        if (action.startsWith('__pay_project_')) {
          const pid = parseInt(action.replace('__pay_project_', '').replace('__', ''), 10);
          const proj = this.projects.find((x) => x.id === pid);
          if (proj) {
            if (!authManager.isAuthenticated() || !authManager.hasRole('investor')) {
              this.state.selectedProject = proj;
              this.renderAuthCard(`To invest in 🌾 <strong>${proj.name}</strong>, NID-verified investor credentials are required under SEC & Shariah compliance.`);
              return;
            }
            this.state.paymentPending = { project: proj, amount: 5000 };
            this.botMessage(`How much would you like to invest in <strong>${proj.name}</strong>? Please enter the amount in BDT (min ৳5,000):`);
            this.state.step = 'enter_payment_amount';
          }
        }
        break;
    }
  }

  private handleUserInput(): void {
    if (!this.chatInput) return;
    const text = this.chatInput.value.trim();
    if (!text) return;
    this.chatInput.value = '';
    this.userMessage(text);

    const qw = this.chatBody?.querySelector('.gb-quick-wrap');
    if (qw) qw.remove();

    const lower = text.toLowerCase();

    // Step: enter amount for selected project
    if (this.state.step === 'enter_amount') {
      const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (!amount || amount < 5000) {
        this.botMessage('Minimum investment is <strong>৳5,000</strong>. Please enter a valid amount (e.g. 10000):');
        return;
      }
      this.state.investAmount = amount;
      this.state.step = 'confirm_invest';
      const p = this.state.selectedProject!;
      this.botMessage(
        `📋 <strong>Investment Summary</strong><br><br>` +
        `🌾 <strong>Cohort:</strong> ${p.name}<br>` +
        `📍 <strong>Location:</strong> ${p.location}<br>` +
        `💰 <strong>Your Investment:</strong> ৳${amount.toLocaleString()} BDT<br>` +
        `📈 <strong>Expected ROI:</strong> ${p.roi}<br>` +
        `📅 <strong>Duration:</strong> ${p.duration}<br><br>` +
        `Shall I confirm this investment?`
      );
      setTimeout(() => this.showQuickReplies(this.quickReplies.invest_confirm), 600);
      return;
    }

    // Step: enter payment amount directly
    if (this.state.step === 'enter_payment_amount') {
      const pamt = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (!pamt || pamt < 100) {
        this.botMessage('Please enter a valid amount (minimum ৳100):');
        return;
      }
      if (this.state.paymentPending) {
        this.state.paymentPending.amount = pamt;
      }
      this.state.step = 'idle';
      this.botMessage(`Choose your preferred payment method for <strong>৳${pamt.toLocaleString()}</strong>:`);
      setTimeout(() => this.showQuickReplies(this.quickReplies.payment_methods), 600);
      return;
    }

    // Authentication & Verification Keyword Intent Recognition
    if (/(^|\b)(login|log\s*in|sign\s*in|লগইন|লগ\s*ইন|ভেরিফাই|verify|verification|ভেরিফিকেশন|kyc|কেওয়াইসি)(\b|$)/i.test(lower)) {
      this.handleAction('auth_login');
      return;
    } else if (/(^|\b)(logout|log\s*out|sign\s*out|লগআউট|লগ\s*আউট)(\b|$)/i.test(lower)) {
      this.handleAction('auth_logout');
      return;
    } else if (/(^|\b)(profile|account|my\s*account|user|প্রোফাইল|একাউন্ট)(\b|$)/i.test(lower)) {
      this.handleAction('user_profile');
      return;
    }

    // Keyword Intent Recognition
    if (/invest|bond|fund|project|farm|paddy|poultry|fish|kantha|goat|harvest|বিনিয়োগ|ইনভেস্ট|টাকা/i.test(lower)) {
      this.handleAction('invest');
    } else if (/monitor|track|progress|dashboard|status|portfolio|telemetry|crop/i.test(lower)) {
      this.handleAction('monitor');
    } else if (/pay|payment|bkash|nagad|bank|transfer|send money/i.test(lower)) {
      this.handleAction('payment');
    } else if (/investor|partner|connect|find|syndicate/i.test(lower)) {
      this.handleAction('find_investors');
    } else if (/women|empow|artisan|nakshi|handicraft/i.test(lower)) {
      this.handleAction('women');
    } else if (/blockchain|ledger|hash|contract|sepolia|on-chain/i.test(lower)) {
      this.handleAction('blockchain');
    } else if (/hello|hi|salam|hey|good morning|good evening/i.test(lower)) {
      this.botMessage('Hello! Assalamu Alaikum! 😊 How can Bondhon AI assist you with your investments today?');
      this.showQuickReplies(this.getMainQuickReplies());
    } else if (/roi|return|profit|yield|rate/i.test(lower)) {
      this.botMessage('Our agricultural projects offer <strong>18–25% expected ROI</strong> through halal profit-sharing (Musharakah). Would you like to browse active cohorts?');
      this.showQuickReplies([
        { label: '💰 Browse Projects', action: 'invest' },
        { label: '🏠 Main Menu', action: 'main_menu' },
      ]);
    } else if (/faq|help|halal|shariah|riba|interest|haram/i.test(lower)) {
      this.handleAction('faq');
    } else if (/thank|thanks|dhonnobad|shukran/i.test(lower)) {
      this.botMessage("You're most welcome! 🙏 May your investments bring barakah. Is there anything else I can help with?");
      this.showQuickReplies(this.getMainQuickReplies());
    } else {
      this.botMessage("I'm here to help with all GramBandhan projects, payments, and halal investments! Please choose an option below or ask any specific question:");
      this.showQuickReplies(this.getMainQuickReplies());
    }
  }

  private scrollBottom(): void {
    if (this.chatBody) {
      this.chatBody.scrollTop = this.chatBody.scrollHeight;
    }
  }

  private escHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const bondhonChatbot = BondhonChatbot.getInstance();
