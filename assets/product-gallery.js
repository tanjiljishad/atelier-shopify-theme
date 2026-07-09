/**
 * <product-gallery> (spec §5.4, §7). The DOM already contains every media
 * item in document order — desktop CSS stacks them in a vertical scrolling
 * column, mobile CSS switches the same list to a horizontal scroll-snap
 * carousel (see product-gallery.liquid's comment) — so this script never
 * branches on viewport width either. It only has to:
 *   - keep the thumbnail rail / dot progress in sync with whichever item is
 *     currently in view (scrollspy, via IntersectionObserver)
 *   - scroll a clicked thumbnail/dot's item into view
 *   - let arrow keys move focus to the next/previous item
 *   - hand a zoom-button click off to <product-lightbox> via a bubbling event
 *   - toggle a `.is-loaded` class per item so CSS can show a skeleton
 *     placeholder until each image/video/model actually has pixels to show
 *   - expose scrollToMediaId(), which assets/variant-picker.js calls on
 *     variant change so a color-matched image scrolls into place (spec §7:
 *     "selection updates gallery")
 *
 * Swiping and scrolling themselves are native browser behavior (scroll-snap),
 * same philosophy as assets/product-slider.js.
 */
export class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.main = this.querySelector('[data-gallery-main]');
    this.items = Array.from(this.querySelectorAll('[data-gallery-item]'));
    this.thumbs = Array.from(this.querySelectorAll('[data-gallery-thumb]'));
    this.dots = Array.from(this.querySelectorAll('[data-gallery-dot]'));
    if (!this.main || !this.items.length) return;

    this.bindLoadingStates();
    this.bindThumbsAndDots();
    this.bindScrollspy();
    this.bindKeyboard();
    this.bindZoomTriggers();
  }

  bindLoadingStates() {
    this.items.forEach((item) => {
      const media = item.querySelector('img, video, model-viewer, iframe');
      if (!media) return;
      const markLoaded = () => item.classList.add('is-loaded');

      if (media.tagName === 'IMG') {
        if (media.complete) markLoaded();
        else media.addEventListener('load', markLoaded, { once: true });
      } else if (media.tagName === 'VIDEO') {
        if (media.readyState >= 2) markLoaded();
        else media.addEventListener('loadeddata', markLoaded, { once: true });
      } else {
        // model-viewer / external_video iframe: no reliable universal ready
        // event across browsers — reveal immediately rather than risk a
        // stuck skeleton.
        markLoaded();
      }
    });
  }

  bindThumbsAndDots() {
    const scrollToIndex = (index) => {
      const target = this.items[index];
      if (!target) return;
      const isMobile = window.matchMedia('(max-width: 749px)').matches;
      target.scrollIntoView({
        behavior: 'smooth',
        block: isMobile ? 'nearest' : 'start',
        inline: isMobile ? 'start' : 'nearest',
      });
    };

    this.thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => scrollToIndex(Number(thumb.dataset.mediaIndex)));
    });
    this.dots.forEach((dot) => {
      dot.addEventListener('click', () => scrollToIndex(Number(dot.dataset.mediaIndex)));
    });
  }

  bindScrollspy() {
    if (!('IntersectionObserver' in window) || (!this.thumbs.length && !this.dots.length)) return;

    const setActive = (index) => {
      this.thumbs.forEach((thumb) => {
        const active = Number(thumb.dataset.mediaIndex) === index;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-selected', String(active));
      });
      this.dots.forEach((dot) => {
        dot.classList.toggle('is-active', Number(dot.dataset.mediaIndex) === index);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number(visible.target.dataset.mediaIndex));
      },
      { root: this.main, threshold: [0.5, 0.75, 1] }
    );

    this.items.forEach((item) => observer.observe(item));
  }

  bindKeyboard() {
    this.main.addEventListener('keydown', (event) => {
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      if (!forward && !backward) return;

      const active = this.items.find((item) => item.classList.contains('is-loaded') && this.isCentered(item));
      const currentIndex = active ? Number(active.dataset.mediaIndex) : 0;
      const nextIndex = forward
        ? Math.min(currentIndex + 1, this.items.length - 1)
        : Math.max(currentIndex - 1, 0);

      event.preventDefault();
      this.items[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  }

  isCentered(item) {
    const thumb = this.thumbs.find((t) => t.dataset.mediaIndex === item.dataset.mediaIndex);
    return thumb ? thumb.classList.contains('is-active') : true;
  }

  scrollToMediaId(mediaId) {
    if (!mediaId) return;
    const item = this.items.find((el) => el.dataset.mediaId === String(mediaId));
    if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  bindZoomTriggers() {
    // One gallery + one lightbox per product page (quick-view's mini-gallery
    // has no zoom trigger and is out of scope), so the event needs no id to
    // route by — assets/product-lightbox.js listens for this unconditionally.
    this.querySelectorAll('[data-gallery-zoom]').forEach((button) => {
      button.addEventListener('click', () => {
        document.dispatchEvent(
          new CustomEvent('gallery:zoom', {
            bubbles: true,
            detail: { index: Number(button.dataset.mediaIndex) },
          })
        );
      });
    });
  }
}

customElements.define('product-gallery', ProductGallery);
