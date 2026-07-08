import { initToggleButtons } from './product-list-toggle.js';

// maxItems: 4 — spec's compare bar "collects up to 4" (§5.2); the 5th add
// drops the oldest rather than silently failing or blocking the click.
initToggleButtons({
  selector: '[data-compare-toggle]',
  storageKey: 'atelier:compare',
  eventName: 'compare:updated',
  maxItems: 4,
});
