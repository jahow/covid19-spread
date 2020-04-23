import { BehaviorSubject } from "rxjs";

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
    this.slider.min = this.minDate;
    this.slider.max = this.maxDate;

    this.slider.addEventListener("change", this.handleDateChange.bind(this));
    this.slider.addEventListener("input", this.handleDateChange.bind(this));

    this.date$ = new BehaviorSubject(this.selectedDate);
  }

  get selectedDate() {
    return parseInt(this.slider.value);
  }

  get selectedDate$() {
    return this.date$;
  }

  handleDateChange() {
    this.dateLabel.innerText = new Date(this.selectedDate).toDateString();
    this.date$.next(this.selectedDate);
  }

  setRange(minDate, maxDate) {
    this.minDate = minDate;
    this.maxDate = maxDate;
    this.slider.min = this.minDate;
    this.slider.max = this.maxDate;
    this.handleDateChange();
  }
}

customElements.define("date-range", DateRange);
