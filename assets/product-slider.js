/**
 * Product slider (spec §5.5) — native horizontal scroll + CSS scroll-snap
 * does the actual scrolling/touch/momentum for free; this only wires the two
 * arrow buttons (scrollBy one card width) and keeps the progress bar in sync.
 */
export function initProductSliders(root = document) {
  root.querySelectorAll('[data-slider-track]').forEach((track) => {
    const container = track.closest('.section');
    if (!container) return;

    const prevButton = container.querySelector('[data-slider-prev]');
    const nextButton = container.querySelector('[data-slider-next]');
    const progressFill = container.querySelector('[data-slider-progress]');

    function cardWidth() {
      const firstItem = track.querySelector('.product-slider__item');
      return firstItem ? firstItem.getBoundingClientRect().width + 20 : track.clientWidth;
    }

    function updateProgress() {
      if (!progressFill) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const progress = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
      progressFill.style.width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        track.scrollBy({ left: -cardWidth(), behavior: 'smooth' });
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        track.scrollBy({ left: cardWidth(), behavior: 'smooth' });
      });
    }

    track.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  });
}
