/**
 * Buy box add-to-cart (spec §7 "ATC feedback": button morphs to spinner →
 * "Added ✓" (800ms) → cart drawer slides open. Never navigate away.).
 *
 * A click listener on the ATC button specifically — not a `submit` listener
 * on the form — is deliberate: Shopify's own `payment_button` filter (Shop
 * Pay / PayPal express checkout, rendered in buy-box.liquid) injects its own
 * buttons into this same <form> that must submit it for real to reach
 * checkout. Capturing the form's submit event would risk swallowing those;
 * only ever intercepting this one button's click leaves them untouched.
 *
 * Cart drawer is out of scope for this milestone (explicitly excluded), so
 * "cart drawer slides open" isn't wired yet — this dispatches the same
 * `cart:updated` event the header's cart count already listens for (built in
 * Milestone 3) and stops at the button's own "Added ✓" feedback. Whichever
 * milestone builds the drawer only needs to add one more `cart:updated`
 * listener; nothing here changes.
 */
export function initProductForms(root = document) {
  root.querySelectorAll('.buy-box__form').forEach((form) => {
    const button = form.querySelector('[data-product-atc]');
    if (!button) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      if (button.getAttribute('aria-disabled') === 'true' || button.classList.contains('is-loading')) return;
      addToCart(form, button);
    });
  });
}

async function addToCart(form, button) {
  const variantIdInput = form.querySelector('[data-product-form-variant-id]');
  const quantityInput = form.querySelector('.quantity-input__value');
  const variantId = variantIdInput ? variantIdInput.value : '';
  const quantity = quantityInput ? Number.parseInt(quantityInput.value, 10) || 1 : 1;
  if (!variantId) return;

  const label = button.querySelector('.btn__label');
  const originalLabel = label ? label.textContent : '';

  button.classList.add('is-loading');

  try {
    const addResponse = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: variantId, quantity }),
    });
    if (!addResponse.ok) throw new Error('Add to cart request failed');

    const cart = await fetch('/cart.js').then((response) => response.json());

    button.classList.remove('is-loading');
    button.classList.add('is-added');
    if (label) label.textContent = button.dataset.addedLabel || originalLabel;

    document.dispatchEvent(
      new CustomEvent('cart:updated', { bubbles: true, detail: { itemCount: cart.item_count } })
    );

    window.setTimeout(() => {
      button.classList.remove('is-added');
      if (label) label.textContent = originalLabel;
    }, 800);
  } catch (error) {
    // Real fallback: submit the form for real (native, full-page checkout
    // round trip) — same "AJAX enhances, real submission always works"
    // philosophy as collection-filters.js's network-failure path.
    button.classList.remove('is-loading');
    form.submit();
  }
}
