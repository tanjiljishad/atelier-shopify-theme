/**
 * Full-screen age gate. Remembered for 30 days via a stored timestamp
 * (rather than a plain boolean) so re-verification happens automatically
 * once that window elapses.
 */
import { createLocalStorageAdapter } from './theme-storage.js';
import { createFocusTrap, lockScroll, unlockScroll } from './motion.js';

const STORAGE_KEY = 'atelier:age-verified';
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

export function initAgeVerification(root = document) {
  const gate = root.querySelector('[data-age-gate]');
  if (!gate) return;

  const storage = createLocalStorageAdapter(STORAGE_KEY, null);
  const verifiedAt = storage.get();
  if (verifiedAt && Date.now() - verifiedAt < REMEMBER_MS) return;

  const panel = gate.querySelector('.age-gate__panel');
  const focusTrap = panel ? createFocusTrap(panel) : null;

  gate.hidden = false;
  lockScroll();
  requestAnimationFrame(() => {
    gate.classList.add('is-visible');
    focusTrap?.activate();
  });

  gate.querySelector('[data-age-gate-confirm]')?.addEventListener('click', () => {
    storage.set(Date.now());
    focusTrap?.deactivate();
    unlockScroll();
    gate.classList.remove('is-visible');
    window.setTimeout(() => {
      gate.hidden = true;
    }, 300);
  });

  gate.querySelector('[data-age-gate-deny]')?.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });
}
