import { HERO_SLIDES } from './data';

/**
 * GRAMBONDHON HERO CAROUSEL & 3D CONTROLLER
 * 
 * Rapid 2.4s slideshow of multiple authentic Bangladeshi farmers and women artisans,
 * with smooth crossfade and interactive 3D perspective response.
 */

export class HeroSectionController {
  private currentIndex = 0;
  private timer: number | null = null;
  // 2-second interval per photo as requested!
  private readonly intervalMs = 2000;

  private slidesContainer: HTMLElement | null = null;
  private dotsContainer: HTMLElement | null = null;

  constructor() {
    this.slidesContainer = document.getElementById('hero-slides-wrapper');
    this.dotsContainer = document.getElementById('hero-dots-wrapper');
  }

  public init(): void {
    if (!this.slidesContainer || !this.dotsContainer) return;

    this.renderSlides();
    this.renderDots();
    this.setupEventListeners();
    this.goToSlide(0);
    this.startAutoPlay();
  }

  private renderSlides(): void {
    if (!this.slidesContainer) return;

    this.slidesContainer.innerHTML = HERO_SLIDES.map((slide, index) => `
      <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}" style="background-image: url('${slide.image}')">
        <div class="hero-slide-overlay"></div>
      </div>
    `).join('');
  }

  private renderDots(): void {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = HERO_SLIDES.map((_, index) => `
      <button class="hero-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
    `).join('');
  }

  private setupEventListeners(): void {
    this.dotsContainer?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.hero-dot') as HTMLElement;
      if (target && target.dataset.index !== undefined) {
        const index = parseInt(target.dataset.index, 10);
        this.goToSlide(index);
        this.restartAutoPlay();
      }
    });

    // NOTE: Does NOT pause on mouseenter - keeps sliding continuously as requested!
  }

  public goToSlide(index: number): void {
    if (index < 0) index = HERO_SLIDES.length - 1;
    if (index >= HERO_SLIDES.length) index = 0;

    this.currentIndex = index;

    const slides = this.slidesContainer?.querySelectorAll('.hero-slide');
    slides?.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });

    const dots = this.dotsContainer?.querySelectorAll('.hero-dot');
    dots?.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
  }

  public next(): void {
    this.goToSlide(this.currentIndex + 1);
  }

  public prev(): void {
    this.goToSlide(this.currentIndex - 1);
  }

  private startAutoPlay(): void {
    if (this.timer) clearInterval(this.timer);
    // Slides continuously every 2 seconds without pause
    this.timer = window.setInterval(() => {
      this.next();
    }, this.intervalMs);
  }

  private restartAutoPlay(): void {
    this.startAutoPlay();
  }
}
