import GeoJSON from "ol/format/GeoJSON.js";
import Feature from "ol/Feature.js";
import path from "path";
import fs from "fs";

function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, file) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(file);
    });
  });
}

function getCountriesGeoJSON() {
  const dataDir = path.resolve(__dirname, "source-data");
  return Promise.all([
    readFilePromise(path.resolve(dataDir, "countries.json")).then(response =>
      JSON.parse(response)
    ),
    readFilePromise(
      path.resolve(dataDir, "country-density.json")
    ).then(response => JSON.parse(response))
  ]).then(([countries, densities]) => {
    const densityByCode = {};
    densities.forEach(country => {
      densityByCode[country["Country Code"]] = country;
    });

    const features = new GeoJSON()
      .readFeatures(countries)
      .filter(sourceFeature => {
        const data = densityByCode[sourceFeature.get("adm0_a3")];
        if (!data) {
          console.log("data missing for", sourceFeature.get("name"));
          return false;
        }
        return true;
      })
      .map(sourceFeature => {
        const f = new Feature({
          geometry: sourceFeature.getGeometry()
        });
        const data = densityByCode[sourceFeature.get("adm0_a3")];
        f.set("pop_density", data["Value"] || 0);
        f.set("name", sourceFeature.get("name"));
        f.set("code", sourceFeature.get("adm0_a3"));

        const center =
          f.getGeometry().getType() === "MultiPolygon"
            ? f
                .getGeometry()
                .getInteriorPoints()
                .getPoint(0)
            : f.getGeometry().getInteriorPoint();
        f.set("lat", center.getCoordinates()[1]);
        f.set("lon", center.getCoordinates()[0]);

        return f;
      });

    return new GeoJSON().writeFeatures(features);
  });
}

getCountriesGeoJSON().then(geojson => {
  const filePath = path.resolve(__dirname, "../public/countries.json");
  fs.writeFile(filePath, geojson, { flag: "w" }, err => {
    if (err) {
      console.error(err);
    } else {
      console.log("Dataset successfully recreated");
    }
  });
});
