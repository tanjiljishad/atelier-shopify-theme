/**
 * Shared logic behind both wishlist and compare buttons — adding/removing a
 * product id from a storage-adapter-backed list, reflecting pressed state,
 * and announcing changes. assets/wishlist.js and assets/compare.js are each
 * a 3-line call into this with a different storage key, rather than two
 * near-identical files.
 *
 * The header's count bubble (assets/header.js, built in Milestone 3) already
 * subscribes to these same storage keys, so toggling a button here updates
 * the header automatically with no changes needed on either side.
 */
import { createLocalStorageAdapter } from './theme-storage.js';

/**
 * @param {object} options
 * @param {string} options.selector - CSS selector for toggle buttons, each expected to carry data-product-id
 * @param {string} options.storageKey
 * @param {string} options.eventName - dispatched on <document> after every toggle, detail: { list }
 * @param {number} [options.maxItems] - when set, the oldest entry is dropped to make room for a new one past this cap
 */
export function initToggleButtons({ selector, storageKey, eventName, maxItems }) {
  const storage = createLocalStorageAdapter(storageKey, []);

  function isActive(id) {
    return storage.get().includes(id);
  }

  function updateButton(button) {
    const active = isActive(button.dataset.productId);
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('is-active', active);
  }

  function updateAllButtons() {
    document.querySelectorAll(selector).forEach(updateButton);
  }

  function toggle(id) {
    const list = storage.get();
    const index = list.indexOf(id);

    if (index > -1) {
      list.splice(index, 1);
    } else {
      if (maxItems && list.length >= maxItems) list.shift();
      list.push(id);
    }

    storage.set(list);
    updateAllButtons();
    document.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail: { list } }));
  }

  document.querySelectorAll(selector).forEach((button) => {
    updateButton(button);
    button.addEventListener('click', () => toggle(button.dataset.productId));
  });

  storage.subscribe(updateAllButtons);
}
