/**
 * <site-header> — owns scroll behavior (sticky mode, subtle shrink, hide-on-
 * scroll-down/reveal-on-scroll-up, transparent-to-solid crossfade) and wires
 * up the pieces composed into it: desktop nav (mega-menu.js), action-count
 * bubbles, and the mobile drawer's dark-mode toggle. Drawers themselves
 * (mobile nav, search) own their own open/close via <theme-drawer> — this
 * only triggers them through the standard data-drawer-open contract already
 * built into snippets/header-action.liquid.
 */
import { initNavMenus } from './mega-menu.js';
import { createLocalStorageAdapter } from './theme-storage.js';

const SCROLL_HIDE_THRESHOLD = 150;
const SHRINK_THRESHOLD = 8;

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.stickyMode = this.dataset.sticky || 'always';
    this.lastScrollY = window.scrollY;
    this.ticking = false;

    if (this.stickyMode !== 'none') {
      window.addEventListener('scroll', () => this.requestTick(), { passive: true });
      this.updateScrollState();
    }

    initNavMenus(this);
    this.initActionCounts();
    this.initColorModeToggle();
  }

  requestTick() {
    if (this.ticking) return;
    this.ticking = true;
    window.requestAnimationFrame(() => {
      this.updateScrollState();
      this.ticking = false;
    });
  }

  updateScrollState() {
    const scrollY = window.scrollY;
    this.classList.toggle('is-scrolled', scrollY > SHRINK_THRESHOLD);

    if (this.stickyMode === 'on-scroll-up') {
      const scrollingDown = scrollY > this.lastScrollY;
      this.classList.toggle('is-hidden', scrollingDown && scrollY > SCROLL_HIDE_THRESHOLD);
    }

    this.lastScrollY = scrollY;
  }

  /**
   * Wishlist/compare counts sync from the storage adapter now (and stay in
   * sync via subscribe(), including cross-tab) even though nothing writes to
   * those keys yet. Cart count listens for a `cart:updated` event that no
   * milestone dispatches yet either — this is the AJAX-ready hook; a future
   * add-to-cart milestone only needs to dispatch that event, no header
   * changes required then.
   */
  initActionCounts() {
    this.syncCount('WishlistAction', createLocalStorageAdapter('atelier:wishlist', []));
    this.syncCount('CompareAction', createLocalStorageAdapter('atelier:compare', []));

    document.addEventListener('cart:updated', (event) => {
      this.updateActionCount('CartLink', event.detail && event.detail.itemCount ? event.detail.itemCount : 0);
    });
  }

  syncCount(actionId, storage) {
    const update = () => this.updateActionCount(actionId, storage.get().length);
    update();
    storage.subscribe(update);
  }

  updateActionCount(actionId, count) {
    const action = document.getElementById(actionId);
    if (!action) return;

    const bubble = action.querySelector('[data-header-action-count]');
    if (bubble) {
      bubble.textContent = String(count);
      bubble.classList.toggle('is-hidden', count === 0);
    }

    const baseLabel = action.dataset.label;
    if (baseLabel) {
      action.setAttribute('aria-label', count > 0 ? `${baseLabel} (${count})` : baseLabel);
    }
  }

  initColorModeToggle() {
    const toggle = document.getElementById('MobileColorModeToggle');
    if (!toggle) return;
    toggle.checked = document.documentElement.getAttribute('data-color-mode') === 'dark';
    toggle.addEventListener('change', () => {
      if (window.Atelier && window.Atelier.colorMode) window.Atelier.colorMode.toggle();
    });
  }
}

customElements.define('site-header', SiteHeader);
