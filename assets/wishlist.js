import { initToggleButtons } from './product-list-toggle.js';

initToggleButtons({
  selector: '[data-wishlist-toggle]',
  storageKey: 'atelier:wishlist',
  eventName: 'wishlist:updated',
});
