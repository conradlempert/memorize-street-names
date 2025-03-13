import { useEffect, useState } from 'react'
import './App.css'
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
import { boundingExtent, getCenter } from "ol/extent";
import { getDistance } from "ol/sphere";
import cityData from "../data/potsdam.json";
import { Coordinate } from 'ol/coordinate';

type CityData = { [key: string]: number[][] };

// These should never be changed by user code, they are just cached for performance
let map: Map;
let features: CityData;
let street_layer: Vector | null;
let draw_layer: Vector | null;
let draw: Draw | null;
let map_layer_task: VectorTile;
let map_layer_solution: Tile;

function App() {
  
  const [initialized, set_initialized] = useState(false);
  const [mode, set_mode] = useState<"none" | "onMap" | "streetName">("none");
  const [street_name, set_street_name] = useState("");
  const [distance, set_distance] = useState(0);
  const [should_highlight_street, set_should_highlight_street] = useState(false);
  const [should_show_map_labels, set_should_show_map_labels] = useState(true);
  const [should_zoom_to_street, set_should_zoom_to_street] = useState(false);
  const [should_show_draw_layer, set_should_show_draw_layer] = useState(false);
  const [should_show_distance, set_should_show_distance] = useState(false);
  const [additional_zoom_points, set_additional_zoom_points] = useState<Coordinate[]>([]);
  const [street_name_input_content, set_street_name_input_content] = useState("");
  const [success_info_text, set_success_info_text] = useState("");

  useEffect(() => {
    if(!initialized) {
      initialize();
      set_initialized(true);
    }
    updateMapLayers();
    updateStreetLayer();
    updateDrawLayer();
    updateZoomLevel();
  });

  function initialize() {
    loadMap();
    loadData();
  }

  function loadMap(): void {
    if(map) return;
    document.getElementById("map")!.innerHTML = "";
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
  }
  function loadData(): void {
    features = cityData as CityData;
  }
  function updateStreetLayer(): void {
    if(street_layer) {
      map.removeLayer(street_layer);
      street_layer = null;
    }
    if(!should_highlight_street || !street_name) {
      return;
    }
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
    street_layer = new Vector({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 2,
          fill: new Fill({ color: "red" }),
        }),
      }),
    });
    map.addLayer(street_layer);
    zoomToStreet();
  }
  function zoomToStreet(): void {
    const street_features = [...features[street_name], ...additional_zoom_points];
    const transformed_points = street_features.map((f) => fromLonLat(f));
    const extent = boundingExtent(transformed_points);
    map.getView().fit(extent, { padding: [300, 300, 300, 300] });
  }
  function getRandomStreetName(): string {
    const street_names = Object.keys(features);
    let current_name: string;
    do { 
      current_name = street_names[Math.floor(Math.random() * street_names.length)];
    } while (features[current_name].length < 10);
    return current_name;
  }
  function nextTaskOnMap(): void {
    set_mode("onMap")
    set_street_name(getRandomStreetName());
    set_additional_zoom_points([]);
    set_should_show_map_labels(false);
    set_should_zoom_to_street(false);
    set_should_highlight_street(true);
    set_should_show_draw_layer(false);
    set_street_name_input_content("");
    set_success_info_text("");
    set_should_show_distance(false);
  }
  function nextTaskStreetName(): void {
    set_mode("streetName");
    set_street_name(getRandomStreetName());
    set_should_show_map_labels(false);
    set_additional_zoom_points([]);
    set_should_zoom_to_street(false);
    set_should_highlight_street(false);
    set_should_show_draw_layer(true);
    set_should_show_distance(false);
  }
  function updateDrawLayer() {
    if(draw) {
      map.removeInteraction(draw);
      draw = null;
    }
    if(draw_layer) {
      map.removeLayer(draw_layer);
      draw_layer = null;
    }
    if(!should_show_draw_layer) {
      return;
    }
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
    draw = new Draw({
      source: draw_source,
      type: "Point",
    });
    draw.on("drawend", (e) => {
      const feature_coords = getCenter(e.feature.getGeometry()!.getExtent());
      const feature_lonlat = transform(feature_coords, "EPSG:3857", "EPSG:4326");
      const street_features = features[street_name];
      const distances = street_features.map((f) => {
        return getDistance(f, feature_lonlat);
      });
      const min = Math.min(...distances);
      set_distance(min);
      set_should_show_distance(true);
      set_should_show_map_labels(true);
      set_should_zoom_to_street(false);
      set_should_highlight_street(true);
      set_additional_zoom_points([feature_lonlat]);
    });
    map.addInteraction(draw);
    map.addLayer(draw_layer);
  }
  function submitstreetname(): void {
    if (street_name.toLowerCase() === street_name_input_content.toLowerCase()) {
      set_success_info_text("correct :)");
    } else {
      set_success_info_text("wrong, it was " + street_name);
    }
    set_should_show_map_labels(true);
  }

  function updateZoomLevel(): void {
    if(should_zoom_to_street) {
      zoomToStreet();
    } else {
      zoomToPdm();
    }
  }

  function updateMapLayers(): void {
    if(should_show_map_labels) {
      map_layer_solution.setVisible(true);
      map_layer_task.setVisible(false);
    } else {
      map_layer_solution.setVisible(false);
      map_layer_task.setVisible(true);
    }
  }

  document.onkeyup = (ev: KeyboardEvent): void => {
    if (ev.key === "Enter") {
      submitstreetname();
    }
  };
  function zoomToPdm(): void {
    map.setView(
      new View({
        center: fromLonLat([13.0702085, 52.4]),
        zoom: 12.5,
      })
    );
  }

  return (
    <div className='container'>
      <h1 className='mt-4 mb-4'>Memorize street names</h1>
      <div className='btn-toolbar'>
        <div className="btn-group mr-2" role="group">
          <button type="button" className="btn btn-outline-secondary" onClick={nextTaskOnMap}>Next task (on map)</button>
        </div>
        <div className="btn-group mr-2" role="group">
          <button type="button" className="btn btn-outline-secondary" onClick={nextTaskStreetName}>Next task (street name)</button>
        </div>
        {(mode === "onMap") && (
          <div className="input-group">
            <input type="text" className="form-control" value={street_name_input_content} onChange={(e) => set_street_name_input_content(e.target.value)} placeholder="Enter street name" />
            <div className="input-group-append">
              <button onClick={submitstreetname} className="btn btn-outline-secondary btn-append" type="button">ok</button>
            </div>
            <p>{success_info_text}</p>
          </div>
        )}
        {(mode === "streetName") && (
          <div id="elementsStreetName">
            <span className="btn-group mr-2">{street_name} (click on map!)</span>
            <span className="btn-group mr-2">{should_show_distance ? distance.toFixed(0) + "m" : ""}</span>
          </div>
        )}
      </div>
      <div id="map" className="map"></div><br/>
    </div>
  )
}

export default App
