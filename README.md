# Covid9-spread

![image](https://user-images.githubusercontent.com/10629150/80184635-3fb7e500-860b-11ea-92cc-4274cdd06554.png)

This project renders an animated map showing the spread of the pandemic, using latest data.

The interactive map is rendered using [OpenLayers](https://www.openlayers.org) v6.3.1.

Each country's death toll is rendered using a red circle. Codiv19 casualty data comes from the John Hopkins University. 

An overlay on the world map shows the countries population density (data from the World Bank)
in order to compare it to the pandemic trajectory.

Live example: https://jahow.github.io/covid19-spread/

To run the project locally:
```bash
$ npm run start
```

To rebuild the population density dataset, run:
```bash
$ node -r esm tools/generate-pop-density.js
```
