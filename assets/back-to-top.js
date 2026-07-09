/**
 * Back to top (spec §5.5: appears after 2 viewport heights scrolled).
 * Scroll listener is rAF-throttled — same requestTick pattern
 * assets/header.js already uses for its own scroll handling, not a second
 * throttling implementation.
 */
export function initBackToTop(root = document) {
  const button = root.querySelector('[data-back-to-top]');
  if (!button) return;

  let ticking = false;

  function updateVisibility() {
    const threshold = window.innerHeight * 2;
    button.hidden = window.scrollY < threshold;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    },
    { passive: true }
  );

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.Atelier.motion.prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });

  updateVisibility();
}
