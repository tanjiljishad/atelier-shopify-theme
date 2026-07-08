/**
 * <tab-group> — implements the WAI-ARIA APG tabs pattern (automatic activation)
 * plus the sliding underline indicator (spec §5.4).
 *
 * Expected markup contract (built by whichever section/snippet uses tabs —
 * intentionally not templated here since real tab content is always bespoke):
 *
 *   <tab-group>
 *     <div role="tablist" aria-label="...">
 *       <button role="tab" id="tab-1" aria-controls="panel-1" aria-selected="true">Label</button>
 *       <button role="tab" id="tab-2" aria-controls="panel-2" aria-selected="false">Label</button>
 *     </div>
 *     <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>
 *     <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>...</div>
 *   </tab-group>
 *
 * Without this script the tabs are inert buttons (no panel switching) — tabs
 * have no meaningful native fallback, unlike the accordion/tooltip, so any
 * section using this component should keep tab content short enough that it
 * doesn't matter much if JS fails to load.
 */

class TabGroup extends HTMLElement {
  connectedCallback() {
    this.tablist = this.querySelector('[role="tablist"]');
    this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));
    if (!this.tablist || !this.tabs.length) return;

    this.indicator = document.createElement('span');
    this.indicator.className = 'tab-group__indicator';
    this.indicator.setAttribute('aria-hidden', 'true');
    this.tablist.append(this.indicator);

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.activate(index));
      tab.addEventListener('keydown', (event) => this.handleKeydown(event, index));
    });

    const initialIndex = Math.max(
      this.tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
      0
    );
    this.activate(initialIndex);
    window.addEventListener('resize', () => this.positionIndicator(this.activeIndex));
  }

  handleKeydown(event, index) {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % this.tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = this.tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    this.activate(nextIndex);
    this.tabs[nextIndex].focus();
  }

  activate(index) {
    this.activeIndex = index;
    this.tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
    this.panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    this.positionIndicator(index);
  }

  positionIndicator(index) {
    const tab = this.tabs[index];
    if (!tab || !this.indicator) return;
    this.indicator.style.width = `${tab.offsetWidth}px`;
    this.indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  }
}

customElements.define('tab-group', TabGroup);
