/**
 * <predictive-search> — debounced, abortable fetch against Shopify's
 * predictive search endpoint via the Section Rendering API
 * (sections/predictive-search.liquid renders the actual markup server-side,
 * reusing the theme's existing price/image/icon snippets). Also owns a small
 * "recent searches" list via the storage adapter.
 *
 * Panel states (recent / loading / results / empty) are plain sibling
 * elements toggled via `hidden` — see snippets/search-drawer.liquid for the
 * markup contract this expects.
 */
import { createLocalStorageAdapter } from './theme-storage.js';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;
const RECENT_SEARCHES_KEY = 'atelier:recent-searches';
const MAX_RECENT_SEARCHES = 5;

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('[data-predictive-search-input]');
    this.panels = {
      recent: this.querySelector('[data-predictive-search-recent]'),
      loading: this.querySelector('[data-predictive-search-loading]'),
      results: this.querySelector('[data-predictive-search-results]'),
      empty: this.querySelector('[data-predictive-search-empty]'),
    };
    this.recentListEl = this.querySelector('[data-predictive-search-recent-list]');
    if (!this.input || !this.panels.results) return;

    this.recentSearches = createLocalStorageAdapter(RECENT_SEARCHES_KEY, []);
    this.abortController = null;
    this.debounceId = null;

    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('focus', () => this.handleInput());

    const form = this.querySelector('form');
    if (form) form.addEventListener('submit', () => this.saveRecentSearch(this.input.value));

    const drawer = this.closest('theme-drawer');
    if (drawer) {
      drawer.addEventListener('drawer-open', () => {
        this.input.focus();
        this.handleInput();
      });
      drawer.addEventListener('drawer-close', () => this.reset());
    }
  }

  handleInput() {
    const term = this.input.value.trim();
    window.clearTimeout(this.debounceId);

    if (term.length < MIN_QUERY_LENGTH) {
      this.showRecentSearchesOrNothing();
      return;
    }

    this.debounceId = window.setTimeout(() => this.search(term), DEBOUNCE_MS);
  }

  async search(term) {
    this.showPanel('loading');

    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    try {
      const url = `${this.dataset.url}?q=${encodeURIComponent(term)}&section_id=predictive-search`;
      const response = await fetch(url, { signal: this.abortController.signal });
      if (!response.ok) throw new Error(`Predictive search request failed: ${response.status}`);

      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const section = doc.querySelector('#shopify-section-predictive-search');
      const html = section ? section.innerHTML.trim() : '';

      this.panels.results.innerHTML = html;
      this.showPanel(html ? 'results' : 'empty');
    } catch (error) {
      if (error.name === 'AbortError') return;
      this.showPanel('empty');
    }
  }

  showPanel(name) {
    Object.entries(this.panels).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
  }

  hideAllPanels() {
    Object.values(this.panels).forEach((el) => {
      if (el) el.hidden = true;
    });
  }

  showRecentSearchesOrNothing() {
    const recent = this.recentSearches.get();
    if (!recent.length || !this.panels.recent || !this.recentListEl) {
      this.hideAllPanels();
      return;
    }

    this.recentListEl.innerHTML = recent
      .map(
        (term) =>
          `<button type="button" class="predictive-search__recent-chip" data-recent-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`
      )
      .join('');

    this.recentListEl.querySelectorAll('[data-recent-term]').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.input.value = chip.getAttribute('data-recent-term') || '';
        this.input.focus();
        this.handleInput();
      });
    });

    this.showPanel('recent');
  }

  saveRecentSearch(term) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const recent = this.recentSearches.get().filter((existing) => existing !== trimmed);
    recent.unshift(trimmed);
    this.recentSearches.set(recent.slice(0, MAX_RECENT_SEARCHES));
  }

  reset() {
    window.clearTimeout(this.debounceId);
    if (this.abortController) this.abortController.abort();
    this.input.value = '';
    this.panels.results.innerHTML = '';
    this.hideAllPanels();
  }
}

customElements.define('predictive-search', PredictiveSearch);
