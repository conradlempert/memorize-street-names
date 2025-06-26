"use client";

import { useEffect, useState } from 'react'
import './globals.css'
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
import { getCenter } from "ol/extent";
import { getDistance } from "ol/sphere";
import cityData from "../../public/potsdam.json";
import createMapboxStreetsV6Style from "./createMapboxStyle";
import { CityData } from '../../public/convertGeojsonToJson';

// These should never be changed by user code, they are just cached for performance
let map: Map;
let features: CityData;
let street_layer: Vector | null;
let draw_layer: Vector | null;
let draw: Draw | null;
let map_layer_task: VectorTile;
let map_layer_solution: Tile;

export default function Home() {
  
  const [initialized, set_initialized] = useState(false);
  const [mode, set_mode] = useState<"none" | "onMap" | "streetName">("streetName");
  const [street_name, set_street_name] = useState("");
  const [distance, set_distance] = useState(0);
  const [should_highlight_street, set_should_highlight_street] = useState(false);
  const [should_show_map_labels, set_should_show_map_labels] = useState(true);
  const [should_show_draw_layer, set_should_show_draw_layer] = useState(false);
  const [should_show_distance, set_should_show_distance] = useState(false);
  const [street_name_input_content, set_street_name_input_content] = useState("");
  const [success_info_text, set_success_info_text] = useState("");
  const [success_value, set_success_value] = useState(-1);

  useEffect(() => {
    if(!initialized) {
      initialize();
      set_initialized(true);
    }
    updateMapLayers();
    updateStreetLayer();
    updateDrawLayer();
    updateSuccessColor();
  });

  function initialize() {
    loadMap();
    loadData();
    nextTaskStreetName();
    document.onkeyup = (ev: KeyboardEvent): void => {
      if (ev.key === "Enter") {
        submitstreetname();
      }
    };
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
      style: createMapboxStreetsV6Style(),
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
    set_should_show_map_labels(false);
    set_should_highlight_street(true);
    set_should_show_draw_layer(false);
    set_street_name_input_content("");
    set_success_info_text("");
    set_success_value(-1);
    set_should_show_distance(false);
    zoomToPdm();
  }
  function nextTaskStreetName(): void {
    set_mode("streetName");
    set_street_name(getRandomStreetName());
    set_should_show_map_labels(false);
    set_should_highlight_street(false);
    set_should_show_draw_layer(true);
    set_success_value(-1);
    set_should_show_distance(false);
    zoomToPdm();
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
    const draw_source = new VectorSource({ wrapX: false });
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
      set_should_highlight_street(true);
      if(min < 100) {
        set_success_value(1);
      } else {
        set_success_value(1-(min - 100)/1000);
      }
    });
    map.addInteraction(draw);
    map.addLayer(draw_layer);
  }
  function submitstreetname(): void {
    if (street_name.toLowerCase() === street_name_input_content.toLowerCase()) {
      set_success_info_text("Correct!");
      set_success_value(1);
    } else {
      set_success_info_text("Wrong, it was " + street_name + ".");
      set_success_value(0);
    }
    set_should_show_map_labels(true);
  }

  function updateSuccessColor() {
    let color: string;
    if(success_value === -1) {
      color = "white";
    } else {
      if(success_value > 0.8) {
        color = "lightgreen";
      }
      else if(success_value > 0.5) {
        color = "#EEEE90";
      }
      else {
        color = "#EE9090";
      }
    }
    document.getElementsByTagName("body")[0].style.backgroundColor = color;
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

  function zoomToPdm(): void {
    map.setView(
      new View({
        center: fromLonLat([13.0702085, 52.4]),
        zoom: 12.5,
      })
    );
  }

  return (
    <div className='px-20 py-8 w-dvw h-dvh'>
      {(mode === "onMap") && (
          <div className='mb-4'>
            <input className='text-4xl mr-2 border-b-2 border-gray-200' type="text" value={street_name_input_content} onChange={(e) => set_street_name_input_content(e.target.value)} placeholder="Enter street name" />
            <button onClick={submitstreetname} className="bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer" type="button">ok</button>
            <span className='text-4xl ml-4 font-bold'>{success_info_text}</span>
          </div>
        )}
        {(mode === "streetName") && (
          <div className='text-4xl mb-4'>
            Click <b>{street_name}</b> on the map!&nbsp;
            {(should_show_distance && (
              <span>
                Distance:&nbsp;
                <b>{distance.toFixed(0) + "m"}</b>
              </span>
            ))}
          </div>
        )}
      
      <div className='mt-8 mb-4'>
          <button type="button" className="bg-transparent hover:bg-black hover:text-white py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer" onClick={nextTaskStreetName}>Next task (street name)</button>
          <button type="button" className="bg-transparent hover:bg-black hover:text-white py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer" onClick={nextTaskOnMap}>Next task (on map)</button>
      </div>
      <div id="map" className="w-full h-[calc(100%-9rem)] mt-5"></div><br/>
    </div>
  )
}
