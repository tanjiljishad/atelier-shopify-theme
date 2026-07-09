/**
 * Shared commerce utilities — pure functions, no DOM dependency, so they're
 * trivial to reuse from whatever imports them.
 *
 * findMatchingVariant is explicitly forward-looking architecture: nothing
 * calls it yet, since live variant-switching JS is out of scope until the
 * product page milestone (this milestone only builds the variant-picker
 * *markup* contract it will read — see snippets/variant-picker.liquid).
 * formatMoney exists for the same reason: today every price is server-
 * rendered via Liquid's `money` filter, but a future variant switch needs to
 * update a displayed price from JSON (no page reload), which needs a client-
 * side equivalent of that filter.
 */

/**
 * Mimics Shopify's `money` filter client-side, using the shop's own format
 * string (injected once as `window.Atelier.settings.moneyFormat` — see
 * layout/theme.liquid) so currency/locale formatting matches what Liquid
 * renders everywhere else, rather than hardcoding a "$0.00" assumption.
 *
 * @param {number} cents
 * @param {string} [format] defaults to window.Atelier.settings.moneyFormat
 */
export function formatMoney(cents, format) {
  const moneyFormat =
    format || (window.Atelier && window.Atelier.settings && window.Atelier.settings.moneyFormat) || '${{amount}}';

  const amount = (cents / 100).toFixed(2);
  const amountNoDecimals = String(Math.round(cents / 100));
  const [dollars, decimalPart = '00'] = amount.split('.');
  const withThousands = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return moneyFormat
    .replace(/{{\s*amount\s*}}/, `${withThousands}.${decimalPart}`)
    .replace(/{{\s*amount_no_decimals\s*}}/, withThousands)
    .replace(/{{\s*amount_with_comma_separator\s*}}/, `${withThousands},${decimalPart}`)
    .replace(/{{\s*amount_no_decimals_with_comma_separator\s*}}/, withThousands.replace(/,/g, '.'))
    .replace(/{{\s*amount_no_decimals_with_space_separator\s*}}/, withThousands.replace(/,/g, ' '));
}

/**
 * Finds the variant matching a given set of { position, value } option
 * selections — the standard shape a future <variant-picker> custom element
 * would read from its selected radio inputs (see snippets/variant-picker.liquid's
 * data-option-position / data-option-value contract).
 *
 * @param {Array<{id: number|string, option1: string, option2: string, option3: string}>} variants
 * @param {Record<number, string>} selections keyed by 1-based option position
 */
export function findMatchingVariant(variants, selections) {
  return (
    variants.find((variant) =>
      Object.entries(selections).every(([position, value]) => variant[`option${position}`] === value)
    ) || null
  );
}

/**
 * Builds the exact same markup snippets/price.liquid renders server-side,
 * client-side — used by both assets/variant-picker.js (buy box) and
 * assets/sticky-add-to-cart.js (mobile bar) so a variant change only has one
 * place that knows what price markup looks like, matching price.liquid's
 * "never color-only" sale-state labeling.
 *
 * @param {{price: number, compareAtPrice: number}} variant
 * @param {{salePrice: string, regularPrice: string}} i18n
 * @param {'card'|'pdp'} [size]
 */
export function renderPriceHtml(variant, i18n, size = 'pdp') {
  const onSale = variant.compareAtPrice > variant.price;
  if (onSale) {
    return `<div class="price price--${size} price--sale">
      <span class="visually-hidden">${i18n.salePrice}</span>
      <span class="price__sale">${formatMoney(variant.price)}</span>
      <span class="visually-hidden">${i18n.regularPrice}</span>
      <s class="price__compare">${formatMoney(variant.compareAtPrice)}</s>
    </div>`;
  }
  return `<div class="price price--${size}">
    <span class="visually-hidden">${i18n.regularPrice}</span>
    <span class="price__regular">${formatMoney(variant.price)}</span>
  </div>`;
}
