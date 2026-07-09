/**
 * Sticky mobile ATC bar (spec §7 "Mobile"). Visibility is driven by an
 * IntersectionObserver on the real in-flow ATC button — appears once that
 * button scrolls above the viewport, hides again once it's back in view or
 * the visitor scrolls back up past it. Desktop hides this bar entirely via
 * CSS (the buy box itself is already sticky there), but the observer still
 * runs harmlessly since `hidden` never gets removed by CSS at that breakpoint.
 */
import { renderPriceHtml } from './commerce-utils.js';

export function initStickyAddToCart(root = document) {
  const bar = root.querySelector('[data-sticky-atc]');
  const realButton = root.querySelector('[data-product-atc]');
  if (!bar || !realButton) return;

  const priceTarget = bar.querySelector('[data-sticky-atc-price]');
  const barButton = bar.querySelector('[data-sticky-atc-button]');

  barButton?.addEventListener('click', () => realButton.click());

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        bar.hidden = !scrolledPast;
      },
      { threshold: 0 }
    );
    observer.observe(realButton);
  }

  const dataScript = document.querySelector('[data-variant-picker-json]');
  const i18n = dataScript ? JSON.parse(dataScript.textContent).i18n : null;

  document.addEventListener('variant:change', (event) => {
    const { variant } = event.detail;
    if (!variant || !priceTarget || !i18n) return;
    priceTarget.innerHTML = renderPriceHtml(variant, i18n, 'card');
  });
}
