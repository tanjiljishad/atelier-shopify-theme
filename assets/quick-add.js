/**
 * <quick-add-button> — wraps a single button and, for single-variant products,
 * really does add to cart via Shopify's native AJAX Cart API (`/cart/add.js`,
 * `/cart.js`) — that endpoint is a platform feature available on every store
 * regardless of theme, so this doesn't need to wait on a cart *drawer* UI to
 * be genuinely functional. On success it dispatches `cart:updated`, which
 * assets/header.js has listened for since Milestone 3, so the header cart
 * count updates for real with zero changes on that side, and (Milestone 8+)
 * assets/cart-drawer.js opens the drawer itself if enabled.
 *
 * Also fires the global toast (spec §5.6: "Added — View cart") — a page-
 * level confirmation distinct from this button's own inline "Added ✓" label
 * swap below, which only confirms *this specific button* worked.
 */
import { showToast } from './toast.js';
class QuickAddButton extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('button');
    if (!this.button || !this.dataset.variantId) return;
    this.label = this.button.querySelector('.btn__label');
    this.button.addEventListener('click', () => this.add());
  }

  async add() {
    if (this.button.classList.contains('is-loading')) return;

    this.button.classList.add('is-loading');
    this.button.setAttribute('aria-disabled', 'true');

    try {
      const addResponse = await fetch(`${window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/'}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: this.dataset.variantId, quantity: 1 }] }),
      });

      if (!addResponse.ok) {
        const error = await addResponse.json().catch(() => null);
        throw new Error((error && error.description) || 'Quick add failed');
      }

      const cartResponse = await fetch(`${window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/'}cart.js`);
      const cart = await cartResponse.json();
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true, detail: { itemCount: cart.item_count } }));

      const i18n = window.Atelier.settings.i18n;
      showToast({
        message: i18n.cartToastAdded,
        actionText: i18n.cartToastViewCart,
        actionUrl: window.Atelier.settings.cartUrl,
      });

      this.showFeedback(this.dataset.addedLabel || 'Added');
    } catch (error) {
      this.showFeedback(this.dataset.errorLabel || 'Error', true);
    } finally {
      this.button.classList.remove('is-loading');
      this.button.removeAttribute('aria-disabled');
    }
  }

  showFeedback(text, isError = false) {
    if (!this.label) return;
    const original = this.label.textContent;
    this.label.textContent = text;
    this.button.classList.toggle('product-card__quick-add-button--error', isError);
    window.setTimeout(() => {
      this.label.textContent = original;
      this.button.classList.remove('product-card__quick-add-button--error');
    }, 2000);
  }
}

customElements.define('quick-add-button', QuickAddButton);
