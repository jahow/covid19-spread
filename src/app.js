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

  const radius = Math.sqrt(feature.get("latestCount")) / 6;
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

        features.push(
          new Feature({
            id: lineIndex++,
            country: line[1],
            region: line[0],
            geometry: new Point(coords),
            latestCount: line[line.length - 1]
          })
        );
      }

      covidData.getSource().addFeatures(features);

      // init date range slider
      const dateRange = document.createElement("date-range");
      document.querySelector(".date-slider-container").appendChild(dateRange);
      dateRange.setRange(new Date("2020-01-01").valueOf(), Date.now());
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
