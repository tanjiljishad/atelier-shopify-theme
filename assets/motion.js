/**
 * Shared motion controller (spec §10).
 *
 * Every animated component in later milestones (drawers, modals, mega menu,
 * accordions, product gallery, etc.) is expected to depend on the two exports
 * below rather than rolling its own IntersectionObserver or focus-trap logic:
 *
 *   - initScrollReveal(root?)  — wires up [data-scroll-reveal] fade-up-on-scroll
 *   - createFocusTrap(el)      — reusable focus containment for overlays
 *   - prefersReducedMotion()   — single check, mirrors the CSS media query
 *   - performanceModeEnabled() — mirrors settings.performance_mode
 *
 * Both reduced-motion and performance-mode gate the *editorial* effects (Ken-Burns,
 * parallax, hover-crossfade, shimmer) that components will implement themselves;
 * this file only owns the scroll-reveal primitive and the focus-trap utility since
 * those are the two pieces of motion infrastructure that are actually shared by
 * many future components.
 */

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function performanceModeEnabled() {
  return document.documentElement.classList.contains('performance-mode');
}

const REVEAL_SELECTOR = '[data-scroll-reveal]';
const STAGGER_MS = 60;

/**
 * Wires IntersectionObserver-driven fade-up reveals for any element carrying
 * `data-scroll-reveal`. Direct children with `data-scroll-reveal-child` are
 * staggered 60ms apart once the parent enters view. Reveals fire once.
 *
 * No-ops entirely (revealing everything immediately) when motion is disabled via
 * settings.animations_enabled=false, reduced motion, or performance mode, since in
 * all three cases the content should simply be visible rather than animated in.
 *
 * @param {ParentNode} [root=document]
 */
export function initScrollReveal(root = document) {
  const targets = root.querySelectorAll(REVEAL_SELECTOR);
  if (!targets.length) return;

  const motionDisabled =
    !document.documentElement.classList.contains('animations-enabled') ||
    prefersReducedMotion();

  if (motionDisabled || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealChildren(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((target) => observer.observe(target));
}

function revealChildren(target) {
  const children = target.querySelectorAll('[data-scroll-reveal-child]');
  if (!children.length) {
    target.classList.add('is-revealed');
    return;
  }
  children.forEach((child, index) => {
    window.setTimeout(() => child.classList.add('is-revealed'), index * STAGGER_MS);
  });
  target.classList.add('is-revealed');
}

let scrollLockCount = 0;
let scrollLockOffset = 0;

/**
 * Locks page scroll behind an open overlay (drawer, modal) without the classic
 * "content jumps left because the scrollbar disappeared" glitch — compensates
 * with padding-right equal to the scrollbar's width. Reference-counted so
 * nested/overlapping overlays (e.g. a confirmation dialog opened from within a
 * drawer) don't unlock the page when only the inner one closes.
 */
export function lockScroll() {
  if (scrollLockCount === 0) {
    scrollLockOffset = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollLockOffset > 0) document.body.style.paddingRight = `${scrollLockOffset}px`;
  }
  scrollLockCount += 1;
}

export function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab focus within `container` and restores focus to whatever
 * was focused beforehand once released. Used by drawers, modals, and mega menu
 * in later milestones — implemented once here so every overlay behaves
 * identically (spec §5 focus-visible / keyboard-path requirements).
 *
 * @param {HTMLElement} container
 * @returns {{ activate: () => void, deactivate: () => void }}
 */
export function createFocusTrap(container) {
  let previouslyFocused = null;

  function getFocusable() {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null
    );
  }

  function handleKeydown(event) {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate() {
    previouslyFocused = document.activeElement;
    container.addEventListener('keydown', handleKeydown);
    const focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
  }

  function deactivate() {
    container.removeEventListener('keydown', handleKeydown);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  }

  return { activate, deactivate };
}
