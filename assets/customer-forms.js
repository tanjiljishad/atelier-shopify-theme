/**
 * Login/recover-password toggle (main-login.liquid) and password-visibility
 * toggles (login/register/reset/activate). Both forms are fully real and
 * visible without this script — it only makes the login page show one at a
 * time instead of both stacked, and adds a nicer eye-icon toggle over the
 * browser's own show-password affordance.
 */
export function initCustomerForms(root = document) {
  const loginForm = root.querySelector('[data-login-form]');
  const recoverForm = root.querySelector('[data-recover-form]');

  if (loginForm && recoverForm) {
    const showRecover = () => {
      loginForm.hidden = true;
      recoverForm.hidden = false;
      recoverForm.querySelector('input')?.focus();
    };
    const showLogin = () => {
      recoverForm.hidden = true;
      loginForm.hidden = false;
      loginForm.querySelector('input')?.focus();
    };

    // Only hide the recover form once JS confirms it can actually be
    // revealed again — a no-JS visitor keeps both real forms visible.
    // Stays visible after either an error *or* a successful submission
    // (i.e. Shopify just redirected back here with feedback to show) —
    // hiding it in the success case specifically would bury the "check
    // your email" message right after the visitor triggered it.
    const recoverHasFeedback = recoverForm.querySelector('.field__message--error, .field__message--success');
    if (!recoverHasFeedback) recoverForm.hidden = true;
    else loginForm.hidden = true;

    root.querySelectorAll('[data-show-recover]').forEach((btn) => btn.addEventListener('click', showRecover));
    root.querySelectorAll('[data-show-login]').forEach((btn) => btn.addEventListener('click', showLogin));
  }

  root.querySelectorAll('[data-password-toggle]').forEach((button) => {
    const input = button.previousElementSibling;
    if (!input || input.tagName !== 'INPUT') return;

    button.addEventListener('click', () => {
      const nowVisible = input.type === 'password';
      input.type = nowVisible ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(nowVisible));
    });
  });
}
