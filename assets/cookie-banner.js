/**
 * Cookie consent banner. Accept/decline both just record a permanent choice
 * and close the card — see snippets/cookie-banner.liquid for why there's no
 * actual gating behavior to trigger here.
 */
import { createLocalStorageAdapter } from './theme-storage.js';

const STORAGE_KEY = 'atelier:cookie-consent';

export function initCookieBanner(root = document) {
  const banner = root.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const storage = createLocalStorageAdapter(STORAGE_KEY, null);
  if (storage.get()) return;

  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add('is-visible'));

  function dismiss(choice) {
    storage.set(choice);
    banner.classList.remove('is-visible');
    window.setTimeout(() => {
      banner.hidden = true;
    }, 300);
  }

  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => dismiss('accepted'));
  banner.querySelector('[data-cookie-decline]')?.addEventListener('click', () => dismiss('declined'));
}
