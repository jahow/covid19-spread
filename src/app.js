import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorImageLayer from "ol/layer/VectorImage";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Point from "ol/geom/Point";
import Circle from "ol/style/Circle";
import Stroke from "ol/style/Stroke";
import { defaults as defaultControls } from "ol/control";
import SelectInteraction from "ol/interaction/Select";
import { pointerMove } from "ol/events/condition";
import Overlay from "ol/Overlay";
import { combineLatest, Subject } from "rxjs";

let currentDate = 0;
function getCurrentCovidData(feature) {
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  const next = new Date(current);
  next.setHours(current.getHours() + 24);
  const isoDate0 = current.toISOString().substr(0, 10);
  const isoDate1 = next.toISOString().substr(0, 10);

  const value0 = feature.get(`data-${isoDate0}`) || 0;
  const value1 = feature.get(`data-${isoDate1}`) || 0;
  const ratio = (currentDate - current.valueOf()) / 86400000; // one day is 86400000ms
  return Math.round(value0 * (1 - ratio) + value1 * ratio);
}

function getRadiusForCovidCount(count) {
  return Math.sqrt(count) / 6;
}

const covidFillColor = "rgba(255,92,0,0.75)";
const covidStrokeColor = "rgba(255,218,206,0.4)";

const densityStyleCache = {};
const covidStyleCache = {};

function getDensityFillColor(density) {
  const alpha = Math.min(1, density / 400);
  return `rgba(51, 25, 120, ${alpha * 0.7})`;
}

function densityStyleFn(feature) {
  const key = feature.get("code");
  let style = densityStyleCache[key];

  if (!style) {
    style = new Style({
      fill: new Fill({
        color: "transparent"
      })
    });
    densityStyleCache[key] = style;
  }

  style.getFill().setColor(getDensityFillColor(feature.get("pop_density")));
  return style;
}

function covidStyleFn(feature) {
  const key = feature.get("id");
  let style = covidStyleCache[key];

  if (!style) {
    style = new Style({
      image: new Circle({
        fill: new Fill({
          color: covidFillColor
        }),
        stroke: new Stroke({
          color: covidStrokeColor,
          width: 2
        }),
        radius: 0
      })
    });
    covidStyleCache[key] = style;
  }

  const currentValue = getCurrentCovidData(feature);
  const radius = getRadiusForCovidCount(currentValue);
  style.getImage().setRadius(radius);
  const strokeWidth = Math.max(2, 10 - radius); // this is to insure a minimum circle size
  style
    .getImage()
    .getStroke()
    .setWidth(strokeWidth);
  return style;
}

export function init() {
  const density = new VectorImageLayer({
    imageRatio: 2,
    source: new VectorSource({
      attributions: "World Bank"
    }),
    style: densityStyleFn
  });

  const covidData = new VectorLayer({
    source: new VectorSource({
      attributions: "John Hopkins University"
    }),
    style: covidStyleFn
  });

  const view = new View({
    center: [0, 0],
    zoom: 1
  });
  const olMap = new Map({
    view,
    target: "map",
    layers: [
      new TileLayer({
        source: new XYZ({
          urls: [
            "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          ],
          crossOrigin: "anonymous"
        })
      }),
      density,
      covidData
    ],
    controls: defaultControls({ attribution: false })
  });

  const covidLegend = document.createElement("legend-block");
  covidLegend.setStyles(
    "Amount of death due to Covid19",
    "circle",
    "<a href='https://github.com/CSSEGISandData/COVID-19'>John Hopkins University</a>",
    [100, 1000, 4000, 10000, 40000].map(count => ({
      label: `${count.toLocaleString()} deaths`,
      color: covidFillColor,
      radius: getRadiusForCovidCount(count)
    }))
  );
  document.querySelector(".covid-legend").appendChild(covidLegend);

  const densityLegend = document.createElement("legend-block");
  densityLegend.setStyles(
    "Population density",
    "square",
    "<a href='https://datahub.io/world-bank/en.pop.dnst'>World Bank</a>",
    [0, 100, 200, 300, 400].map(density => ({
      label: `${density} per km²`,
      color: getDensityFillColor(density),
      radius: 12
    }))
  );
  document.querySelector(".density-legend").appendChild(densityLegend);

  const dateRange = document.createElement("date-range");
  document.querySelector(".date-slider-container").appendChild(dateRange);

  // react to date change
  dateRange.selectedDate$.subscribe(newDate => {
    currentDate = newDate;
    covidData.changed();
  });

  // add select interaction
  const popupInteraction = new SelectInteraction({
    layers: [covidData],
    condition: pointerMove,
    style: null
  });
  olMap.addInteraction(popupInteraction);
  let selected$ = new Subject();
  popupInteraction.on("select", evt => {
    if (!evt.selected.length) {
      popup.setPosition(null);
    } else {
      const feature = evt.selected[0];
      selected$.next(feature);
      popup.setPosition(feature.getGeometry().getFlatCoordinates());
    }
  });

  // popup
  const popupEl = document.createElement("div");
  popupEl.style.borderRadius = "4px";
  popupEl.style.width = "8em";
  popupEl.style.background = "white";
  popupEl.style.boxShadow = "0px 3px 4px rgba(0, 0, 0, 0.2)";
  popupEl.style.padding = "0.5em";
  popupEl.style.position = "absolute";
  popupEl.style.left = "0";
  popupEl.style.bottom = "1em";
  popupEl.style.transform = "translate(-50%, 0)";
  popupEl.style.pointerEvents = "none";
  const popup = new Overlay({
    element: popupEl
  });
  olMap.addOverlay(popup);
  combineLatest([selected$, dateRange.selectedDate$]).subscribe(
    ([selected]) => {
      popup.getElement().innerHTML = `
        <strong>${selected.get("country")}</strong><br>
        ${
          selected.get("region")
            ? `<small>${selected.get("region")}</small><br>`
            : ""
        }
        ${getCurrentCovidData(selected)} deaths
      `;
    }
  );

  // load map data
  fetch(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"
  )
    .then(response => response.text())
    .then(covidCsv => {
      const features = [];
      let prevIndex = covidCsv.indexOf("\n") + 1; // scan past the header line
      let curIndex;
      let lineIndex = 0;
      const timeseriesColumnStart = 4;
      const headers = covidCsv.substr(0, covidCsv.indexOf("\n")).split(",");

      function toIso(headerLabel) {
        const parts = /([0-9]+)\/([0-9]+)\/([0-9]+)/.exec(headerLabel);
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        return `20${parts[3]}-${month}-${day}`;
      }

      while ((curIndex = covidCsv.indexOf("\n", prevIndex)) !== -1) {
        const line = covidCsv
          .substr(prevIndex, curIndex - prevIndex)
          .split(",");
        prevIndex = curIndex + 1;

        const coords = fromLonLat([parseFloat(line[3]), parseFloat(line[2])]);
        if (
          isNaN(coords[0]) ||
          isNaN(coords[1]) ||
          (Math.abs(coords[0]) < 1 && Math.abs(coords[1] < 1))
        ) {
          // guard against bad data
          continue;
        }

        const f = new Feature({
          id: lineIndex++,
          country: line[1],
          region: line[0],
          geometry: new Point(coords)
        });
        for (let i = timeseriesColumnStart; i < line.length; i++) {
          f.set(`data-${toIso(headers[i])}`, line[i]);
        }
        features.push(f);
      }

      covidData.getSource().addFeatures(features);

      // init date range slider
      const firstDay = headers[timeseriesColumnStart];
      const lastDay = headers[headers.length - 1];

      dateRange.setRange(
        new Date(toIso(firstDay)).valueOf(),
        new Date(toIso(lastDay)).valueOf()
      );
    });

  fetch("countries.json")
    .then(response => response.json())
    .then(countries => {
      const densityFeatures = new GeoJSON().readFeatures(countries, {
        featureProjection: view.getProjection()
      });
      density.getSource().addFeatures(densityFeatures);
    });
}
