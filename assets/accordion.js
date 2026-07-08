/**
 * <accordion-group> — progressive enhancement for one or more native
 * <details class="accordion-item"> children (snippets/accordion-item.liquid).
 *
 * Without this script, the <details>/<summary> elements still fully work —
 * instant (unanimated) open/close, correct semantics, keyboard support — since
 * that's all native browser behavior. This only adds:
 *   - an animated height transition for open/close (spec §5.4/§10)
 *   - optional "single-open" mode via the `single-open` attribute
 *
 * Markup contract:
 *   <accordion-group single-open>          <!-- single-open is optional -->
 *     <details class="accordion-item">...</details>
 *     <details class="accordion-item">...</details>
 *   </accordion-group>
 */
import { prefersReducedMotion } from './motion.js';

const DURATION = 300; // matches --dur-base
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

class AccordionGroup extends HTMLElement {
  connectedCallback() {
    this.items = Array.from(this.querySelectorAll(':scope > details.accordion-item'));
    this.items.forEach((item) => {
      const summary = item.querySelector(':scope > summary');
      if (!summary) return;
      summary.addEventListener('click', (event) => this.handleClick(event, item));
    });
  }

  handleClick(event, item) {
    event.preventDefault();
    if (item.hasAttribute('data-animating')) return;

    if (item.open) {
      this.collapse(item);
      return;
    }

    if (this.hasAttribute('single-open')) {
      this.items
        .filter((other) => other !== item && other.open && !other.hasAttribute('data-animating'))
        .forEach((other) => this.collapse(other));
    }
    this.expand(item);
  }

  expand(item) {
    const panel = item.querySelector(':scope > .accordion-item__panel');
    if (!panel) {
      item.open = true;
      return;
    }
    item.setAttribute('data-animating', '');
    item.open = true;
    this.animatePanel(panel, 0, panel.scrollHeight, () => {
      item.removeAttribute('data-animating');
    });
  }

  collapse(item) {
    const panel = item.querySelector(':scope > .accordion-item__panel');
    if (!panel) {
      item.open = false;
      return;
    }
    item.setAttribute('data-animating', '');
    this.animatePanel(panel, panel.scrollHeight, 0, () => {
      item.open = false;
      item.removeAttribute('data-animating');
    });
  }

  animatePanel(panel, startHeight, endHeight, onDone) {
    if (prefersReducedMotion() || typeof panel.animate !== 'function') {
      onDone();
      return;
    }
    panel.style.overflow = 'hidden';
    const animation = panel.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: DURATION, easing: EASING }
    );
    animation.onfinish = () => {
      panel.style.overflow = '';
      onDone();
    };
  }
}

customElements.define('accordion-group', AccordionGroup);
