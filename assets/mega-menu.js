/**
 * Enhances every `.header-nav__item--has-children` (both the mega-menu and
 * standard-dropdown panel types share this exact behavior — see
 * snippets/header-mega-menu.liquid / header-dropdown.liquid, both marked
 * with the shared `[data-nav-panel]` attribute):
 *   - 150ms hover-intent open, click-to-toggle when the trigger's href is a
 *     placeholder ("#" or empty — the common pattern for parent-only menu items)
 *   - Escape closes and returns focus to the trigger (spec §5.1, §12)
 *   - ArrowDown opens the panel and focuses its first link
 *   - ArrowLeft/ArrowRight move between top-level triggers
 *   - ArrowUp/ArrowDown move between links inside an open panel
 *   - focus leaving the whole nav closes whatever's open
 *
 * An init function (not a custom element) since this enhances a set of
 * existing elements rather than owning a single self-contained widget —
 * consistent with initScrollReveal's pattern in motion.js.
 */

const HOVER_OPEN_DELAY = 150;
const HOVER_CLOSE_DELAY = 100;

export function initNavMenus(root = document) {
  const nav = root.querySelector('.header-nav');
  if (!nav) return;

  const items = Array.from(nav.querySelectorAll(':scope > ul > .header-nav__item--has-children'));
  const triggers = items
    .map((item) => item.querySelector(':scope > .header-nav__link'))
    .filter(Boolean);

  items.forEach((item, itemIndex) => {
    const trigger = triggers[itemIndex];
    const panel = item.querySelector('[data-nav-panel]');
    if (!trigger || !panel) return;

    let openTimer;
    let closeTimer;

    const open = () => {
      window.clearTimeout(closeTimer);
      closeAll(items, item);
      panel.hidden = false;
      window.requestAnimationFrame(() => panel.classList.add('is-open'));
      trigger.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      window.clearTimeout(openTimer);
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      panel.addEventListener(
        'transitionend',
        () => {
          if (!panel.classList.contains('is-open')) panel.hidden = true;
        },
        { once: true }
      );
    };

    item.addEventListener('mouseenter', () => {
      window.clearTimeout(closeTimer);
      openTimer = window.setTimeout(open, HOVER_OPEN_DELAY);
    });
    item.addEventListener('mouseleave', () => {
      window.clearTimeout(openTimer);
      closeTimer = window.setTimeout(close, HOVER_CLOSE_DELAY);
    });

    const isPlaceholderHref = trigger.getAttribute('href') === '#' || trigger.getAttribute('href') === '';
    if (isPlaceholderHref) {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        panel.classList.contains('is-open') ? close() : open();
      });
    }

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) {
        close();
        trigger.focus();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open();
        panel.querySelector('a')?.focus();
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (itemIndex + delta + triggers.length) % triggers.length;
        triggers[nextIndex]?.focus();
      }
    });

    panel.addEventListener('keydown', (event) => {
      const links = Array.from(panel.querySelectorAll('a'));
      const currentIndex = links.indexOf(document.activeElement);

      if (event.key === 'Escape') {
        close();
        trigger.focus();
      } else if (event.key === 'ArrowDown' && currentIndex > -1) {
        event.preventDefault();
        links[(currentIndex + 1) % links.length]?.focus();
      } else if (event.key === 'ArrowUp' && currentIndex > -1) {
        event.preventDefault();
        links[(currentIndex - 1 + links.length) % links.length]?.focus();
      }
    });
  });

  nav.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (!nav.contains(document.activeElement)) closeAll(items, null);
    });
  });

  function closeAll(allItems, exceptItem) {
    allItems.forEach((other) => {
      if (other === exceptItem) return;
      const otherPanel = other.querySelector('[data-nav-panel]');
      const otherTrigger = other.querySelector(':scope > .header-nav__link');
      if (otherPanel && otherPanel.classList.contains('is-open')) {
        otherPanel.classList.remove('is-open');
        otherPanel.hidden = true;
        if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }
}
