/**
 * Global toast (spec §5.6: "bottom-center chip, ink fill/ivory text, 300ms
 * rise, auto-dismiss 4s, action link optional... aria-live"). One shared
 * container (#AtelierToast, rendered once in layout/theme.liquid) and one
 * function every add-to-cart flow calls — quick-add.js, product-form.js,
 * complete-the-look.js — rather than each building its own toast markup.
 * Complements each button's own inline "Added ✓" feedback; doesn't replace
 * it, since the toast's job is a page-level "go to cart" affordance
 * (spec: "Added — View cart"), not the button-level confirmation.
 */
const DISMISS_MS = 4000;
let dismissTimer = null;

/**
 * @param {object} options
 * @param {string} options.message
 * @param {string} [options.actionText]
 * @param {string} [options.actionUrl]
 */
export function showToast({ message, actionText, actionUrl }) {
  const container = document.getElementById('AtelierToast');
  if (!container) return;

  window.clearTimeout(dismissTimer);

  const actionHtml =
    actionText && actionUrl
      ? `<a href="${escapeAttribute(actionUrl)}" class="toast__action">${escapeHtml(actionText)}</a>`
      : '';

  container.innerHTML = `<div class="toast" role="status">
    <span class="toast__message">${escapeHtml(message)}</span>
    ${actionHtml}
  </div>`;

  const toast = container.querySelector('.toast');
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  dismissTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => {
      container.innerHTML = '';
    }, 300);
  }, DISMISS_MS);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
