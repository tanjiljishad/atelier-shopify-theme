/**
 * Progressive enhancement for the collection page's #FacetFiltersForm, sort
 * select, and pagination — instant-apply via the Section Rendering API
 * (same fetch-and-extract-#shopify-section-X pattern predictive-search.js
 * established in Milestone 3, applied here to a different section/target).
 * Every control is a real, named form field/link first; without this script
 * the form/links still filter/sort/paginate correctly via full navigation.
 *
 * Sidebar vs. drawer apply timing (spec §8): on desktop with the sidebar
 * style, filters apply the instant a checkbox changes. In the drawer
 * (always used on mobile, optionally on desktop too), filters only apply
 * when the sticky "Show N results" button is pressed — checking several
 * boxes behind an open drawer shouldn't jump the page around underneath it.
 */
const DESKTOP_QUERY = '(min-width: 990px)';

class CollectionFilters {
  constructor(container) {
    this.container = container;
    this.sectionId = container.dataset.sectionId;
    this.collectionUrl = container.querySelector('#FacetFiltersForm')?.getAttribute('action') || window.location.pathname;
    this.form = container.querySelector('#FacetFiltersForm');
    this.main = container.querySelector('.collection-layout__main');
    this.filterPanel = container.querySelector('.collection-filters-panel');
    this.sortSelect = container.querySelector('[data-sort-select]');
    this.gridSwitcher = container.querySelector('[data-grid-switcher]');

    if (!this.form || !this.main) return;

    this.bindFilters();
    this.bindSort();
    this.bindPagination();
    this.bindLoadMore();
  }

  isSidebarMode() {
    return (
      this.filterPanel?.classList.contains('collection-filters-panel--sidebar') &&
      window.matchMedia(DESKTOP_QUERY).matches
    );
  }

  bindFilters() {
    this.form.addEventListener('change', (event) => {
      if (event.target === this.sortSelect) return; // handled separately, always instant
      if (this.isSidebarMode()) this.apply();
    });

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.apply();
      // Drawer submissions (the "Show N results" button) close the drawer
      // it lives in once results are in place — handled inside apply().
    });
  }

  bindSort() {
    if (!this.sortSelect) return;
    this.sortSelect.addEventListener('change', () => this.apply());
  }

  bindPagination() {
    this.main.addEventListener('click', (event) => {
      const link = event.target.closest('.pagination__link, .pagination__arrow');
      if (!link || !link.href) return;
      event.preventDefault();
      this.apply(link.href, { scrollToTop: true });
    });
  }

  bindLoadMore() {
    this.main.addEventListener('click', (event) => {
      const button = event.target.closest('[data-load-more]');
      if (!button) return;
      event.preventDefault();
      this.apply(button.href, { append: true });
    });
  }

  async apply(url, { append = false, scrollToTop = false } = {}) {
    const requestUrl = new URL(url || this.buildUrlFromForm(), window.location.origin);
    requestUrl.searchParams.set('section_id', this.sectionId);

    this.main.classList.add('is-loading');

    try {
      const response = await fetch(requestUrl.toString());
      if (!response.ok) throw new Error(`Collection request failed: ${response.status}`);

      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const newSection = doc.querySelector(`#shopify-section-${this.sectionId}`);
      if (!newSection) throw new Error('Section markup not found in response');

      const newMain = newSection.querySelector('.collection-layout__main');
      const newForm = newSection.querySelector('#FacetFiltersForm');

      if (append && newMain) {
        const newItems = newMain.querySelectorAll('.product-grid__item');
        const grid = this.main.querySelector('[data-collection-grid]');
        newItems.forEach((item) => grid?.appendChild(item));
        const oldPagination = this.main.querySelector('.pagination');
        const newPagination = newMain.querySelector('.pagination');
        if (oldPagination && newPagination) oldPagination.replaceWith(newPagination);
        else if (oldPagination) oldPagination.remove();
      } else if (newMain) {
        this.main.replaceWith(newMain);
        this.main = newMain;
        // bindPagination/bindLoadMore delegate from `this.main`, which was
        // just replaced — re-bind onto the new node or clicks silently stop
        // working after the very first swap.
        this.bindPagination();
        this.bindLoadMore();
      }

      if (newForm && this.form) {
        this.form.replaceWith(newForm);
        this.form = newForm;
        this.bindFilters();
      }

      const cleanUrl = new URL(requestUrl);
      cleanUrl.searchParams.delete('section_id');
      window.history.pushState({}, '', cleanUrl.toString());

      this.filterPanel?.close?.();

      if (scrollToTop) {
        this.main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      // Network/parse failure: fall back to a real navigation, which always
      // works since every control here is a real link/form to begin with.
      const fallbackUrl = new URL(requestUrl);
      fallbackUrl.searchParams.delete('section_id');
      window.location.href = fallbackUrl.toString();
    } finally {
      this.main.classList.remove('is-loading');
    }
  }

  buildUrlFromForm() {
    const params = new URLSearchParams(new FormData(this.form));
    return `${this.collectionUrl}?${params.toString()}`;
  }
}

export function initCollectionFilters(root = document) {
  root.querySelectorAll('[data-collection-section]').forEach((container) => new CollectionFilters(container));
}
