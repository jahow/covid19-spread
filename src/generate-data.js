import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";

export function printCountriesGeoJSON() {
  Promise.all([
    fetch("/source-data/countries.json").then(response => response.json()),
    fetch("/source-data/country-density.json").then(response => response.json())
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

    console.log(new GeoJSON().writeFeatures(features));
  });
}
