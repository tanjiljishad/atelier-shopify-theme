/**
 * <quantity-input> — progressive enhancement for snippets/quantity-input.liquid.
 * Without this script the native number input still works (typing, native
 * spin buttons, min/max validation); this only adds the custom −/+ buttons,
 * long-press repeat, and a `quantity-change` event for consumers to listen to.
 */

const LONG_PRESS_DELAY = 500;
const LONG_PRESS_INTERVAL = 150;

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('.quantity-input__value');
    this.decreaseButton = this.querySelector('.quantity-input__button--decrease');
    this.increaseButton = this.querySelector('.quantity-input__button--increase');
    if (!this.input || !this.decreaseButton || !this.increaseButton) return;

    this.decreaseButton.addEventListener('click', () => this.step(-1));
    this.increaseButton.addEventListener('click', () => this.step(1));
    this.attachLongPress(this.decreaseButton, -1);
    this.attachLongPress(this.increaseButton, 1);
    this.input.addEventListener('change', () => this.clamp());

    this.updateButtonStates();
  }

  attachLongPress(button, direction) {
    let timeoutId;
    let intervalId;

    const start = (event) => {
      if (event.type === 'mousedown' && event.button !== 0) return;
      timeoutId = window.setTimeout(() => {
        intervalId = window.setInterval(() => this.step(direction), LONG_PRESS_INTERVAL);
      }, LONG_PRESS_DELAY);
    };

    const stop = () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };

    button.addEventListener('mousedown', start);
    button.addEventListener('touchstart', start, { passive: true });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((type) =>
      button.addEventListener(type, stop)
    );
  }

  step(direction) {
    const current = Number.parseInt(this.input.value, 10) || 0;
    this.input.value = String(current + direction);
    this.clamp();
  }

  clamp() {
    const min = Number.parseInt(this.getAttribute('min'), 10);
    const max = this.hasAttribute('max') ? Number.parseInt(this.getAttribute('max'), 10) : null;
    let value = Number.parseInt(this.input.value, 10);

    if (Number.isNaN(value)) value = min;
    if (!Number.isNaN(min) && value < min) value = min;
    if (max !== null && !Number.isNaN(max) && value > max) value = max;

    this.input.value = String(value);
    this.updateButtonStates();
    this.dispatchEvent(new CustomEvent('quantity-change', { bubbles: true, detail: { value } }));
  }

  updateButtonStates() {
    const min = Number.parseInt(this.getAttribute('min'), 10);
    const max = this.hasAttribute('max') ? Number.parseInt(this.getAttribute('max'), 10) : null;
    const value = Number.parseInt(this.input.value, 10);

    this.decreaseButton.disabled = !Number.isNaN(min) && value <= min;
    this.increaseButton.disabled = max !== null && !Number.isNaN(max) && value >= max;
  }
}

customElements.define('quantity-input', QuantityInput);
