/**
 * <theme-drawer> — generic edge-anchored sliding panel: scrim, focus trap,
 * Escape-to-close, scroll lock. This is the shared base for every drawer in
 * the theme (mobile nav now; search now; cart in a later milestone) so that
 * open/close/focus/scroll-lock behavior is implemented exactly once. Extend
 * it (see assets/mobile-nav.js) when a drawer needs additional behavior on
 * top of the generic open/close contract.
 *
 * Markup contract:
 *   <theme-drawer id="SearchDrawer" side="right" hidden>
 *     <div class="drawer__scrim" data-drawer-dismiss></div>
 *     <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="...">
 *       <button data-drawer-close aria-label="Close">...</button>
 *       ...
 *     </div>
 *   </theme-drawer>
 *
 * Opens from anywhere on the page via `<button data-drawer-open="SearchDrawer">`.
 * Starts `hidden` in markup (zero layout cost until opened); JS removes/restores
 * `hidden` around the CSS transform transition so it can animate both ways.
 */
import { createFocusTrap, lockScroll, unlockScroll } from './motion.js';

export class ThemeDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('.drawer__panel');
    this.scrim = this.querySelector('.drawer__scrim');
    this.focusTrap = this.panel ? createFocusTrap(this.panel) : null;
    this.isOpen = false;

    this.querySelectorAll('[data-drawer-close]').forEach((button) =>
      button.addEventListener('click', () => this.close())
    );
    if (this.scrim) this.scrim.addEventListener('click', () => this.close());

    this._openTriggerHandler = (event) => {
      const trigger = event.target.closest(`[data-drawer-open="${this.id}"]`);
      if (!trigger) return;
      event.preventDefault();
      this.open();
    };
    document.addEventListener('click', this._openTriggerHandler);

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) this.close();
    });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._openTriggerHandler);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.hidden = false;
    lockScroll();
    // Force a layout flush so the closed (off-screen) state paints before
    // .is-open is added — otherwise the browser may coalesce both style
    // changes into one frame and skip the slide-in transition entirely.
    void this.offsetHeight;
    this.classList.add('is-open');
    if (this.focusTrap) this.focusTrap.activate();
    this.dispatchEvent(new CustomEvent('drawer-open', { bubbles: true }));
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.classList.remove('is-open');
    if (this.focusTrap) this.focusTrap.deactivate();
    unlockScroll();
    this.dispatchEvent(new CustomEvent('drawer-close', { bubbles: true }));

    const finish = () => {
      if (!this.isOpen) this.hidden = true;
    };
    if (this.panel) {
      this.panel.addEventListener('transitionend', finish, { once: true });
    } else {
      finish();
    }
  }
}

customElements.define('theme-drawer', ThemeDrawer);
