/**
 * <testimonial-carousel> — crossfades between quotes every 8s (spec §5.5),
 * with dot navigation and the same pause-on-hover/focus pattern as
 * assets/announcement-bar.js (WCAG 2.2.2 Pause/Stop/Hide for auto-rotating
 * content). Not shared code with announcement-bar.js beyond the pattern —
 * the markup/dot-sync requirements differ enough that a shared abstraction
 * would need as many branches as it would save lines.
 */
class TestimonialCarousel extends HTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll('.testimonial'));
    this.dots = Array.from(this.querySelectorAll('[data-testimonial-dot]'));
    if (this.items.length < 2) return;

    this.index = 0;
    this.timerId = null;

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.show(i));
    });

    this.addEventListener('mouseenter', () => this.pause());
    this.addEventListener('mouseleave', () => this.resume());
    this.addEventListener('focusin', () => this.pause());
    this.addEventListener('focusout', () => this.resume());

    this.resume();
  }

  show(index) {
    const current = this.items[this.index];
    const currentDot = this.dots[this.index];
    const next = this.items[index];
    const nextDot = this.dots[index];

    if (current) current.classList.remove('is-active');
    if (currentDot) {
      currentDot.classList.remove('is-active');
      currentDot.setAttribute('aria-selected', 'false');
    }

    next.classList.add('is-active');
    if (nextDot) {
      nextDot.classList.add('is-active');
      nextDot.setAttribute('aria-selected', 'true');
    }

    this.index = index;
  }

  next() {
    this.show((this.index + 1) % this.items.length);
  }

  resume() {
    this.pause();
    const interval = Number.parseInt(this.dataset.autoplay, 10) || 8000;
    this.timerId = window.setInterval(() => this.next(), interval);
  }

  pause() {
    window.clearInterval(this.timerId);
    this.timerId = null;
  }
}

customElements.define('testimonial-carousel', TestimonialCarousel);
