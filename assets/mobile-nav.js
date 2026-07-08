/**
 * <mobile-nav-drawer> — extends <theme-drawer> (assets/drawer.js) with the
 * nested "push a panel in from the right, back header returns" navigation
 * (spec §5.1). Open/close/focus-trap/scroll-lock/Escape all come from the
 * base class; this only adds the screen-stack logic.
 *
 * Each screen tracks whether it's "behind" (visited, parked off-screen left)
 * or at its default (unvisited, parked off-screen right) via the `is-behind`
 * class, so going back always slides in from the correct side regardless of
 * nesting depth — see the transform rules in theme.css.
 */
import { ThemeDrawer } from './drawer.js';

class MobileNavDrawer extends ThemeDrawer {
  connectedCallback() {
    super.connectedCallback();
    this.screens = Array.from(this.querySelectorAll('[data-mobile-nav-screen]'));

    this.addEventListener('click', (event) => {
      const openTrigger = event.target.closest('[data-submenu-open]');
      if (openTrigger) {
        this.showScreen(openTrigger.getAttribute('data-submenu-open'), 'forward');
        return;
      }
      if (event.target.closest('[data-submenu-back]')) {
        this.goBack();
      }
    });
  }

  open() {
    super.open();
    this.history = ['root'];
    this.showScreen('root', 'forward', { focus: false });
  }

  showScreen(id, direction, { focus = true } = {}) {
    const current = this.screens.find((screen) => screen.classList.contains('is-active'));
    const target = this.screens.find((screen) => screen.getAttribute('data-mobile-nav-screen') === id);
    if (!target || target === current) return;

    if (current) {
      current.classList.remove('is-active');
      current.classList.toggle('is-behind', direction === 'forward');
    }
    target.classList.remove('is-behind');
    target.classList.add('is-active');

    if (direction === 'forward') this.history.push(id);
    if (focus) target.querySelector('a, button')?.focus();
  }

  goBack() {
    if (!this.history || this.history.length <= 1) return;
    this.history.pop();
    const previous = this.history[this.history.length - 1];
    this.showScreenBack(previous);
  }

  showScreenBack(id) {
    const current = this.screens.find((screen) => screen.classList.contains('is-active'));
    const target = this.screens.find((screen) => screen.getAttribute('data-mobile-nav-screen') === id);
    if (!target || target === current) return;

    if (current) {
      current.classList.remove('is-active', 'is-behind');
    }
    target.classList.remove('is-behind');
    target.classList.add('is-active');
    target.querySelector('a, button')?.focus();
  }
}

customElements.define('mobile-nav-drawer', MobileNavDrawer);
