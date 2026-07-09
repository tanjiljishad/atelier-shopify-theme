/**
 * Cart drawer interactivity (spec §7). The shared mutation/AJAX machinery
 * (debounced quantity changes, serialized request queue, collapse-then-
 * remove, note updates, content swap) lives in CartSurfaceController
 * (assets/cart-utils.js) — the same controller assets/cart-page.js
 * instantiates against the full cart page, so that ~150 lines of "talk to
 * Shopify's cart API safely" exists exactly once. This file only adds what's
 * specific to being a *drawer*: the close button and auto-opening on a cart
 * change made elsewhere on the page.
 *
 * Every listener is delegated from `.drawer__panel` — which
 * sections/cart-drawer.liquid never replaces, only its
 * [data-cart-drawer-inner] child — rather than bound to specific
 * descendants. That's deliberate: a listener attached directly to a
 * swappable element goes dead the moment that element is replaced by fresh
 * server-rendered HTML (exactly the class of bug caught in Milestone 6's
 * sort-select follow-up); delegation from a stable ancestor keeps working
 * across every refresh with no manual re-binding.
 *
 * Not every cart mutation on the page goes through this drawer: the upsell
 * strip's <quick-add-button> (Milestone 4) does its own independent
 * /cart/add.js call, and so does the PDP buy box's add-to-cart (Milestone 7)
 * and complete-the-look's batch add — none of them know this drawer exists.
 * Rather than teach every one of those about the drawer, this listens for
 * the `cart:updated` event they already all dispatch: any occurrence not
 * tagged with this controller's own section id as its source means the
 * drawer's content is now stale, so it force-refreshes and, when the
 * drawer is enabled and this isn't the cart page itself (data-auto-open,
 * computed server-side in cart-drawer.liquid), opens it — the "cart drawer
 * slides open" ATC feedback flagged as a Milestone 7 follow-up.
 */
import { CartSurfaceController } from './cart-utils.js';

const SECTION_ID = 'cart-drawer';

function initCartDrawer() {
  const drawer = document.getElementById('CartDrawer');
  const panel = drawer ? drawer.querySelector('.drawer__panel') : null;
  if (!drawer || !panel) return;

  // The drawer is disabled by merchant choice — its markup still exists
  // (in case they switch back), but the header icon links straight to the
  // cart page and never opens it, so wiring interactivity/foreign-update
  // refreshing here would only ever refresh content nobody can see.
  if (drawer.dataset.cartType !== 'drawer') return;

  const i18n = readI18n(panel);
  const controller = new CartSurfaceController({
    container: panel,
    sectionId: SECTION_ID,
    innerSelector: '[data-cart-drawer-inner]',
    i18n,
  });

  controller.ensureDependencies();

  panel.addEventListener('quantity-change', (event) => {
    const item = event.target.closest('[data-cart-line-item]');
    if (item) controller.changeQuantity(item.dataset.lineKey, event.detail.value);
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-drawer-close]')) {
      drawer.close();
      return;
    }
    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      const item = removeButton.closest('[data-cart-line-item]');
      if (item) controller.remove(item);
    }
  });

  panel.addEventListener('change', (event) => {
    const noteField = event.target.closest('[name="note"]');
    if (noteField) controller.updateNote(noteField.value);
  });

  document.addEventListener('cart:updated', (event) => {
    if (event.detail && event.detail.source === SECTION_ID) return;
    controller.refreshFromServer().then(() => {
      if (drawer.hasAttribute('data-auto-open')) drawer.open();
    });
  });
}

function readI18n(panel) {
  const script = panel.querySelector('[data-cart-drawer-i18n]');
  return script ? JSON.parse(script.textContent) : { itemUpdated: '', itemRemoved: '' };
}

initCartDrawer();
