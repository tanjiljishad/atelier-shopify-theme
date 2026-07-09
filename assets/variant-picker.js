/**
 * <variant-picker> (spec §7 "Variant behavior"). Progressively enhances the
 * real radio-group/select markup in variant-picker.liquid: without this
 * script every control still submits a real form correctly (native browser
 * behavior), just without the live in-place updates.
 *
 * Reads variant data from the JSON blob variant-picker.liquid already
 * rendered server-side (one source of truth — no parallel "what's on sale /
 * what's low stock" logic re-derived in JS) and, on every option change:
 *   - finds the matching variant (assets/commerce-utils.js)
 *   - updates price, inventory line, SKU, and the add-to-cart button state
 *     in place (all live inside the same buy box this element sits in)
 *   - scrolls the gallery to that variant's featured image, if it has one
 *   - replaces the URL with ?variant=<id> (shareable, no reload — spec:
 *     "URL updates per variant")
 *   - re-strikes any other option values that are unavailable in
 *     combination with the newly selected one ("unavailable combos strike
 *     through live")
 *   - dispatches `variant:change` (bubbles, detail: { variant }) for
 *     independent components elsewhere on the page (sticky mobile ATC bar,
 *     complete-the-look) that need the current variant/price without being
 *     tightly coupled to this element's internal DOM
 */
import { findMatchingVariant, renderPriceHtml } from './commerce-utils.js';

class VariantPicker extends HTMLElement {
  connectedCallback() {
    const dataScript = this.querySelector('[data-variant-picker-json]');
    if (!dataScript) return;

    const data = JSON.parse(dataScript.textContent);
    this.variants = data.variants;
    this.i18n = data.i18n;
    this.lowStockThreshold = data.lowStockThreshold;
    this.productUrl = this.dataset.productUrl;

    this.buyBox = this.closest('.buy-box') || document;
    this.priceTarget = this.buyBox.querySelector('[data-product-price]');
    this.inventoryTarget = this.buyBox.querySelector('[data-product-inventory]');
    this.skuTarget = this.buyBox.querySelector('[data-product-sku]');
    this.atcButton = this.buyBox.querySelector('[data-product-atc]');
    this.quantityInput = this.buyBox.querySelector('.quantity-input__value');
    this.variantIdInput = this.buyBox.querySelector('[data-product-form-variant-id]');

    this.fieldsets = Array.from(this.querySelectorAll('.variant-picker__option'));

    this.addEventListener('change', (event) => {
      if (event.target.matches('input[type="radio"], select')) this.handleChange();
    });

    this.updateUnavailableStates();
  }

  getSelections() {
    const selections = {};
    this.fieldsets.forEach((fieldset, index) => {
      const position = index + 1;
      const checkedRadio = fieldset.querySelector('input[type="radio"]:checked');
      const select = fieldset.querySelector('select');
      selections[position] = checkedRadio ? checkedRadio.value : select ? select.value : null;

      const selectedLabel = fieldset.querySelector('[data-selected-value]');
      if (selectedLabel) {
        selectedLabel.textContent = selections[position];
      }
    });
    return selections;
  }

  handleChange() {
    const selections = this.getSelections();
    const variant = findMatchingVariant(this.variants, selections);

    this.updateUnavailableStates(selections);
    this.dispatchEvent(new CustomEvent('variant:change', { bubbles: true, detail: { variant } }));

    if (!variant) {
      if (this.variantIdInput) this.variantIdInput.value = '';
      this.setAtcUnavailable();
      return;
    }

    if (this.variantIdInput) this.variantIdInput.value = variant.id;

    this.updatePrice(variant);
    this.updateInventory(variant);
    this.updateSku(variant);
    this.updateUrl(variant);
    this.updateGallery(variant);
    this.updateAtc(variant);
  }

  updatePrice(variant) {
    if (!this.priceTarget) return;
    this.priceTarget.innerHTML = renderPriceHtml(variant, this.i18n, 'pdp');
  }

  updateInventory(variant) {
    if (!this.inventoryTarget) return;
    const tracked = variant.inventoryManagement != null;
    let status = 'in-stock';

    if (!variant.available) {
      status = 'out-of-stock';
    } else if (tracked) {
      if (variant.inventoryQuantity <= 0) {
        status = variant.inventoryPolicy === 'continue' ? 'backorder' : 'out-of-stock';
      } else if (variant.inventoryQuantity <= this.lowStockThreshold) {
        status = 'low-stock';
      }
    }

    const messages = {
      'out-of-stock': this.i18n.outOfStock,
      backorder: this.i18n.backorder,
      'low-stock': this.i18n.lowStock.replace('{count}', variant.inventoryQuantity),
      'in-stock': this.i18n.inStock,
    };

    this.inventoryTarget.innerHTML = `<div class="inventory-indicator inventory-indicator--${status}">
        <span class="inventory-indicator__dot" aria-hidden="true"></span>
        <span class="inventory-indicator__message">${messages[status]}</span>
      </div>`;
  }

  updateSku(variant) {
    if (this.skuTarget) this.skuTarget.textContent = variant.sku || '';
  }

  updateUrl(variant) {
    if (!this.productUrl) return;
    const url = new URL(this.productUrl, window.location.origin);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }

  updateGallery(variant) {
    if (!variant.featuredMediaId) return;
    document.querySelector('product-gallery')?.scrollToMediaId(variant.featuredMediaId);
  }

  updateAtc(variant) {
    if (this.quantityInput) {
      this.quantityInput.disabled = !variant.available;
    }
    if (!this.atcButton) return;

    this.atcButton.disabled = !variant.available;
    this.atcButton.setAttribute('aria-disabled', String(!variant.available));
    const label = this.atcButton.querySelector('.btn__label');
    // Spec §7: an unavailable combination stays a real, enabled, clickable
    // control — its CTA becomes "Notify me" rather than a dead "Sold out"
    // button (that fixed label lives on the product-labels badge instead,
    // a separate piece of UI).
    if (label) {
      label.textContent = variant.available ? this.i18n.addToCart : this.i18n.notifyMe;
    }
    this.atcButton.disabled = false;
    this.atcButton.setAttribute('aria-disabled', String(!variant.available));
  }

  setAtcUnavailable() {
    if (!this.atcButton) return;
    this.atcButton.setAttribute('aria-disabled', 'true');
    const label = this.atcButton.querySelector('.btn__label');
    if (label) label.textContent = this.i18n.unavailable;
  }

  /**
   * For every value in every option group, checks whether at least one
   * available variant matches it combined with the *other* groups' current
   * selections — same "still clickable, just struck through" rule the
   * server-rendered markup already applies at load, kept live as selections
   * change (spec: "unavailable combos strike through live").
   */
  updateUnavailableStates(selections = this.getSelections()) {
    this.fieldsets.forEach((fieldset, index) => {
      const position = index + 1;
      const options = Array.from(fieldset.querySelectorAll('input[type="radio"]'));

      options.forEach((input) => {
        const testSelections = { ...selections, [position]: input.value };
        const available = this.variants.some(
          (variant) =>
            variant.available &&
            Object.entries(testSelections).every(([pos, value]) => variant.options[pos - 1] === value)
        );

        const wrapper = input.closest('.variant-swatch, .variant-pill');
        if (!wrapper) return;
        const unavailableClass = wrapper.classList.contains('variant-swatch')
          ? 'variant-swatch--unavailable'
          : 'variant-pill--unavailable';
        wrapper.classList.toggle(unavailableClass, !available);
      });
    });
  }
}

customElements.define('variant-picker', VariantPicker);
