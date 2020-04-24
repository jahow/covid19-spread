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
   * @param {string} title
   * @param {'circle'|'square'} type
   * @param {LegendStyle[]} styles
   */
  setStyles(title, type, styles) {
    this.innerHTML = `
<div style="font-weight: bold; font-size: 1.2em; margin-bottom: 0.5em">${title}</div>
<div style="display: flex; flex-direction: row; align-items: center">
 ${styles
   .map(
     s => `<div style="margin-right: 1em">
  <div style="margin-bottom: 0.5em; font-size: 0.9em">${s.label}</div>
  <div style="margin: auto; border-radius: ${
    type === "circle" ? s.radius : 0
  }px; width: ${s.radius * 2}px; height: ${s.radius * 2}px; background-color: ${
       s.color
     }"></div>
</div>`
   )
   .join("\n")}
</div>`;
  }
}

customElements.define("legend-block", LegendBlock);
