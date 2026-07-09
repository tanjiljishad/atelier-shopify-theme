/**
 * Shared cart AJAX layer — both assets/cart-drawer.js and assets/cart-page.js
 * depend on this rather than each rolling their own fetch/parse logic, so
 * there's exactly one place that knows how to talk to Shopify's cart
 * endpoints.
 *
 * Uses the native `sections` parameter Shopify's cart endpoints
 * (/cart/add.js, /cart/change.js, /cart/update.js) all accept: one request
 * both performs the cart mutation *and* returns fresh server-rendered HTML
 * for whichever sections are named, so line-item markup, prices, and the
 * free-shipping bar are never re-implemented in JS — they're always the
 * same Liquid output the page loaded with, just re-fetched. This is the
 * same fetch-and-extract-by-section-id philosophy as predictive-search.js
 * and collection-filters.js, applied to Shopify's own cart API instead of
 * the generic Section Rendering endpoint.
 */

/**
 * @param {string} endpoint e.g. '/cart/change.js'
 * @param {object} body
 * @param {string[]} sectionIds section ids to render fresh HTML for
 * @param {AbortSignal} [signal] cancels a superseded request (e.g. rapid
 *   quantity-stepper clicks) so an earlier, slower response can't resolve
 *   after a later one and overwrite the drawer with stale content
 * @returns {Promise<{cart: object, sections: Record<string,string>}>}
 */
export async function postCart(endpoint, body, sectionIds = [], signal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...body, sections: sectionIds.join(',') }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error((error && error.description) || `Cart request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Extracts one section's rendered HTML (as returned in a cart response's
 * `sections` map) and returns the element matching `selector` within it —
 * mirrors collection-filters.js's `#shopify-section-X` extraction, just
 * starting from an HTML string already scoped to one section rather than a
 * full-page fetch response.
 *
 * @param {Record<string,string>} sections
 * @param {string} sectionId
 * @param {string} selector
 */
function extractFromSection(sections, sectionId, selector) {
  const html = sections[sectionId];
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector(selector);
}

/**
 * Writes to the global aria-live announcer in layout/theme.liquid
 * (#AtelierAnnouncer) — present on every page since Milestone 1 but unused
 * until now. Cleared first so the same message announced twice in a row
 * (e.g. two quick quantity clicks landing on the same total) still fires a
 * change event for assistive tech.
 *
 * @param {string} message
 */
function announce(message) {
  const region = document.getElementById('AtelierAnnouncer');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}

const QUANTITY_DEBOUNCE_MS = 400;

/**
 * The cart mutation logic every AJAX cart surface needs — debounced
 * per-line quantity changes, a serialized request queue, a collapse-then-
 * remove animation, note updates, and swapping in the fresh server-rendered
 * content a mutation's response carries. assets/cart-drawer.js and
 * assets/cart-page.js each instantiate one of these against their own
 * container/section id rather than re-implementing this ~150 lines of
 * "talk to Shopify's cart API safely" twice — the two surfaces only differ
 * in which extra UI they layer on top (a drawer close button + auto-open,
 * vs. none of that on the full page).
 *
 * Every mutation is chained onto one serialized queue rather than fired
 * independently: each response is a *full* fresh render of the surface, so
 * if two requests were ever in flight at once, whichever response landed
 * second would silently overwrite whatever the first had just applied, even
 * with per-request cancellation. Per-line debouncing coalesces a
 * long-press's rapid repeat into a single queued request per line.
 */
export class CartSurfaceController {
  /**
   * @param {object} options
   * @param {Element} options.container - stable ancestor to delegate events from
   * @param {string} options.sectionId - Shopify section id to request fresh HTML for
   * @param {string} options.innerSelector - selector (within the section) that gets swapped
   * @param {{itemUpdated: string, itemRemoved: string}} options.i18n
   * @param {(container: Element) => void} [options.onSwap] - called after every content swap
   */
  constructor({ container, sectionId, innerSelector, i18n, onSwap }) {
    this.container = container;
    this.sectionId = sectionId;
    this.innerSelector = innerSelector;
    this.i18n = i18n;
    this.onSwap = onSwap;
    this.debounceTimers = new Map();
    this.queue = Promise.resolve();
  }

  enqueue(task) {
    this.queue = this.queue.then(task, task);
    return this.queue;
  }

  setLoading(isLoading) {
    const inner = this.container.querySelector(this.innerSelector);
    if (inner) inner.classList.toggle('is-loading', isLoading);
  }

  ensureDependencies() {
    if (document.querySelector('quantity-input')) import('./quantity-input.js');
    if (document.querySelector('quick-add-button')) import('./quick-add.js');
  }

  changeQuantity(lineKey, quantity) {
    this.setLoading(true);
    window.clearTimeout(this.debounceTimers.get(lineKey));
    this.debounceTimers.set(
      lineKey,
      window.setTimeout(() => {
        this.debounceTimers.delete(lineKey);
        this.enqueue(() => this.applyChange(lineKey, quantity));
      }, QUANTITY_DEBOUNCE_MS)
    );
  }

  remove(item) {
    const lineKey = item.dataset.lineKey;
    window.clearTimeout(this.debounceTimers.get(lineKey));
    this.debounceTimers.delete(lineKey);
    this.setLoading(true);

    if (window.Atelier.motion.prefersReducedMotion() || typeof item.animate !== 'function') {
      this.enqueue(() => this.applyChange(lineKey, 0));
      return;
    }

    const startHeight = item.getBoundingClientRect().height;
    const animation = item.animate(
      [
        { height: `${startHeight}px`, opacity: 1, marginBottom: getComputedStyle(item).marginBottom },
        { height: '0px', opacity: 0, marginBottom: '0px' },
      ],
      { duration: 250, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }
    );
    animation.onfinish = () => this.enqueue(() => this.applyChange(lineKey, 0));
  }

  async applyChange(lineKey, quantity) {
    try {
      const response = await postCart('/cart/change.js', { id: lineKey, quantity }, [this.sectionId]);
      this.swap(response);
      announce(quantity === 0 ? this.i18n.itemRemoved : this.i18n.itemUpdated);
    } catch (error) {
      this.setLoading(false);
    }
  }

  updateNote(note) {
    return this.enqueue(async () => {
      try {
        const response = await postCart('/cart/update.js', { note }, [this.sectionId]);
        this.swap(response);
      } catch (error) {
        /* Note failed to save silently — not worth interrupting the visitor
           for a non-transactional field; it reverts to the last saved value
           next time this surface refreshes. */
      }
    });
  }

  swap(response) {
    const newInner = extractFromSection(response.sections, this.sectionId, this.innerSelector);
    const currentInner = this.container.querySelector(this.innerSelector);
    if (newInner && currentInner) currentInner.replaceWith(newInner);
    this.setLoading(false);
    this.ensureDependencies();
    if (this.onSwap) this.onSwap(this.container);

    document.dispatchEvent(
      new CustomEvent('cart:updated', {
        bubbles: true,
        detail: { itemCount: response.item_count, source: this.sectionId },
      })
    );
  }

  /**
   * Re-renders from a plain GET (no mutation to perform) — used when this
   * surface's content went stale because of a cart change made somewhere
   * else entirely (a PDP add-to-cart, a product-card quick-add, ...).
   */
  refreshFromServer() {
    return this.enqueue(async () => {
      this.setLoading(true);
      try {
        const response = await fetch(`${window.location.pathname}?section_id=${this.sectionId}`);
        if (!response.ok) throw new Error('Cart surface refresh failed');
        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const newInner = doc.querySelector(this.innerSelector);
        const currentInner = this.container.querySelector(this.innerSelector);
        if (newInner && currentInner) currentInner.replaceWith(newInner);
        this.ensureDependencies();
        if (this.onSwap) this.onSwap(this.container);
      } finally {
        this.setLoading(false);
      }
    });
  }
}
