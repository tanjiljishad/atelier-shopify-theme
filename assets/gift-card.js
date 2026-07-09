/**
 * Gift card page: copy-code and print buttons. Same clipboard-with-fallback
 * approach as assets/share-button.js (Milestone 7) — reused pattern, not a
 * second clipboard implementation.
 */
export function initGiftCardPage(root = document) {
  const copyButton = root.querySelector('[data-gift-card-copy]');
  const codeEl = root.querySelector('[data-gift-card-code]');

  if (copyButton && codeEl) {
    const label = copyButton.querySelector('.btn__label');
    const originalLabel = label ? label.textContent : '';

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.dataset.giftCardCode);
        if (label) {
          label.textContent = copyButton.dataset.copiedLabel || originalLabel;
          window.setTimeout(() => {
            label.textContent = originalLabel;
          }, 2000);
        }
      } catch (error) {
        /* Clipboard API unavailable/blocked — the code is already visible
           and selectable on the page, so there's nothing better to do. */
      }
    });
  }

  const printButton = root.querySelector('[data-gift-card-print]');
  printButton?.addEventListener('click', () => window.print());
}
