import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import { printCountriesGeoJSON } from "./generate-data";
import Point from "ol/geom/Point";
import Circle from "ol/style/Circle";
import Stroke from "ol/style/Stroke";

let currentDate = 0;
function getCurrentIsoDate() {
  const date = new Date(currentDate);
  return date.toISOString().substr(0, 10);
}

const densityStyleCache = {};
const covidStyleCache = {};

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

  const alpha = Math.min(1, feature.get("pop_density") / 300);
  style.getFill().setColor(`rgba(51, 25, 120, ${alpha * 0.7})`);
  return [style];
}

function covidStyleFn(feature) {
  const key = feature.get("id");
  let style = covidStyleCache[key];

  if (!style) {
    style = new Style({
      image: new Circle({
        fill: new Fill({
          color: "rgba(255,92,0,0.75)"
        }),
        stroke: new Stroke({
          color: "rgba(255, 255, 255, 0.4)",
          width: 2
        }),
        radius: 0
      })
    });
    covidStyleCache[key] = style;
  }

  const currentValue = feature.get(`data-${getCurrentIsoDate()}`) || 0;
  const radius = Math.sqrt(currentValue) / 6;
  style.getImage().setRadius(radius);
  return [style];
}

export function init() {
  const density = new VectorLayer({
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
    ]
  });

  const dateRange = document.createElement("date-range");
  document.querySelector(".date-slider-container").appendChild(dateRange);

  // react to date change
  dateRange.date$.subscribe(newDate => {
    currentDate = newDate;
    covidData.changed();
  });

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

  fetch("/countries.json")
    .then(response => response.json())
    .then(countries => {
      const densityFeatures = new GeoJSON().readFeatures(countries, {
        featureProjection: view.getProjection()
      });
      density.getSource().addFeatures(densityFeatures);

      const covidFeatures = Object.keys(covidData).map(country => {});
    });
}
