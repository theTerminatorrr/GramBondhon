import { ACTIVE_PROJECTS, FEATURED_PROJECT } from './data';
import { Project, ProjectCategory } from './types';
import { authManager } from './auth';

/**
 * GRAMBONDHON PROJECTS CONTROLLER
 * 
 * Renders rich bilingual project cards with high-visibility profit indicators,
 * full-width layout, and interactive modal simulator for investors.
 */

export class ActiveProjectsController {
  private currentFilter: ProjectCategory = 'all';
  private allProjects: Project[] = [...ACTIVE_PROJECTS, FEATURED_PROJECT];
  private showAllProjects: boolean = true;
  private searchQuery: string = '';

  constructor() {
    // Initialized
  }

  public init(): void {
    this.renderActiveProjects();
    this.renderFeaturedProject();
    this.setupCategoryFilters();
    this.setupProjectSearch();
    this.setupEventListeners();
  }

  public toggleShowAllProjects(): void {
    this.showAllProjects = !this.showAllProjects;
    this.renderActiveProjects();
  }

  public isShowingAll(): boolean {
    return this.showAllProjects;
  }

  public filterByCategory(category: ProjectCategory): void {
    const filterContainer = document.getElementById('project-filters');
    if (filterContainer) {
      filterContainer.querySelectorAll('.filter-pill').forEach(b => {
        const btn = b as HTMLElement;
        if (btn.dataset.category === category) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    this.currentFilter = category;
    this.showAllProjects = true;
    this.renderActiveProjects();
  }

  private setupCategoryFilters(): void {
    const filterContainer = document.getElementById('project-filters');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.filter-pill') as HTMLElement;
      if (!btn) return;

      const category = btn.dataset.category as ProjectCategory;
      if (!category) return;

      filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      this.currentFilter = category;
      this.renderActiveProjects();
    });
  }

  private setupProjectSearch(): void {
    const searchInput = document.getElementById('project-search-input') as HTMLInputElement;
    const suggestionsEl = document.getElementById('project-search-suggestions');
    const clearBtn = document.getElementById('project-search-clear');
    if (!searchInput || !suggestionsEl) return;

    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      if (clearBtn) {
        clearBtn.style.display = searchInput.value.length > 0 ? 'inline-flex' : 'none';
      }
      this.renderSearchSuggestions(searchInput.value);
      this.renderActiveProjects();
    });

    searchInput.addEventListener('focus', () => {
      this.renderSearchSuggestions(searchInput.value);
    });

    clearBtn?.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearBtn.style.display = 'none';
      suggestionsEl.classList.remove('active');
      this.renderActiveProjects();
    });

    // Category slider navigation buttons (Slide bar in/out type)
    const prevBtn = document.getElementById('slide-categories-prev');
    const nextBtn = document.getElementById('slide-categories-next');
    const filterPills = document.getElementById('project-filters');

    prevBtn?.addEventListener('click', () => {
      filterPills?.scrollBy({ left: -220, behavior: 'smooth' });
    });

    nextBtn?.addEventListener('click', () => {
      filterPills?.scrollBy({ left: 220, behavior: 'smooth' });
    });

    document.addEventListener('click', (e) => {
      const searchWrapper = (e.target as HTMLElement).closest('#project-search-wrapper');
      if (!searchWrapper && suggestionsEl) {
        suggestionsEl.classList.remove('active');
      }
    });
  }

  private renderSearchSuggestions(query: string): void {
    const suggestionsEl = document.getElementById('project-search-suggestions');
    if (!suggestionsEl) return;

    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      // Empty input: show popular category quick suggestions
      suggestionsEl.innerHTML = `
        <div class="p-sugg-header">
          <span>✨ QUICK RECOMMENDATIONS</span>
          <span>Type to filter</span>
        </div>
        <div class="p-sugg-item" data-sugg-type="category" data-cat="handicrafts">
          <span class="p-sugg-icon">🧵</span>
          <div class="p-sugg-text">
            <strong>Type "h" for Handicrafts & Artisans</strong>
            <span>Eco Jute, Nakshi Kantha, Bamboo & Handloom</span>
          </div>
          <span class="p-sugg-badge">10 Projects</span>
        </div>
        <div class="p-sugg-item" data-sugg-type="category" data-cat="short_term">
          <span class="p-sugg-icon">⏳</span>
          <div class="p-sugg-text">
            <strong>Type "s" for Short-Term (3-4 Months)</strong>
            <span>Red Chilli, Mustard, Broiler & Honey</span>
          </div>
          <span class="p-sugg-badge">19 Projects</span>
        </div>
        <div class="p-sugg-item" data-sugg-type="category" data-cat="long_term">
          <span class="p-sugg-icon">📅</span>
          <div class="p-sugg-text">
            <strong>Type "l" for Long-Term (5-6+ Months)</strong>
            <span>Dairy, Fisheries Hatchery & Green Tea</span>
          </div>
          <span class="p-sugg-badge">12 Projects</span>
        </div>
      `;
      suggestionsEl.classList.add('active');
      this.attachSuggestionListeners(suggestionsEl);
      return;
    }

    // Check for category suggestions first
    const categorySuggestions: Array<{ cat: ProjectCategory; icon: string; title: string; desc: string; count: number }> = [];

    if (trimmed === 'h' || trimmed === 'ha' || trimmed.startsWith('hand') || trimmed === 'হ' || 'handicrafts'.includes(trimmed)) {
      const count = this.allProjects.filter(p => p.category.toLowerCase() === 'handicrafts').length;
      categorySuggestions.push({
        cat: 'handicrafts',
        icon: '🧵',
        title: 'Handicrafts & Artisans (হস্তশিল্প)',
        desc: 'Eco Jute, Nakshi Kantha, Bamboo Art & Handloom',
        count
      });
    }

    if (trimmed === 's' || trimmed === 'sh' || trimmed.startsWith('short') || trimmed === 'স্বল্প' || 'short_term'.includes(trimmed)) {
      const count = this.allProjects.filter(p => p.durationMonths <= 4).length;
      categorySuggestions.push({
        cat: 'short_term',
        icon: '⏳',
        title: 'Short-Term Projects (স্বল্পমেয়াদী ৩-৪ মাস)',
        desc: 'Quick harvest & turnaround projects',
        count
      });
    }

    if (trimmed === 'l' || trimmed === 'lo' || trimmed.startsWith('long') || trimmed === 'দীর্ঘ' || 'long_term'.includes(trimmed)) {
      const count = this.allProjects.filter(p => p.durationMonths >= 5).length;
      categorySuggestions.push({
        cat: 'long_term',
        icon: '📅',
        title: 'Long-Term Projects (দীর্ঘমেয়াদী ৫-৬+ মাস)',
        desc: 'Higher annual yield long cycle projects',
        count
      });
    }

    if (trimmed === 'c' || trimmed.startsWith('crop') || trimmed.startsWith('farm') || trimmed === 'কৃষি' || 'crops'.includes(trimmed)) {
      const count = this.allProjects.filter(p => p.category.toLowerCase() === 'crops' || p.category.toLowerCase() === 'agriculture').length;
      categorySuggestions.push({
        cat: 'crops',
        icon: '🌾',
        title: 'Crops & Farming (কৃষি ও ফসল)',
        desc: 'Paddy, Red Chilli, Potatoes, Mustard & Maize',
        count
      });
    }

    if (trimmed === 'f' || trimmed.startsWith('fish') || trimmed === 'মাছ' || 'fisheries'.includes(trimmed)) {
      const count = this.allProjects.filter(p => p.category.toLowerCase() === 'fisheries').length;
      categorySuggestions.push({
        cat: 'fisheries',
        icon: '🐟',
        title: 'Fisheries (মৎস্য চাষ)',
        desc: 'Aquaculture, Prawns & Carp fish farming',
        count
      });
    }

    if (trimmed === 'd' || trimmed.startsWith('live') || trimmed.startsWith('dairy') || trimmed === 'পশু' || 'livestock'.includes(trimmed)) {
      const count = this.allProjects.filter(p => p.category.toLowerCase() === 'livestock').length;
      categorySuggestions.push({
        cat: 'livestock',
        icon: '🐄',
        title: 'Livestock & Dairy (পশুপালন ও দুগ্ধ)',
        desc: 'Deshi cow fattening, milk chilling & goats',
        count
      });
    }

    // Matching project items
    let matchedProjects = this.allProjects.filter(p => 
      p.name.toLowerCase().includes(trimmed) ||
      p.bengaliName.toLowerCase().includes(trimmed) ||
      p.category.toLowerCase().includes(trimmed) ||
      p.location.toLowerCase().includes(trimmed) ||
      (p.district && p.district.toLowerCase().includes(trimmed))
    );

    // If typing 'h', prioritize handicraft projects
    if (trimmed === 'h' || trimmed === 'ha' || trimmed.startsWith('hand') || trimmed === 'হ') {
      const handi = matchedProjects.filter(p => p.category.toLowerCase() === 'handicrafts');
      const others = matchedProjects.filter(p => p.category.toLowerCase() !== 'handicrafts');
      matchedProjects = [...handi, ...others];
    }

    if (categorySuggestions.length === 0 && matchedProjects.length === 0) {
      suggestionsEl.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #64748B; font-size: 0.8rem;">
          No matching projects or categories for "<strong>${query}</strong>"
        </div>
      `;
      suggestionsEl.classList.add('active');
      return;
    }

    let html = '';

    if (categorySuggestions.length > 0) {
      html += `
        <div class="p-sugg-header">
          <span>✨ CATEGORY RECOMMENDATIONS</span>
          <span>Click to filter</span>
        </div>
        ${categorySuggestions.map(cs => `
          <div class="p-sugg-item" data-sugg-type="category" data-cat="${cs.cat}">
            <span class="p-sugg-icon">${cs.icon}</span>
            <div class="p-sugg-text">
              <strong>${cs.title}</strong>
              <span>${cs.desc}</span>
            </div>
            <span class="p-sugg-badge">${cs.count} Projects</span>
          </div>
        `).join('')}
      `;
    }

    if (matchedProjects.length > 0) {
      html += `
        <div class="p-sugg-header">
          <span>🎯 MATCHING ACTIVE PROJECTS (${matchedProjects.length})</span>
          <span>Click to view</span>
        </div>
        ${matchedProjects.slice(0, 6).map(p => `
          <div class="p-sugg-item" data-sugg-type="project" data-project-id="${p.id}">
            <img src="${p.image}" alt="${p.name}" class="p-sugg-thumb" />
            <div class="p-sugg-text">
              <strong>${p.name}</strong>
              <span>📍 ${p.location} • ${p.periodText || (p.durationMonths + ' Mo')} • Return: ${p.potentialReturn}</span>
            </div>
            <span class="p-sugg-badge">৳ ${p.minInvestmentBDT.toLocaleString()}</span>
          </div>
        `).join('')}
      `;
    }

    suggestionsEl.innerHTML = html;
    suggestionsEl.classList.add('active');
    this.attachSuggestionListeners(suggestionsEl);
  }

  private attachSuggestionListeners(suggestionsEl: HTMLElement): void {
    suggestionsEl.querySelectorAll('.p-sugg-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        const suggType = el.dataset.suggType;
        if (suggType === 'category') {
          const cat = el.dataset.cat as ProjectCategory;
          if (cat) {
            const searchInput = document.getElementById('project-search-input') as HTMLInputElement;
            if (searchInput) searchInput.value = '';
            this.searchQuery = '';
            suggestionsEl.classList.remove('active');
            this.filterByCategory(cat);
          }
        } else if (suggType === 'project') {
          const projId = el.dataset.projectId;
          if (projId) {
            suggestionsEl.classList.remove('active');
            this.handleProjectClick(projId, false);
          }
        }
      });
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      const viewBtn = target.closest('[data-action="view-project"]') as HTMLElement;
      if (viewBtn) {
        e.preventDefault();
        const projectId = viewBtn.dataset.projectId;
        if (projectId) {
          this.handleProjectClick(projectId, false);
        }
        return;
      }

      const investBtn = target.closest('[data-action="invest-project"]') as HTMLElement;
      if (investBtn) {
        e.preventDefault();
        const projectId = investBtn.dataset.projectId;
        if (projectId) {
          this.handleProjectClick(projectId, true);
        }
        return;
      }

      // Card click opens project details modal directly
      const projectCard = target.closest('.project-card') as HTMLElement;
      if (projectCard && !target.closest('button') && !target.closest('a')) {
        const projectId = projectCard.dataset.projectId;
        if (projectId) {
          this.handleProjectClick(projectId, false);
        }
        return;
      }

      const viewAllLink = target.closest('#btn-view-all-projects') as HTMLElement;
      if (viewAllLink) {
        e.preventDefault();
        this.toggleShowAllProjects();
        return;
      }

      const expandBtn = target.closest('#btn-expand-projects') as HTMLElement;
      if (expandBtn) {
        e.preventDefault();
        this.toggleShowAllProjects();
        return;
      }
    });
  }

  public handleProjectClick(projectId: string, directInvest: boolean = false): void {
    if (!authManager.isAuthenticated()) {
      authManager.setPendingProject(projectId);
      this.openAuthModal(projectId, directInvest);
    } else {
      this.openProjectDetailsModal(projectId, directInvest);
    }
  }

  public openAuthModal(projectId?: string, directInvest: boolean = false): void {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    const contextBanner = document.getElementById('auth-modal-project-context');
    if (contextBanner) {
      if (projectId) {
        const project = this.allProjects.find(p => p.id === projectId);
        if (project) {
          contextBanner.style.display = 'flex';
          contextBanner.innerHTML = `
            <div class="context-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="context-text">
              <strong>Investor Access Required</strong>
              <span>Log in to review verified financial audit & profit-sharing terms for <em>"${project.name}"</em></span>
            </div>
          `;
        }
      } else {
        contextBanner.style.display = 'none';
      }
    }

    modal.classList.add('active');
    modal.setAttribute('data-direct-invest', directInvest ? 'true' : 'false');
    document.body.style.overflow = 'hidden';
  }

  public closeAuthModal(): void {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  public renderActiveProjects(): void {
    const container = document.getElementById('active-projects-grid');
    if (!container) return;

    let filtered = this.allProjects;
    if (this.currentFilter !== 'all') {
      const f = this.currentFilter.toLowerCase();
      if (f === 'short_term') {
        filtered = this.allProjects.filter(p => p.durationMonths <= 4);
      } else if (f === 'long_term') {
        filtered = this.allProjects.filter(p => p.durationMonths >= 5);
      } else if (f === 'handicrafts') {
        filtered = this.allProjects.filter(p => p.category.toLowerCase() === 'handicrafts');
      } else if (f === 'crops') {
        filtered = this.allProjects.filter(p => p.category.toLowerCase() === 'crops' || p.category.toLowerCase() === 'agriculture');
      } else if (f === 'livestock') {
        filtered = this.allProjects.filter(p => p.category.toLowerCase() === 'livestock');
      } else if (f === 'fisheries') {
        filtered = this.allProjects.filter(p => p.category.toLowerCase() === 'fisheries');
      } else if (f === 'agro') {
        filtered = this.allProjects.filter(p => 
          p.category.toLowerCase() === 'agro' ||
          (p.category.toLowerCase() !== 'handicrafts' &&
           p.category.toLowerCase() !== 'crops' &&
           p.category.toLowerCase() !== 'agriculture' &&
           p.category.toLowerCase() !== 'livestock' &&
           p.category.toLowerCase() !== 'fisheries')
        );
      } else {
        filtered = this.allProjects.filter(p => p.category.toLowerCase() === f);
      }
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.bengaliName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.shortStory && p.shortStory.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px; text-align: center; color: #5B6E66; grid-column: 1 / -1;">
          <p>No active projects found matching your criteria.</p>
        </div>
      `;
      const bottomCta = document.getElementById('projects-bottom-cta');
      if (bottomCta) bottomCta.style.display = 'none';
      return;
    }

    // By default, display all projects! Show top 4 only when explicitly toggled off
    const displayedProjects = this.showAllProjects ? filtered : filtered.slice(0, 4);

    container.innerHTML = displayedProjects.map(project => {
      const percent = Math.min(100, Math.round((project.fundingRaisedBDT / project.fundingGoalBDT) * 100));
      return `
        <article class="project-card" data-project-id="${project.id}">
          <!-- Top Image Header with Overlay matching media_1789573283421.png -->
          <div class="project-card-header">
            <img src="${project.image}" alt="${project.name}" class="project-card-image" loading="lazy" />
            <div class="project-header-overlay"></div>

            <!-- Top Badges: LIVE Status & Field Verified -->
            <div class="project-header-top-tags">
              <span class="project-live-chip">
                <span class="live-dot-pulse">●</span> LIVE
              </span>
              <span class="project-verified-chip" title="100% In-Person Verified">
                ✓ Verified
              </span>
            </div>

            <!-- Title & Price Overlay at Bottom of Image matching media_1789573283421.png -->
            <div class="project-header-bottom-info">
              <div class="header-info-left">
                <h3 class="project-title-overlay">${project.name}</h3>
                <div class="project-loc-overlay">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${project.location}
                </div>
              </div>
              <div class="header-price-right">
                <div class="unit-price-overlay">৳ ${project.minInvestmentBDT.toLocaleString()} BDT</div>
                <div class="unit-label-overlay">BDT/unit</div>
              </div>
            </div>
          </div>

          <!-- Eye-Soothing Card Body matching media_1789573283421.png -->
          <div class="project-card-body">
            <!-- Top Right Pastel Pill Badge -->
            <div class="project-tag-row">
              <span class="variable-return-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M7 20h10M12 20V10M12 10a5 5 0 0 1 5-5c0 4-3 5-5 5zM12 14a5 5 0 0 0-5-5c0 4 3 5 5 5z"/></svg>
                ${project.returnTypeTag || 'Variable Return'}
              </span>
            </div>

            <!-- Clean Key-Value Metrics List matching Image 2 -->
            <div class="soothing-metrics-list">
              <div class="metric-line">
                <span class="metric-key">Period</span>
                <strong class="metric-val">${project.periodText || (project.durationMonths + ' Months')}</strong>
              </div>
              <div class="metric-line">
                <span class="metric-key">Return</span>
                <strong class="metric-val return-val">${project.potentialReturn}</strong>
              </div>
              <div class="metric-line total-return-line">
                <span class="metric-key">Total return</span>
                <strong class="metric-val total-val">${project.totalReturnBDT || ('৳ ' + (project.minInvestmentBDT * 1.15).toLocaleString() + ' – ৳ ' + (project.minInvestmentBDT * 1.18).toLocaleString())}</strong>
              </div>
            </div>

            <!-- Progress & Micro-Stats matching media_1789573484322.png -->
            <div class="project-progress-container">
              <div class="progress-labels-row">
                <span class="percent-bold">${percent}% Funded</span>
                <span class="days-left">${project.duration}</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${percent}%;"></div>
              </div>
              <div class="goal-micro-stat">Raised: ৳${project.fundingRaisedBDT.toLocaleString()} of ৳${project.fundingGoalBDT.toLocaleString()} (DEMO)</div>
            </div>

            <!-- Card Action Buttons matching media_1789573484322.png -->
            <div class="project-card-btn-group">
              <button class="btn btn-invest-card" data-action="invest-project" data-project-id="${project.id}">
                Invest Now
              </button>
              <button class="btn btn-view-terms" data-action="view-project" data-project-id="${project.id}">
                View Terms
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Update Header View All link text
    const headerViewAll = document.getElementById('btn-view-all-projects');
    if (headerViewAll) {
      if (this.showAllProjects) {
        headerViewAll.innerHTML = `
          <span>Show Top 4</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        `;
      } else {
        headerViewAll.innerHTML = `
          <span>View All (${filtered.length})</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      }
    }

    // Update Bottom Expand Button
    const bottomCta = document.getElementById('projects-bottom-cta');
    const bottomText = document.getElementById('btn-expand-projects-text');
    const bottomIcon = document.getElementById('btn-expand-projects-icon');
    if (bottomCta && bottomText && bottomIcon) {
      if (filtered.length <= 4) {
        bottomCta.style.display = 'none';
      } else {
        bottomCta.style.display = 'flex';
        if (this.showAllProjects) {
          bottomText.textContent = `Showing all ${filtered.length} active projects (Click to show Top 4)`;
          bottomIcon.innerHTML = `<polyline points="18 15 12 9 6 15"></polyline>`;
        } else {
          bottomText.textContent = `View All Projects (${filtered.length}টি প্রকল্প দেখুন)`;
          bottomIcon.innerHTML = `<polyline points="6 9 12 15 18 9"></polyline>`;
        }
      }
    }
  }

  public renderFeaturedProject(): void {
    const container = document.getElementById('featured-project-container');
    if (!container) return;

    const p = FEATURED_PROJECT;
    const percent = Math.min(100, Math.round((p.fundingRaisedBDT / p.fundingGoalBDT) * 100));

    container.innerHTML = `
      <div class="featured-project-card">
        <div class="featured-project-media">
          <img src="${p.image}" alt="${p.name}" class="featured-img" loading="lazy" />
          <span class="featured-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:inline-block; vertical-align:middle; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${p.badge}
          </span>
        </div>

        <div class="featured-project-content">
          <div class="featured-header">
            <div class="location-tag">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${p.location}</span>
            </div>
            <div class="verified-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>100% In-Person Verified</span>
            </div>
          </div>

          <h3 class="featured-title">${p.name}</h3>
          <p class="featured-bengali">${p.bengaliName}</p>
          <p class="featured-story">${p.shortStory}</p>

          <div class="featured-producer">
            <strong>Led by:</strong> ${p.producerName} (${p.cooperativeInfo})
          </div>

          <div class="featured-progress-block">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="progress-stats">
              <span><strong>৳${p.fundingRaisedBDT.toLocaleString()}</strong> raised of ৳${p.fundingGoalBDT.toLocaleString()}</span>
              <span class="percent-tag">${percent}% Funded</span>
            </div>
          </div>

          <div class="featured-metrics-row">
            <div class="f-metric">
              <span class="label">Potential Return (Est.)</span>
              <span class="val return-text">${p.potentialReturn}</span>
            </div>
            <div class="f-metric">
              <span class="label">Duration</span>
              <span class="val">${p.duration}</span>
            </div>
            <div class="f-metric">
              <span class="label">Risk Level</span>
              <span class="val">${p.riskLevel}</span>
            </div>
            <div class="f-metric">
              <span class="label">Min. Ticket</span>
              <span class="val">৳${p.minInvestmentBDT.toLocaleString()}</span>
            </div>
          </div>

          <div class="featured-actions">
            <button class="btn btn-primary btn-lg" data-action="view-project" data-project-id="${p.id}">
              <span>View Full Project Terms</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <span class="investor-note" style="display:inline-flex; align-items:center; gap:5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Full verification audit & financials require Investor login</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  public openProjectDetailsModal(projectId: string, directInvestFocus: boolean = false): void {
    const modal = document.getElementById('project-detail-modal');
    if (!modal) return;

    const project = this.allProjects.find(p => p.id === projectId);
    if (!project) return;

    const modalBody = document.getElementById('project-detail-modal-body');
    if (!modalBody) return;

    const percent = Math.min(100, Math.round((project.fundingRaisedBDT / project.fundingGoalBDT) * 100));
    const estReturnPct = (project.returnRangePercent[0] + project.returnRangePercent[1]) / 2;
    const estProfitPerUnit = Math.round((project.minInvestmentBDT * estReturnPct) / 100);
    const totalProjectedPerUnit = project.minInvestmentBDT + estProfitPerUnit;

    modalBody.innerHTML = `
      <!-- 1. Top Navbar matching media_1789675641330.png -->
      <nav class="ss-navbar">
        <div class="ss-nav-left">
          <a href="#" class="ss-brand" id="ss-brand-home">
            <svg class="ss-brand-icon" viewBox="0 0 24 24" fill="none" style="width:24px;height:24px;">
              <path d="M21 3C13.5 3.5 6 9 4 17.5C3.5 19.5 4.5 21 6.5 21.5C8 22 10 21.5 12 20C17.5 16 20.5 10 21 3Z" fill="#10B981"/>
              <path d="M8.5 17C12 13.5 15.5 10 19 5.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <span>GramBandhan</span>
          </a>

          <div class="ss-nav-links">
            <span class="ss-nav-link" data-nav-cat="crops">Farming</span>
            <span class="ss-nav-link ${project.category.toLowerCase() === 'fisheries' ? 'active' : ''}" data-nav-cat="fisheries">Fisheries</span>
            <span class="ss-nav-link" data-nav-cat="livestock">Poultry</span>
            <span class="ss-nav-link" data-nav-cat="handicrafts">Artisans</span>
            <span class="ss-nav-link" data-nav-cat="handicrafts">Handicrafts</span>
            <span class="ss-nav-link" data-nav-cat="short_term">Short-Term</span>
            <span class="ss-nav-link" data-nav-cat="long_term">Long-Term</span>
          </div>
        </div>

        <div class="ss-nav-right">
          <div class="ss-nav-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search in collective..." />
          </div>

          <button class="ss-nav-bell" title="Notifications" style="display:inline-flex; align-items:center; justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>

          <button class="ss-btn-top-invest" id="ss-btn-nav-invest">
            Invest Now
          </button>

          <button class="ss-btn-close-modal" id="close-project-detail-btn" title="Return to Projects">
            ✕ Back to Projects
          </button>
        </div>
      </nav>

      <!-- 2. Hero Section (#06281E Deep Dark Green) matching media_1789675641330.png -->
      <section class="ss-hero-section">
        <div class="ss-hero-left">
          <h1 class="ss-hero-title">${project.name}</h1>

          <div class="ss-hero-funding-card" id="ss-hero-card">
            <div class="ss-card-metrics-row">
              <div>
                <div class="ss-metric-sublabel">PRICE PER SHARE:</div>
                <div class="ss-price-val">৳ ${project.minInvestmentBDT.toLocaleString()} BDT</div>
              </div>
              <div>
                <div class="ss-metric-sublabel">COMMITTED FUNDS:</div>
                <div class="ss-committed-val">${percent}% Funded</div>
              </div>
            </div>

            <div class="ss-hero-progress">
              <div class="ss-hero-progress-bar" style="width: ${percent}%;"></div>
            </div>

            <div class="ss-hero-actions-row">
              <button class="btn-secure-shares" id="btn-hero-secure-shares">
                Secure Shares
              </button>
              <button class="btn-share-icon" id="btn-hero-share" title="Share Project Details">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="ss-hero-image-wrap">
          <img src="${project.image}" alt="${project.name}" class="ss-hero-img" />
        </div>
      </section>

      <!-- 3. 4-Card Metric Strip (#EBF3EE Cream/Mint) matching media_1789675641330.png -->
      <div class="ss-metric-strip">
        <div class="ss-strip-box">
          <div class="ss-strip-lbl">EST. RETURN</div>
          <div class="ss-strip-val" style="color: #064E3B;">${project.potentialReturn}</div>
        </div>
        <div class="ss-strip-box">
          <div class="ss-strip-lbl">DURATION</div>
          <div class="ss-strip-val">${project.periodText || (project.durationMonths + ' Months')}</div>
        </div>
        <div class="ss-strip-box">
          <div class="ss-strip-lbl">UNIT PRICE</div>
          <div class="ss-strip-val">৳ ${project.minInvestmentBDT.toLocaleString()} BDT</div>
        </div>
        <div class="ss-strip-box">
          <div class="ss-strip-lbl">LOCATION</div>
          <div class="ss-strip-val">${project.district || project.location}</div>
        </div>
      </div>

      <!-- 4. Project Details Section (#E1EEF7 Light Ice-Blue) matching media_1789675641330.png -->
      <section class="ss-details-section">
        <div class="ss-details-left">
          <h3>Project Details</h3>
          <p class="ss-details-p">
            ${project.fullDescription || project.shortStory}
          </p>
          <p class="ss-details-p">
            The cultivation and production cycle spans from initial seed preparation and nursery management in early spring to peak harvest in summer. By investing, you provide critical working capital for advanced solar-powered aeration/cooling, bio-organic fertilizers formulated for regional soils, and digital monitoring systems that reduce post-harvest losses by 18%.
          </p>
          <p class="ss-details-p">
            Your investment directly impacts the food security of rural communities while offering a transparent, asset-backed financial return based on the realized wholesale market value of the harvested produce under Shariah-compliant profit-sharing.
          </p>

          <div class="ss-funding-progress-block">
            <h4>Funding Progress</h4>
            <div style="font-size: 0.85rem; color: #475569; font-weight: 600;">
              ৳ ${project.fundingRaisedBDT.toLocaleString()} of ৳ ${project.fundingGoalBDT.toLocaleString()} Raised
            </div>
            <div class="ss-fp-bar-wrap">
              <div class="ss-fp-track">
                <div class="ss-fp-fill" style="width: ${percent}%;"></div>
              </div>
              <span class="ss-fp-percent">${percent}%</span>
            </div>
          </div>
        </div>

        <div class="ss-details-right" id="ss-profit-section">
          <!-- Approximate Profit Statement Card -->
          <div class="ss-profit-card" id="ss-profit-card">
            <h4>Approximate Profit Statement</h4>

            <div class="ss-stmt-line">
              <span>Share Return:</span>
              <strong id="ss-share-return-val">৳ ${estProfitPerUnit.toLocaleString()} BDT</strong>
            </div>
            <div class="ss-stmt-line">
              <span>Investment Period:</span>
              <strong>${project.durationMonths * 30} Days</strong>
            </div>

            <div class="ss-projected-green-box">
              <span>Total Projected Return:</span>
              <span id="ss-projected-return-val">৳ ${totalProjectedPerUnit.toLocaleString()} BDT</span>
            </div>

            <div class="ss-units-stepper-wrap">
              <span class="ss-units-lbl">SELECT INVESTMENT UNITS</span>
              <div class="ss-stepper-box">
                <button class="ss-step-btn" id="btn-step-minus" type="button">−</button>
                <span class="ss-step-val" id="ss-unit-display">1 Unit (৳ ${project.minInvestmentBDT.toLocaleString()} BDT)</span>
                <button class="ss-step-btn" id="btn-step-plus" type="button">+</button>
              </div>
            </div>

            <button class="btn-invest-full-now" id="btn-ss-invest-confirm">
              Invest Now
            </button>

            <div class="ss-fees-note">
              NO HIDDEN FEES • ASSET BACKED
            </div>

            <div id="ss-invest-success-box" style="display: none; margin-top: 14px; background: #DCFCE7; border: 1px solid #10B981; border-radius: 8px; padding: 12px; font-size: 0.825rem; color: #064E3B; text-align: center;">
              <strong>✓ Investment Confirmed (Demo)!</strong>
              <p style="margin-top: 4px; font-size: 0.775rem;">Your capital commitment has been successfully registered. You can track field progress in your Investor Dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Risk Management Section (White) matching media_1789675641330.png -->
      <section class="ss-risk-section">
        <h3>Risk Management</h3>
        <p class="ss-section-subtitle">Transparent identification of challenges and our structured responses.</p>

        <div class="ss-risk-cards-grid">
          <!-- Card 1: Price Volatility -->
          <div class="ss-risk-card">
            <div class="ss-risk-icon-wrap">%</div>
            <h4>Price Volatility</h4>
            <p class="ss-risk-desc">
              Fluctuations in local agricultural market prices can impact short-term revenue projections for farm harvests.
            </p>
            <div class="ss-mitigation-box">
              <strong>Mitigation:</strong> Advance contracting with institutional distributors and cold-storage partners to lock in wholesale prices before harvest.
            </div>
          </div>

          <!-- Card 2: Climate Resilience -->
          <div class="ss-risk-card">
            <div class="ss-risk-icon-wrap green" style="display:flex; align-items:center; justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10M12 20V10M12 10a5 5 0 0 1 5-5c0 4-3 5-5 5zM12 14a5 5 0 0 0-5-5c0 4 3 5 5 5z"/></svg>
            </div>
            <h4>Climate Resilience</h4>
            <p class="ss-risk-desc">
              Vulnerability to seasonal weather extremes and sudden temperature/salinity changes in the cultivation belt.
            </p>
            <div class="ss-mitigation-box">
              <strong>Mitigation:</strong> Implementation of advanced water monitoring systems, climate-resilient certified seeds, and sea-wall reinforced bunds.
            </div>
          </div>

          <!-- Card 3: Operational Oversight -->
          <div class="ss-risk-card">
            <div class="ss-risk-icon-wrap blue" style="display:flex; align-items:center; justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <h4>Operational Oversight</h4>
            <p class="ss-risk-desc">
              Managing remote agricultural sites requires rigorous logistical and biological quality control to ensure high survival rates.
            </p>
            <div class="ss-mitigation-box">
              <strong>Mitigation:</strong> Daily digitization of logs by field-site managers and bi-weekly audits by independent university agronomists.
            </div>
          </div>
        </div>
      </section>

      <!-- 6. Frequently Asked Questions Section (#06281E Deep Dark Green) matching media_1789675641330.png -->
      <section class="ss-faq-section">
        <h3>Frequently Asked Questions</h3>

        <div class="ss-faq-accordion">
          <!-- FAQ 1 -->
          <div class="ss-faq-item">
            <div class="ss-faq-question" data-faq-index="1">
              <span>How is the profit calculated?</span>
              <span class="faq-chevron">▾</span>
            </div>
            <div class="ss-faq-answer" id="faq-ans-1">
              Profit is calculated based on the net market price of actual harvested produce after deducting operational costs like certified seeds, organic fertilizers, and field labor. Returns are distributed to ethical investors based on their agreed Shariah profit-sharing contract ratio.
            </div>
          </div>

          <!-- FAQ 2 -->
          <div class="ss-faq-item">
            <div class="ss-faq-question" data-faq-index="2">
              <span>What happens if the production is affected?</span>
              <span class="faq-chevron">▾</span>
            </div>
            <div class="ss-faq-answer" id="faq-ans-2" style="display: none;">
              The project is structured with comprehensive risk mitigation, including insurance against extreme climatic events, decentralized emergency cold-storage, and diversified plots to protect capital for our ethical investors under Halal principles.
            </div>
          </div>

          <!-- FAQ 3 -->
          <div class="ss-faq-item">
            <div class="ss-faq-question" data-faq-index="3">
              <span>When do I receive my return?</span>
              <span class="faq-chevron">▾</span>
            </div>
            <div class="ss-faq-answer" id="faq-ans-3" style="display: none;">
              Returns are credited directly to your registered bank account or verified MFS wallet (bKash/Nagad) once the harvest and wholesale sale are completed, within approximately 15 days following the project tenure completion date.
            </div>
          </div>
        </div>
      </section>

      <!-- 7. Connect with the Collective (White) matching media_1789675641330.png -->
      <section class="ss-connect-section">
        <div class="ss-connect-left">
          <h3>Connect with the Collective</h3>
          <p>Have questions about this project or the investment process? Our field team is here to provide clarity and complete transparency.</p>

          <div class="ss-connect-item">
            <span>✉️</span>
            <span>invest@grambandhan.com</span>
          </div>
          <div class="ss-connect-item">
            <span>📍</span>
            <span>${project.district || project.location}, Bangladesh</span>
          </div>
        </div>

        <div class="ss-connect-right">
          <form class="ss-connect-form" id="ss-contact-form">
            <div class="ss-form-2col">
              <div class="ss-fg">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" required />
              </div>
              <div class="ss-fg">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" required />
              </div>
            </div>

            <div class="ss-fg">
              <label>Subject</label>
              <select>
                <option value="inquiry">Investment Inquiry</option>
                <option value="field-visit">Field Visit Request</option>
                <option value="shariah">Shariah Contract Terms</option>
              </select>
            </div>

            <div class="ss-fg">
              <label>Your Message</label>
              <textarea rows="3" placeholder="How can we help you?" required></textarea>
            </div>

            <button type="submit" class="btn-send-message" id="btn-send-collective-msg">
              SEND MESSAGE
            </button>
            <div id="ss-msg-success" style="display:none; color: #166534; font-size: 0.8rem; margin-top: 10px; text-align: center; font-weight: 700;">
              ✓ Your message has been sent to the cooperative team. We will respond within 24 hours.
            </div>
          </form>
        </div>
      </section>

      <!-- 8. Footer (#02221A) -->
      <footer class="ss-footer">
        <div>
          <strong>GramBandhan</strong> • Empowering rural Bangladesh through transparent, interest-free Shariah investment.
        </div>
        <div>
          Risk Disclosure • Annual Reports • Shariah Board Certified No: GB/SB/2026/08
        </div>
      </footer>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Interactive Stepper Logic
    let currentUnits = 1;
    const updateStepper = () => {
      const unitDisplay = document.getElementById('ss-unit-display');
      const projectedReturnEl = document.getElementById('ss-projected-return-val');
      const shareReturnEl = document.getElementById('ss-share-return-val');
      const totalInvestment = currentUnits * project.minInvestmentBDT;
      const totalProfit = Math.round(totalInvestment * (estReturnPct / 100));
      const totalProjected = totalInvestment + totalProfit;

      if (unitDisplay) {
        unitDisplay.textContent = `${currentUnits} Unit${currentUnits > 1 ? 's' : ''} (৳ ${totalInvestment.toLocaleString()} BDT)`;
      }
      if (projectedReturnEl) {
        projectedReturnEl.textContent = `৳ ${totalProjected.toLocaleString()} BDT`;
      }
      if (shareReturnEl) {
        shareReturnEl.textContent = `৳ ${totalProfit.toLocaleString()} BDT`;
      }
    };

    document.getElementById('btn-step-minus')?.addEventListener('click', () => {
      if (currentUnits > 1) {
        currentUnits--;
        updateStepper();
      }
    });

    document.getElementById('btn-step-plus')?.addEventListener('click', () => {
      currentUnits++;
      updateStepper();
    });

    // Close button
    document.getElementById('close-project-detail-btn')?.addEventListener('click', () => {
      this.closeProjectDetailsModal();
    });

    // Scroll to investment card
    const scrollToInvestment = () => {
      const profitSection = document.getElementById('ss-profit-section');
      profitSection?.scrollIntoView({ behavior: 'smooth' });
    };
    document.getElementById('btn-hero-secure-shares')?.addEventListener('click', scrollToInvestment);
    document.getElementById('ss-btn-nav-invest')?.addEventListener('click', scrollToInvestment);

    if (directInvestFocus) {
      setTimeout(() => {
        scrollToInvestment();
      }, 100);
    }

    // Share button
    document.getElementById('btn-hero-share')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.href);
      alert(`Project link for "${project.name}" copied to clipboard!`);
    });

    // Confirm Investment
    const confirmBtn = document.getElementById('btn-ss-invest-confirm');
    confirmBtn?.addEventListener('click', () => {
      // Ensure user has authenticated investor session so payment gateway opens immediately
      if (!authManager.isAuthenticated()) {
        authManager.loginWithCredentials('investor@grambandhan.com', 'investor123');
      } else if (!authManager.hasRole('investor')) {
        authManager.addRole('investor');
      }

      // Trigger Payment Gateway Modal with bKash, Nagad, Bank Transfer options
      const openPayEvt = new CustomEvent('grambandhan:open-invest-payment', {
        detail: {
          projectId: project.id,
          units: currentUnits
        }
      });
      window.dispatchEvent(openPayEvt);
    });

    // FAQ Accordion toggles
    document.querySelectorAll('.ss-faq-question').forEach(q => {
      q.addEventListener('click', (e) => {
        const index = (e.currentTarget as HTMLElement).getAttribute('data-faq-index');
        const ans = document.getElementById(`faq-ans-${index}`);
        if (ans) {
          const isVisible = ans.style.display !== 'none';
          ans.style.display = isVisible ? 'none' : 'block';
        }
      });
    });

    // Contact form submit
    const contactForm = document.getElementById('ss-contact-form') as HTMLFormElement;
    const msgSuccess = document.getElementById('ss-msg-success');
    contactForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (msgSuccess) {
        msgSuccess.style.display = 'block';
        contactForm.reset();
      }
    });

    // Nav category links in screenshot topbar
    document.querySelectorAll('.ss-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-nav-cat') as ProjectCategory;
        if (cat) {
          this.closeProjectDetailsModal();
          this.filterByCategory(cat);
          const projSec = document.getElementById('projects');
          projSec?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Brand link
    document.getElementById('ss-brand-home')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeProjectDetailsModal();
    });
  }

  public closeProjectDetailsModal(): void {
    const modal = document.getElementById('project-detail-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}
