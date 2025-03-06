import { fromLonLat, transform } from "ol/proj";
import { Style, Fill, Circle } from "ol/style";
import { Feature, Map, View } from "ol";
import { Point } from "ol/geom";
import { Vector, VectorTile, Tile } from "ol/layer";
import {
  Vector as VectorSource,
  VectorTile as VectorTileSource,
  OSM,
} from "ol/source";
import { MVT } from "ol/format";
import { Draw } from "ol/interaction";
import { boundingExtent } from "ol/extent";
import { getDistance } from "ol/sphere";
import cityData from "../data/potsdam.json";

type CityData = { [key: string]: number[][] };

let map: Map;
let features: CityData;
let street_name: string;
let current_layer: Vector;
let draw_layer: Vector;
let map_layer_task: VectorTile;
let map_layer_solution: Tile;

document.getElementById("nextTaskOnMap")!.onclick = nextTaskOnMap;
document.getElementById("nextTaskStreetName")!.onclick = nextTaskStreetName;
document.getElementById("submitStreetName")!.onclick = submitstreetname;

function loadMap(): void {
  map_layer_task = new VectorTile({
    declutter: true,
    source: new VectorTileSource({
      attributions:
        '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
        '© <a href="https://www.openstreetmap.org/copyright">' +
        "OpenStreetMap contributors</a>",
      format: new MVT(),
      url:
        "https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/" +
        "{z}/{x}/{y}.vector.pbf?access_token=" +
        "pk.eyJ1IjoiY2xuZXh1cyIsImEiOiJjajMyNHJzb24wMGE4MzJudTk4b3loaWVlIn0.C5EK2wZ72uTyskjsYjOsTQ",
    }),
  });
  map_layer_solution = new Tile({
    source: new OSM(),
  });
  map = new Map({
    target: "map",
    layers: [map_layer_solution, map_layer_task],
    view: new View({
      center: fromLonLat([13.0702085, 52.41924]),
      zoom: 12,
    }),
  });
  map_layer_task.setVisible(false);
}
function loadData(): void {
  features = cityData as CityData;
}
function showStreet(): void {
  const street_features = features[street_name];
  const street = [];
  for (const feature of street_features) {
    street.push(
      new Feature({
        geometry: new Point(fromLonLat(feature)),
      })
    );
  }
  // create the source and layer for random features
  const vectorSource = new VectorSource({
    features: street,
  });
  current_layer = new Vector({
    source: vectorSource,
    style: new Style({
      image: new Circle({
        radius: 2,
        fill: new Fill({ color: "red" }),
      }),
    }),
  });
  map.addLayer(current_layer);
  zoomToStreet();
}
function zoomToStreet(additionalPoints?: any[]): void {
  const extraPoints = additionalPoints ? additionalPoints : [];
  const street_features = [...features[street_name], ...extraPoints];
  const transformed_points = street_features.map((f) => fromLonLat(f));
  const extent = boundingExtent(transformed_points);
  map.getView().fit(extent, { padding: [300, 300, 300, 300] });
}
function getRandomStreetName(): string {
  const street_names = Object.keys(features);
  return street_names[Math.floor(Math.random() * street_names.length)];
}
function nextTaskOnMap(): void {
  map_layer_task.setVisible(true);
  map_layer_solution.setVisible(false);
  map.removeLayer(current_layer);
  (document.getElementById("streetnameinput")! as HTMLInputElement).value = "";
  document.getElementById("info")!.innerHTML = "";
  document.getElementById("elementsOnMap")!.style.display = "block";
  document.getElementById("elementsStreetName")!.style.display = "none";
  street_name = getRandomStreetName();
  showStreet();
}
function nextTaskStreetName(): void {
  zoomToPdm();
  map_layer_task.setVisible(true);
  map_layer_solution.setVisible(false);
  map.removeLayer(current_layer);
  document.getElementById("elementsOnMap")!.style.display = "none";
  document.getElementById("elementsStreetName")!.style.display = "block";
  street_name = getRandomStreetName();
  document.getElementById("street_name")!.innerHTML = street_name;
  map.removeLayer(draw_layer);
  var draw_source = new VectorSource({ wrapX: false });
  draw_layer = new Vector({
    source: draw_source,
    style: new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({ color: "blue" }),
      }),
    }),
  });
  const draw = new Draw({
    source: draw_source,
    type: "Point",
  });
  draw.on("drawend", (e) => {
    const feature_coords = e.feature.getGeometry()!.getCoordinates();
    const feature_lonlat = transform(feature_coords, "EPSG:3857", "EPSG:4326");
    const street_features = features[street_name];
    const distances = street_features.map((f) => {
      return getDistance(f, feature_lonlat);
    });
    const min = Math.min(...distances);
    document.getElementById("distance")!.innerHTML = min.toFixed(0) + "m";
    map_layer_task.setVisible(false);
    map_layer_solution.setVisible(true);
    showStreet();
    zoomToStreet([feature_lonlat]);
    map.removeInteraction(draw);
  });
  map.addInteraction(draw);
  map.addLayer(draw_layer);
}
function submitstreetname(): void {
  if (
    street_name.toLowerCase() ===
    (
      document.getElementById("streetnameinput")! as HTMLInputElement
    ).value.toLowerCase()
  ) {
    document.getElementById("info")!.innerHTML = "correct :)";
  } else {
    document.getElementById("info")!.innerHTML = "wrong, it was " + street_name;
  }
  map_layer_task.setVisible(false);
  map_layer_solution.setVisible(true);
}

document.onkeyup = (ev: KeyboardEvent): void => {
  if (ev.key === "Enter") {
    submitstreetname();
  }
};
function zoomToPdm(): void {
  map.setView(
    new View({
      center: fromLonLat([13.0702085, 52.41924]),
      zoom: 12,
    })
  );
}

loadMap();
loadData();
