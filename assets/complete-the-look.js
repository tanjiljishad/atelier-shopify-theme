/**
 * "Complete the look" bundle (spec §7): recomputes the combined price as
 * checkboxes toggle, then adds every checked item in a single /cart/add.js
 * request (Shopify's `items: []` batch form) rather than one round trip per
 * item — one cart recalculation, one `cart:updated` dispatch.
 */
import { formatMoney } from './commerce-utils.js';

export function initCompleteTheLook(root = document) {
  root.querySelectorAll('[data-complete-the-look]').forEach((bundle) => {
    const items = Array.from(bundle.querySelectorAll('.complete-the-look__item'));
    const totalTarget = bundle.querySelector('[data-complete-the-look-total]');
    const addButton = bundle.querySelector('[data-complete-the-look-add]');

    function updateTotal() {
      const cents = items.reduce((sum, item) => {
        const checkbox = item.querySelector('.checkbox-field__input');
        return checkbox && checkbox.checked ? sum + Number(item.dataset.price) : sum;
      }, 0);
      if (totalTarget) totalTarget.textContent = formatMoney(cents);
    }

    items.forEach((item) => {
      const checkbox = item.querySelector('.checkbox-field__input');
      checkbox?.addEventListener('change', updateTotal);
    });

    addButton?.addEventListener('click', async () => {
      const selected = items
        .map((item) => item.querySelector('.checkbox-field__input'))
        .filter((checkbox) => checkbox && checkbox.checked)
        .map((checkbox) => ({ id: Number(checkbox.value), quantity: 1 }));

      if (!selected.length) return;

      const label = addButton.querySelector('.btn__label');
      const originalLabel = label ? label.textContent : '';
      addButton.classList.add('is-loading');

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: selected }),
        });
        if (!response.ok) throw new Error('Bundle add to cart failed');

        const cart = await fetch('/cart.js').then((res) => res.json());
        addButton.classList.remove('is-loading');
        addButton.classList.add('is-added');
        if (label) label.textContent = addButton.dataset.addedLabel || originalLabel;

        document.dispatchEvent(
          new CustomEvent('cart:updated', { bubbles: true, detail: { itemCount: cart.item_count } })
        );

        window.setTimeout(() => {
          addButton.classList.remove('is-added');
          if (label) label.textContent = originalLabel;
        }, 800);
      } catch (error) {
        addButton.classList.remove('is-loading');
      }
    });

    updateTotal();
  });
}
