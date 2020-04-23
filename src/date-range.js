class DateRange extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.innerHTML = `
<div class="date-label"></div>
<input type="range" type="number" style="width: 100%"/>`;

    /**
     * @type {HTMLElement}
     */
    this.dateLabel = this.querySelector(".date-label");

    /**
     * @type {HTMLInputElement}
     */
    this.slider = this.querySelector("input[type=range]");

    this.minDate = 0;
    this.maxDate = 0;
    this.update();

    this.slider.addEventListener("change", this.update.bind(this));
    this.slider.addEventListener("input", this.update.bind(this));
  }

  get selectedDate() {
    return parseInt(this.slider.value);
  }

  update() {
    this.slider.min = this.minDate;
    this.slider.max = this.maxDate;
    this.dateLabel.innerText = new Date(this.selectedDate).toDateString();
  }

  setRange(minDate, maxDate) {
    this.minDate = minDate;

    this.maxDate = maxDate;

    this.update();
  }
}

customElements.define("date-range", DateRange);
