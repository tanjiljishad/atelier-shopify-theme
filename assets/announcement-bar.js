/**
 * <announcement-bar> — crossfades between 2+ messages and pauses on
 * hover/focus; dismiss persists across visits via the storage adapter.
 * Crossfade timing comes entirely from --dur-slow in theme.css, which
 * Milestone 1's reduced-motion media query already shortens to 80ms — no
 * extra branching needed here for that.
 */
import { createLocalStorageAdapter } from './theme-storage.js';

const DISMISS_KEY = 'atelier:announcement-dismissed';

class AnnouncementBar extends HTMLElement {
  connectedCallback() {
    this.storage = createLocalStorageAdapter(DISMISS_KEY, false);
    if (this.storage.get()) {
      this.hidden = true;
      return;
    }

    this.items = Array.from(this.querySelectorAll('.announcement-bar__item'));
    this.index = 0;
    this.timerId = null;

    const dismissButton = this.querySelector('.announcement-bar__dismiss');
    if (dismissButton) {
      dismissButton.addEventListener('click', () => {
        this.storage.set(true);
        this.hidden = true;
        this.pause();
      });
    }

    if (this.items.length > 1 && this.dataset.rotation === 'true') {
      this.addEventListener('mouseenter', () => this.pause());
      this.addEventListener('mouseleave', () => this.resume());
      this.addEventListener('focusin', () => this.pause());
      this.addEventListener('focusout', () => this.resume());
      this.resume();
    }
  }

  resume() {
    this.pause();
    const seconds = Number.parseFloat(this.dataset.speed) || 6;
    this.timerId = window.setInterval(() => this.next(), seconds * 1000);
  }

  pause() {
    window.clearInterval(this.timerId);
    this.timerId = null;
  }

  next() {
    const current = this.items[this.index];
    this.index = (this.index + 1) % this.items.length;
    const upcoming = this.items[this.index];
    current.classList.remove('is-active');
    upcoming.classList.add('is-active');
  }
}

customElements.define('announcement-bar', AnnouncementBar);
