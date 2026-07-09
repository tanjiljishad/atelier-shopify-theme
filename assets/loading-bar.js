/**
 * Page-transition loading bar (spec §5.6: "2px ink progress bar under
 * header"). Scoped to real, full-page navigations only — AJAX partial
 * updates (cart drawer, collection filters, etc.) already have their own
 * `.is-loading` dimming/opacity states from earlier milestones; this isn't
 * a second loading-state system layered on top of those, just the one
 * case none of them cover: an actual page unload.
 */
export function initLoadingBar(root = document) {
  const bar = root.querySelector('[data-loading-bar]');
  if (!bar) return;

  window.addEventListener('beforeunload', () => {
    bar.classList.add('is-loading');
  });
}
