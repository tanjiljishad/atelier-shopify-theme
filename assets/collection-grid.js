/**
 * Grid column switcher (spec §8: "grid switcher (2/3/4 columns, icon
 * toggle)"). Purely a display preference — no server round-trip needed —
 * so this just toggles a CSS custom property and persists the choice via
 * the same storage adapter every other client-side preference in the theme
 * uses (Milestone 1).
 */
import { createLocalStorageAdapter } from './theme-storage.js';

const STORAGE_KEY = 'atelier:collection-grid-columns';

export function initCollectionGrid(root = document) {
  const storage = createLocalStorageAdapter(STORAGE_KEY, null);
  const saved = storage.get();

  root.querySelectorAll('[data-grid-switcher]').forEach((switcher) => {
    const grid = switcher.closest('.collection-layout')?.querySelector('[data-collection-grid]');
    if (!grid) return;

    const buttons = Array.from(switcher.querySelectorAll('[data-grid-cols]'));

    function setColumns(columns) {
      grid.style.setProperty('--grid-columns', columns);
      grid.dataset.gridCols = columns;
      buttons.forEach((button) => {
        const isActive = button.dataset.gridCols === String(columns);
        button.setAttribute('aria-pressed', String(isActive));
      });
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const columns = button.dataset.gridCols;
        setColumns(columns);
        storage.set(columns);
      });
    });

    if (saved) setColumns(saved);
  });
}
