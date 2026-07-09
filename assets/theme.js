/**
 * Theme entry point. Loaded as `type="module"` (see layout/theme.liquid), so it
 * already runs after the DOM has parsed — no DOMContentLoaded wrapper needed.
 *
 * Exposes `window.Atelier` as the shared namespace future components hang off of
 * (e.g. `Atelier.motion`, `Atelier.storage` for the wishlist/compare/recently-viewed
 * work in a later milestone). Reads `window.Atelier.settings`, a small inline object
 * layout/theme.liquid writes out from the merchant's theme settings, since Liquid
 * values can't otherwise reach an external, cached .js asset.
 */
import { initScrollReveal, createFocusTrap, prefersReducedMotion } from './motion.js';
import { createLocalStorageAdapter } from './theme-storage.js';
// The header, its drawers, and predictive search render on every page (the
// header-group is part of layout/theme.liquid, not a per-template section),
// so these are imported eagerly rather than gated behind a DOM check like
// the optional primitives below — the check would always be true anyway.
import './drawer.js';
import './header.js';
import './mobile-nav.js';
import './predictive-search.js';
import './cart-drawer.js';

document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

const settings = window.Atelier && window.Atelier.settings ? window.Atelier.settings : {};

document.documentElement.classList.toggle('animations-enabled', Boolean(settings.animationsEnabled));
document.documentElement.classList.toggle('performance-mode', Boolean(settings.performanceMode));

const colorModeStorage = createLocalStorageAdapter('atelier:color-mode', null);

/**
 * Only meaningful when settings.colorSchemeMode === "user" — the other three modes
 * ("light" / "dark" / "system") are resolved entirely server-side + CSS media query
 * (see snippets/theme-tokens.liquid), so calling this in those modes still works but
 * has no visible effect since nothing reads the stored value on load.
 */
const colorMode = {
  get() {
    return document.documentElement.getAttribute('data-color-mode');
  },
  set(mode) {
    document.documentElement.setAttribute('data-color-mode', mode);
    colorModeStorage.set(mode);
  },
  toggle() {
    const next = colorMode.get() === 'dark' ? 'light' : 'dark';
    colorMode.set(next);
    return next;
  },
};

window.Atelier = Object.assign(window.Atelier || {}, {
  settings,
  motion: { initScrollReveal, createFocusTrap, prefersReducedMotion },
  storage: { createLocalStorageAdapter },
  colorMode,
});

initScrollReveal();

/**
 * Each of these is only fetched when its markup actually exists on the current
 * page — a product page with no accordions never pays for accordion.js. Custom
 * elements self-register on import, so no further wiring is needed here.
 */
if (document.querySelector('quantity-input')) import('./quantity-input.js');
if (document.querySelector('accordion-group')) import('./accordion.js');
if (document.querySelector('tab-group')) import('./tabs.js');
if (document.querySelector('.tooltip__trigger')) {
  import('./tooltip.js').then(({ initTooltips }) => initTooltips());
}
if (document.querySelector('announcement-bar')) import('./announcement-bar.js');
if (document.querySelector('quick-add-button')) import('./quick-add.js');
if (document.querySelector('[data-quick-view-trigger]')) {
  import('./quick-view.js').then(({ initQuickViewTriggers }) => initQuickViewTriggers());
}
if (document.querySelector('[data-wishlist-toggle]')) import('./wishlist.js');
if (document.querySelector('[data-compare-toggle]')) import('./compare.js');
if (document.querySelector('[data-hero-video]')) {
  import('./hero.js').then(({ initHeroVideoControls }) => initHeroVideoControls());
}
if (document.querySelector('[data-parallax]')) {
  import('./parallax.js').then(({ initParallax }) => initParallax());
}
if (document.querySelector('[data-slider-track]')) {
  import('./product-slider.js').then(({ initProductSliders }) => initProductSliders());
}
if (document.querySelector('testimonial-carousel')) import('./testimonials.js');
if (document.querySelector('[data-video-player]')) {
  import('./video-section.js').then(({ initVideoSections }) => initVideoSections());
}
if (document.querySelector('[data-collection-section]')) {
  import('./collection-filters.js').then(({ initCollectionFilters }) => initCollectionFilters());
}
if (document.querySelector('[data-grid-switcher]')) {
  import('./collection-grid.js').then(({ initCollectionGrid }) => initCollectionGrid());
}
if (document.querySelector('product-gallery')) import('./product-gallery.js');
if (document.querySelector('product-lightbox')) import('./product-lightbox.js');
if (document.querySelector('variant-picker')) import('./variant-picker.js');
if (document.querySelector('product-recommendations')) import('./product-recommendations.js');
if (document.querySelector('.buy-box__form')) {
  import('./product-form.js').then(({ initProductForms }) => initProductForms());
}
if (document.querySelector('[data-sticky-atc]')) {
  import('./sticky-add-to-cart.js').then(({ initStickyAddToCart }) => initStickyAddToCart());
}
if (document.querySelector('[data-complete-the-look]')) {
  import('./complete-the-look.js').then(({ initCompleteTheLook }) => initCompleteTheLook());
}
if (document.querySelector('[data-recently-viewed]')) {
  import('./recently-viewed.js').then(({ initRecentlyViewed }) => initRecentlyViewed());
}
if (document.querySelector('[data-share-button]')) {
  import('./share-button.js').then(({ initShareButtons }) => initShareButtons());
}
if (document.querySelector('[data-cart-page-inner]')) import('./cart-page.js');
