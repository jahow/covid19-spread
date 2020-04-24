/**
 * @typedef {Object} LegendStyle
 * @property {string} label
 * @property {number} radius
 * @property {string} color
 */

class LegendBlock extends HTMLElement {
  constructor() {
    super();
  }

  /**
   *
   * @param {LegendStyle[]} styles
   */
  setStyles(styles) {
    this.innerHTML = `
<div style="font-weight: bold; font-size: 1.2em; margin-bottom: 0.5em">Amount of death due to Covid19</div>
<div style="display: flex; flex-direction: row; align-items: center">
 ${styles
   .map(
     s => `<div style="margin-right: 1em">
  <div style="margin-bottom: 0.5em">${s.label}</div>
  <div style="margin: auto; border-radius: ${s.radius}px; width: ${s.radius * 2}px; height: ${s.radius * 2}px; background-color: ${s.color}"></div>
</div>`
   )
   .join("\n")}
</div>`;
  }
}

customElements.define("legend-block", LegendBlock);
