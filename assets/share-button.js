/**
 * Progressive enhancement for snippets/share-button.liquid. Without this
 * script the button is inert (no href to fall back to, since there's nothing
 * meaningful to navigate to for "share") — an acceptable degradation given
 * share is a convenience action, not a primary commerce path.
 */
export function initShareButtons(root = document) {
  root.querySelectorAll('[data-share-button]').forEach((button) => {
    const confirmation = button.parentElement.querySelector('[data-share-confirmation]');

    button.addEventListener('click', async () => {
      const title = button.dataset.shareTitle;
      const url = button.dataset.shareUrl;

      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch (error) {
          // AbortError when the visitor dismisses the native share sheet —
          // not a failure, nothing to report.
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(url);
        showConfirmation(confirmation);
      } catch (error) {
        // Clipboard API unavailable/blocked — the URL is already visible in
        // the address bar, so there's nothing better to fall back to.
      }
    });
  });
}

function showConfirmation(confirmation) {
  if (!confirmation) return;
  confirmation.classList.add('is-visible');
  window.setTimeout(() => confirmation.classList.remove('is-visible'), 2000);
}
