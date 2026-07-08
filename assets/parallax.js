/**
 * Parallax (spec §10: "banners only, ±40px range, transform-only, disabled
 * on mobile and reduced-motion"). Deliberately narrow — only image-banner
 * uses [data-parallax], matching spec's restriction rather than a general-
 * purpose scroll-effects library.
 */
import { prefersReducedMotion, performanceModeEnabled } from './motion.js';

const RANGE_PX = 40;
const DESKTOP_QUERY = '(min-width: 990px)';

export function initParallax(root = document) {
  if (prefersReducedMotion() || performanceModeEnabled()) return;
  if (!window.matchMedia(DESKTOP_QUERY).matches) return;

  const targets = Array.from(root.querySelectorAll('[data-parallax]'));
  if (!targets.length) return;

  let ticking = false;

  function update() {
    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const clamped = Math.min(Math.max(progress, 0), 1);
      const offset = (clamped - 0.5) * RANGE_PX * 2;
      el.style.transform = `translateY(${offset.toFixed(1)}px)`;
    });
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}
