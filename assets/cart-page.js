/**
 * Cart page interactivity — the full-page counterpart to assets/cart-drawer.js.
 * Both instantiate the same CartSurfaceController (assets/cart-utils.js) for
 * the actual mutation/AJAX logic; this file only wires page-specific event
 * delegation (no close button, no drawer to auto-open) and listens for cart
 * changes made elsewhere (e.g. the cross-sell grid's quick-add) so the
 * page's own item list/summary stays in sync without a reload.
 */
import { CartSurfaceController } from './cart-utils.js';

function initCartPage() {
  const inner = document.querySelector('[data-cart-page-inner]');
  const container = inner ? inner.parentElement : null;
  if (!inner || !container) return;

  const sectionId = inner.dataset.sectionId;
  const i18n = readI18n(inner);
  const controller = new CartSurfaceController({
    container,
    sectionId,
    innerSelector: '[data-cart-page-inner]',
    i18n,
  });

  controller.ensureDependencies();

  container.addEventListener('quantity-change', (event) => {
    const item = event.target.closest('[data-cart-line-item]');
    if (item) controller.changeQuantity(item.dataset.lineKey, event.detail.value);
  });

  container.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      const item = removeButton.closest('[data-cart-line-item]');
      if (item) controller.remove(item);
    }
  });

  container.addEventListener('change', (event) => {
    const noteField = event.target.closest('[name="note"]');
    if (noteField) controller.updateNote(noteField.value);
  });

  document.addEventListener('cart:updated', (event) => {
    if (event.detail && event.detail.source === sectionId) return;
    controller.refreshFromServer();
  });
}

function readI18n(container) {
  const script = container.querySelector('[data-cart-page-i18n]');
  return script ? JSON.parse(script.textContent) : { itemUpdated: '', itemRemoved: '' };
}

initCartPage();
