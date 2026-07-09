/**
 * Storage adapter abstraction.
 *
 * Wishlist, Compare, Recently Viewed, the announcement bar's dismissal, dark
 * mode, cookie consent, the age gate, and the email popup all persist data
 * client-side. Rather than calling localStorage directly from each feature, they
 * depend on this small interface. Swapping to a server-backed implementation later
 * (a customer-metafield API, a wishlist app, etc.) means writing one new adapter
 * that implements the same four methods — no changes needed in the features that
 * consume it.
 *
 * Usage:
 *   import { createLocalStorageAdapter } from './theme-storage.js';
 *   const wishlist = createLocalStorageAdapter('atelier:wishlist');
 *   wishlist.get();            // -> any[] (or [] if empty/unavailable)
 *   wishlist.set(['123', '456']);
 *   wishlist.subscribe(fn);    // fn() called on change, including cross-tab
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {() => any} get
 * @property {(value: any) => void} set
 * @property {() => void} remove
 * @property {(callback: () => void) => () => void} subscribe - returns an unsubscribe function
 */

/**
 * @param {string} key
 * @param {any} [fallback]
 * @returns {StorageAdapter}
 */
export function createLocalStorageAdapter(key, fallback = []) {
  const listeners = new Set();

  function isAvailable() {
    try {
      const testKey = '__atelier_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  const available = isAvailable();

  function get() {
    if (!available) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function set(value) {
    if (!available) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      notify();
    } catch (error) {
      /* Storage full or blocked (private browsing); fail silently, UI should
         treat this the same as an empty/unavailable store. */
    }
  }

  function remove() {
    if (!available) return;
    window.localStorage.removeItem(key);
    notify();
  }

  function notify() {
    listeners.forEach((callback) => callback());
  }

  function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  // Cross-tab sync: another tab changing the same key should notify this tab too.
  window.addEventListener('storage', (event) => {
    if (event.key === key) notify();
  });

  return { get, set, remove, subscribe };
}
