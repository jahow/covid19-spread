/**
 * @typedef {Object} LegendStyle
 * @property {string} label
 * @property {number} radius
 * @property {string} color
 * @property {string} borderColor
 * @property {number} border
 */

class LegendBlock extends HTMLElement {
  constructor() {
    super();
  }

  /**
   * @param {string} title
   * @param {'circle'|'square'} type
   * @param {string} attribution
   * @param {LegendStyle[]} styles
   */
  setStyles(title, type, attribution, styles) {
    this.innerHTML = `
<div style="font-weight: bold; font-size: 1.0em; margin-bottom: 0.5em">${title.toUpperCase()}</div>
<div style="display: flex; flex-direction: row; align-items: center; justify-content: space-evenly">
 ${styles
   .map(
     (s, i, a) => `
<div style="margin-right: ${i === a.length - 1 ? "0" : "1"}em">
  <div style="text-align: center; margin-bottom: 0.5em; font-size: 0.9em">${
    s.label
  }</div>
  <div style="margin: auto; border-style: solid; border-width: ${s.border ||
    0}px; border-color: ${s.borderColor || "white"}; border-radius: ${
       type === "circle" ? s.radius * 4 : 0
     }px; width: ${s.radius * 2}px; height: ${s.radius *
       2}px; background-color: ${s.color}">
  </div>
</div>`
   )
   .join("\n")}
</div>
<div style="font-size: 0.9em; text-align: right; margin-top: 0.5em">From: ${attribution}</div>`;
  }
}

customElements.define("legend-block", LegendBlock);
