/**
 * Back to top (spec §5.5: appears after 2 viewport heights scrolled).
 * Scroll listener is rAF-throttled via motion.js's shared rafThrottle, not a
 * hand-rolled one.
 */
import { rafThrottle } from './motion.js';

export function initBackToTop(root = document) {
  const button = root.querySelector('[data-back-to-top]');
  if (!button) return;

  function updateVisibility() {
    const threshold = window.innerHeight * 2;
    button.hidden = window.scrollY < threshold;
  }

  window.addEventListener('scroll', rafThrottle(updateVisibility), { passive: true });

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.Atelier.motion.prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });

  updateVisibility();
}
