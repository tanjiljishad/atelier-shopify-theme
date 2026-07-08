/**
 * Progressive enhancement for snippets/tooltip.liquid. `:hover` and `:focus-within`
 * in theme.css already show the tooltip with zero JS — this script only adds what
 * CSS can't: tap-to-toggle for touch devices (which have no hover) and Escape to
 * dismiss. If this script fails to load, mouse and keyboard users are unaffected;
 * only touch users lose the tap-to-reveal interaction.
 */

export function initTooltips(root = document) {
  const tooltips = root.querySelectorAll('.tooltip');

  tooltips.forEach((tooltip) => {
    const trigger = tooltip.querySelector('.tooltip__trigger');
    const content = tooltip.querySelector('.tooltip__content');
    if (!trigger || !content) return;

    const show = () => content.classList.add('is-visible');
    const hide = () => content.classList.remove('is-visible');

    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      content.classList.toggle('is-visible');
    });
    tooltip.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hide();
    });
  });
}
