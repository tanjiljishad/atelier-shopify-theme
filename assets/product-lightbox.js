/**
 * <product-lightbox> (spec §5.4 "Zoom"): fullscreen viewer with prev/next
 * arrows and scroll/pinch zoom to 2.5×. Reuses the same focus-trap/scroll-lock
 * primitives every other overlay in the theme depends on (assets/motion.js),
 * so Tab containment and background-scroll locking behave identically to
 * <theme-drawer> even though the open/close visual treatment (centered
 * fade+scale vs. edge slide) and zoom-stage behavior are unique to this
 * component — see product-lightbox.liquid's comment for why this isn't just
 * ThemeDrawer with different CSS.
 */
import { createFocusTrap, lockScroll, unlockScroll } from './motion.js';

const MAX_ZOOM = 2.5;
const MIN_ZOOM = 1;

class ProductLightbox extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('.lightbox__panel');
    this.stage = this.querySelector('[data-lightbox-stage]');
    this.items = Array.from(this.querySelectorAll('[data-lightbox-item]'));
    this.counter = this.querySelector('[data-lightbox-counter]');
    if (!this.panel || !this.stage || !this.items.length) return;

    this.focusTrap = createFocusTrap(this.panel);
    this.isOpen = false;
    this.currentIndex = 0;
    this.zoomState = new Map();

    this.querySelector('[data-lightbox-close]')?.addEventListener('click', () => this.close());
    this.querySelector('[data-lightbox-dismiss]')?.addEventListener('click', () => this.close());
    this.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => this.show(this.currentIndex - 1));
    this.querySelector('[data-lightbox-next]')?.addEventListener('click', () => this.show(this.currentIndex + 1));

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
      if (event.key === 'ArrowLeft') this.show(this.currentIndex - 1);
      if (event.key === 'ArrowRight') this.show(this.currentIndex + 1);
    });

    this.bindZoom();

    document.addEventListener('gallery:zoom', (event) => this.open(event.detail.index));
  }

  open(index = 0) {
    this.isOpen = true;
    this.hidden = false;
    lockScroll();
    void this.offsetHeight;
    this.classList.add('is-open');
    this.show(index);
    this.focusTrap.activate();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.classList.remove('is-open');
    this.focusTrap.deactivate();
    unlockScroll();
    this.panel.addEventListener('transitionend', () => { if (!this.isOpen) this.hidden = true; }, { once: true });
  }

  show(index) {
    const total = this.items.length;
    const nextIndex = ((index % total) + total) % total;
    this.items[this.currentIndex]?.setAttribute('hidden', '');
    this.resetZoom(this.items[this.currentIndex]);
    this.currentIndex = nextIndex;
    this.items[nextIndex]?.removeAttribute('hidden');
    if (this.counter) {
      this.counter.textContent = `${nextIndex + 1} / ${total}`;
    }
  }

  bindZoom() {
    this.items.forEach((item) => {
      const zoomable = item.querySelector('[data-lightbox-zoomable]');
      if (!zoomable) return;
      this.zoomState.set(item, { scale: MIN_ZOOM });

      zoomable.addEventListener('wheel', (event) => {
        event.preventDefault();
        const state = this.zoomState.get(item);
        const delta = -event.deltaY * 0.0015;
        state.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.scale + delta));
        this.applyZoom(zoomable, state.scale);
      }, { passive: false });

      this.bindPinch(item, zoomable);
    });
  }

  bindPinch(item, zoomable) {
    const pointers = new Map();
    let startDistance = 0;
    let startScale = MIN_ZOOM;

    const distance = () => {
      const points = Array.from(pointers.values());
      const [a, b] = points;
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    zoomable.addEventListener('pointerdown', (event) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        startDistance = distance();
        startScale = this.zoomState.get(item).scale;
      }
    });

    zoomable.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size !== 2 || !startDistance) return;

      const state = this.zoomState.get(item);
      const ratio = distance() / startDistance;
      state.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startScale * ratio));
      this.applyZoom(zoomable, state.scale);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
      zoomable.addEventListener(type, (event) => {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) startDistance = 0;
      });
    });
  }

  applyZoom(zoomable, scale) {
    zoomable.style.transform = `scale(${scale})`;
    zoomable.classList.toggle('is-zoomed', scale > MIN_ZOOM);
  }

  resetZoom(item) {
    if (!item) return;
    const zoomable = item.querySelector('[data-lightbox-zoomable]');
    const state = this.zoomState.get(item);
    if (state) state.scale = MIN_ZOOM;
    if (zoomable) {
      zoomable.style.transform = '';
      zoomable.classList.remove('is-zoomed');
    }
  }
}

customElements.define('product-lightbox', ProductLightbox);
