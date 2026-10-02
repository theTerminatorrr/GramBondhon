/**
 * SDG Impact Alignment — Interactive Controller
 * Handles:
 *  - Mobile tap-to-flip (toggle .flipped class)
 *  - Keyboard accessibility (Enter/Space flips card)
 *  - Intersection Observer counter animation for stats row
 */

export function initSDGImpact(): void {
  initFlipCards();
  initCounters();
}

/* ─── Flip Card Logic ────────────────────────────────────────────────────── */
function initFlipCards(): void {
  const cards = document.querySelectorAll<HTMLElement>('.sdg-card');
  if (!cards.length) return;

  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  cards.forEach((card) => {
    if (isTouchDevice) {
      // On touch devices: tap to flip, tap again to unflip
      card.addEventListener('click', () => {
        // Unflip any other open card first
        cards.forEach((c) => {
          if (c !== card) c.classList.remove('flipped');
        });
        card.classList.toggle('flipped');
      });

      // Close on outside tap
      document.addEventListener('click', (e) => {
        if (!card.contains(e.target as Node)) {
          card.classList.remove('flipped');
        }
      });
    }

    // Keyboard accessibility (Enter / Space)
    card.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cards.forEach((c) => {
          if (c !== card) c.classList.remove('flipped');
        });
        card.classList.toggle('flipped');
      }
      if (e.key === 'Escape') {
        card.classList.remove('flipped');
      }
    });
  });
}

/* ─── Counter Animation ──────────────────────────────────────────────────── */
function initCounters(): void {
  const statsRow = document.querySelector<HTMLElement>('.sdg-stats-row');
  if (!statsRow) return;

  const counters = statsRow.querySelectorAll<HTMLElement>('.sdg-stat-number[data-target]');
  if (!counters.length) return;

  let animated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          counters.forEach(animateCounter);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );

  observer.observe(statsRow);
}

function animateCounter(el: HTMLElement): void {
  const target = parseInt(el.dataset.target ?? '0', 10);
  const countEl = el.querySelector<HTMLElement>('.sdg-stat-count');
  if (!countEl) return;

  // Capture as non-null so inner tick() closure can access it safely
  const counter: HTMLElement = countEl;
  const duration = 1800; // ms
  const startTime = performance.now();
  const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = Math.round(eased * target);

    // Format with thousands separator
    counter.textContent = current.toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      counter.textContent = target.toLocaleString('en-US');
    }
  }

  requestAnimationFrame(tick);
}
