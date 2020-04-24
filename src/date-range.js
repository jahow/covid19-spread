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
<div class="date-label" style="font-size: 1.2em; margin-bottom: 0.5em"></div>
<input type="range" type="number" style="display: block; width: 100%"/>
<div style="margin-top: 0.5em">
  <button type="button" class="play" style="font-size: 1.1em;">
    Animate
  </button>
  <button type="button" class="pause" style="font-size: 1.1em; display: none">
    Pause
  </button>
</div>`;

    /**
     * @type {HTMLElement}
     */
    this.dateLabel = this.querySelector(".date-label");

    /**
     * @type {HTMLInputElement}
     */
    this.slider = this.querySelector("input[type=range]");

    /**
     * @type {HTMLButtonElement}
     */
    this.playButton = this.querySelector("button.play");

    /**
     * @type {HTMLButtonElement}
     */
    this.pauseButton = this.querySelector("button.pause");

    this.minDate = 0;
    this.maxDate = 0;
    this.slider.min = this.minDate;
    this.slider.max = this.maxDate;

    this.slider.addEventListener("change", this.handleDateChange.bind(this));
    this.slider.addEventListener("input", this.handleDateChange.bind(this));

    this.date$ = new BehaviorSubject(this.selectedDate);

    this.playing = false;
    this.prevTimestamp = null;
    this.playButton.addEventListener("click", this.startAnimation.bind(this));
    this.pauseButton.addEventListener("click", this.stopAnimation.bind(this));
  }

  get selectedDate() {
    return parseInt(this.slider.value);
  }

  set selectedDate(value) {
    this.slider.value = value;
    this.handleDateChange();
  }

  get selectedDate$() {
    return this.date$;
  }

  get isMaxValue() {
    return this.selectedDate === this.maxDate;
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

  startAnimation() {
    this.playButton.style.display = "none";
    this.pauseButton.style.display = "initial";
    if (this.isMaxValue) {
      this.selectedDate = this.minDate;
    }
    this.playing = true;
    this.prevTimestamp = null;
    requestAnimationFrame(this.animationLoop.bind(this));
  }

  stopAnimation() {
    this.playButton.style.display = "initial";
    this.pauseButton.style.display = "none";
    this.playing = false;
  }

  animationLoop(timestamp) {
    if (this.prevTimestamp) {
      const hoursRatio = 80.121345; // how many hours in one second
      const date = new Date(this.selectedDate);
      date.setHours(
        date.getHours() + (timestamp - this.prevTimestamp) * hoursRatio * 0.001
      );
      this.selectedDate = date.valueOf();
      if (this.isMaxValue) {
        this.stopAnimation();
      }
    }
    this.prevTimestamp = timestamp;
    if (this.playing) {
      requestAnimationFrame(this.animationLoop.bind(this));
    }
  }
}

customElements.define("date-range", DateRange);
