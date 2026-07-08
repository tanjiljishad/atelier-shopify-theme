/**
 * Hero video pause/play control (spec §5.5: "pause control bottom-right
 * (a11y)"). This is the only JS the hero needs — Ken-Burns is pure CSS
 * (animation gated off via prefers-reduced-motion and .performance-mode
 * selectors directly in theme.css, no JS required to disable it).
 */
export function initHeroVideoControls(root = document) {
  root.querySelectorAll('[data-hero]').forEach((hero) => {
    const video = hero.querySelector('[data-hero-video]');
    const toggle = hero.querySelector('[data-hero-video-toggle]');
    if (!video || !toggle) return;

    toggle.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        toggle.setAttribute('aria-pressed', 'false');
        toggle.innerHTML = '';
        toggle.appendChild(iconUse('pause'));
      } else {
        video.pause();
        toggle.setAttribute('aria-pressed', 'true');
        toggle.innerHTML = '';
        toggle.appendChild(iconUse('play'));
      }
    });
  });
}

function iconUse(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.appendChild(use);
  return svg;
}
