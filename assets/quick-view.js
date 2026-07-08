/**
 * Quick View — hooks only, per this milestone's explicit scope ("do not build
 * the modal yet"). Wires clicks on any [data-quick-view-trigger] to dispatch
 * a `quickview:open` event carrying the product's URL/handle; no listener
 * exists anywhere yet. A future milestone builds the modal and subscribes to
 * this same event — nothing here will need to change when it does.
 */
export function initQuickViewTriggers(root = document) {
  root.querySelectorAll('[data-quick-view-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      document.dispatchEvent(
        new CustomEvent('quickview:open', {
          bubbles: true,
          detail: {
            productUrl: trigger.dataset.quickViewTrigger,
            productHandle: trigger.dataset.productHandle,
          },
        })
      );
    });
  });
}
