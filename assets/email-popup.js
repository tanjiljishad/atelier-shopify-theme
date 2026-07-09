/**
 * Email-capture popup. Opens on whichever comes first — a delay or 40%
 * scroll depth — then is suppressed for `data-frequency` days via a stored
 * timestamp. `data-force-open` (set server-side in snippets/email-popup.liquid
 * when the native form just posted, successfully or with errors) bypasses
 * both the timers and the frequency check so the visitor sees the result of
 * their own submission immediately after the page reloads.
 */
import { createLocalStorageAdapter } from './theme-storage.js';
import { createFocusTrap, lockScroll, unlockScroll } from './motion.js';

const STORAGE_KEY = 'atelier:popup-dismissed';

export function initEmailPopup(root = document) {
  const popup = root.querySelector('[data-email-popup]');
  if (!popup) return;

  const frequencyDays = Number.parseFloat(popup.dataset.frequency) || 14;
  const delaySeconds = Number.parseFloat(popup.dataset.delay) || 20;
  const forceOpen = popup.dataset.forceOpen === 'true';
  const storage = createLocalStorageAdapter(STORAGE_KEY, null);

  const panel = popup.querySelector('.email-popup__panel');
  const focusTrap = panel ? createFocusTrap(panel) : null;
  let shown = false;
  let timerId = null;

  function dismissedRecently() {
    const stored = storage.get();
    return Boolean(stored) && Date.now() - stored < frequencyDays * 24 * 60 * 60 * 1000;
  }

  function open() {
    if (shown) return;
    shown = true;
    window.clearTimeout(timerId);
    window.removeEventListener('scroll', handleScroll);
    popup.hidden = false;
    lockScroll();
    requestAnimationFrame(() => {
      popup.classList.add('is-visible');
      focusTrap?.activate();
    });
  }

  function dismiss() {
    storage.set(Date.now());
    focusTrap?.deactivate();
    unlockScroll();
    popup.classList.remove('is-visible');
    window.setTimeout(() => {
      popup.hidden = true;
    }, 300);
  }

  function handleScroll() {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    if (total > 0 && scrolled / total >= 0.4) open();
  }

  popup.querySelectorAll('[data-email-popup-dismiss]').forEach((el) => el.addEventListener('click', dismiss));
  popup.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dismiss();
  });

  if (forceOpen) {
    open();
    return;
  }
  if (dismissedRecently()) return;

  timerId = window.setTimeout(open, delaySeconds * 1000);
  window.addEventListener('scroll', handleScroll, { passive: true });
}
