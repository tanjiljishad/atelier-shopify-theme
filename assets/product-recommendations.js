/**
 * <product-recommendations> — fetches the related-products section (Shopify's
 * native recommendation engine, see snippets/product-recommendations.liquid)
 * and swaps its skeleton placeholder for the real grid. Same fetch-and-
 * extract-#shopify-section-X pattern as predictive-search.js/collection-
 * filters.js, applied to a section that's requested through
 * routes.product_recommendations_url instead of a plain section_id fetch.
 */
class ProductRecommendations extends HTMLElement {
  async connectedCallback() {
    const url = this.dataset.url;
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Recommendations request failed');

      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const grid = doc.querySelector('.grid');

      if (grid) {
        this.innerHTML = grid.outerHTML;
      } else {
        this.closest('.section')?.remove();
      }
    } catch (error) {
      // No recommendations available (network failure, or the store has no
      // recommendation data for this product) — remove the whole section
      // rather than leave a permanent skeleton on screen.
      this.closest('.section')?.remove();
    }
  }
}

customElements.define('product-recommendations', ProductRecommendations);
