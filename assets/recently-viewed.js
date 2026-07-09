/**
 * Recently viewed (spec §5.2). Records a lightweight snapshot of the current
 * PDP into the same storage-adapter abstraction wishlist/compare use (assets/
 * theme-storage.js), then renders every other stored snapshot as a compact
 * card reusing the exact same CSS classes .product-card already defines —
 * the markup itself is JS-templated rather than Liquid-rendered (see
 * recently-viewed.liquid's comment for why), but the visual result is
 * identical since it draws on the same class names/tokens.
 */
import { createLocalStorageAdapter } from './theme-storage.js';
import { renderPriceHtml } from './commerce-utils.js';

const MAX_STORED = 12;
const MAX_SHOWN = 4;
const MIN_TO_SHOW = 2;

export function initRecentlyViewed(root = document) {
  const container = root.querySelector('[data-recently-viewed]');
  if (!container) return;

  const grid = container.querySelector('[data-recently-viewed-grid]');
  if (!grid) return;

  const storage = createLocalStorageAdapter('atelier:recently-viewed', []);
  const currentScript = container.querySelector('[data-recently-viewed-current]');

  let i18n;
  let others;

  if (currentScript) {
    // A PDP: record this view, then show every *other* stored product.
    const { i18n: currentI18n, ...current } = JSON.parse(currentScript.textContent);
    i18n = currentI18n;

    const existing = storage.get().filter((item) => item.handle !== current.handle);
    existing.unshift(current);
    storage.set(existing.slice(0, MAX_STORED));
    others = existing.slice(0, MAX_SHOWN);
  } else {
    // Cart page (or anywhere else with nothing of its own to record): just
    // display what's already stored.
    const i18nScript = container.querySelector('[data-recently-viewed-i18n]');
    i18n = i18nScript ? JSON.parse(i18nScript.textContent) : { salePrice: '', regularPrice: '' };
    others = storage.get().slice(0, MAX_SHOWN);
  }

  if (others.length < MIN_TO_SHOW) return;

  grid.innerHTML = others.map((item) => renderCard(item, i18n)).join('');
  container.hidden = false;
}

function renderCard(item, i18n) {
  const priceHtml = renderPriceHtml(
    { price: item.price, compareAtPrice: item.compareAtPrice || 0 },
    i18n,
    'card'
  );

  return `<div class="product-card">
    <div class="product-card__media">
      <a href="${item.url}" class="product-card__media-link aspect-ratio" style="aspect-ratio: 4/5;" tabindex="-1" aria-hidden="true">
        <img class="product-card__image product-card__image--primary" src="${item.image}" alt="" loading="lazy" width="400" height="500">
      </a>
    </div>
    <div class="product-card__info">
      <h3 class="product-card__title"><a href="${item.url}">${escapeHtml(item.title)}</a></h3>
      ${priceHtml}
    </div>
  </div>`;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
