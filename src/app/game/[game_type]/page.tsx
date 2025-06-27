"use client";

import { useEffect, useRef, useState } from 'react'
import '../../globals.css'
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
import cityData from "../../../../public/potsdam.json";
import createMapboxStreetsV6Style from "../createMapboxStyle";
import { CityData } from '../../../../public/convertGeojsonToJson';
import { useParams, useRouter } from 'next/navigation';
import { useScoreStore } from '@/app/scoreStore';

// These should never be changed by user code, they are just cached for performance
const features: CityData = cityData as CityData;
let street_layer: Vector | null;
let draw_layer: Vector | null;
let draw: Draw | null;
let map_layer_task: VectorTile;
let map_layer_solution: Tile;

export default function Game() {
  const params = useParams<{ game_type: "free" | "nameTheStreet" | "pointToStreet" }>();
  const game_type = params.game_type || "free";
  const [score, set_score] = useState(0);
  const [rounds_played, set_rounds_played] = useState(0);
  const [mode, set_mode] = useState<"none" | "nameTheStreet" | "pointToStreet">("pointToStreet");
  const [street_name, set_street_name] = useState("");
  const [distance, set_distance] = useState(0);
  const [should_highlight_street, set_should_highlight_street] = useState(false);
  const [should_show_draw_layer, set_should_show_draw_layer] = useState(false);
  const [street_name_input_content, set_street_name_input_content] = useState("");
  const [success_info_text, set_success_info_text] = useState("");
  const [success_value, set_success_value] = useState(-1);
  const [should_show_solution, set_should_show_solution] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const setGlobalScore = useScoreStore(((state) => state.setScore));
  const router = useRouter();

  useEffect(() => {
    loadMap();
    startGame();
  }, []);

  useEffect(() => {
    setGlobalScore(score);
    if(rounds_played === 10) {
      router.push("/endscreen");
      return;
    }
    updateMapLayers();
    updateStreetLayer();
    updateDrawLayer();
    updateSuccessColor();
  });


  function startGame() {
    switch(game_type) {
      case "nameTheStreet":
        set_mode("nameTheStreet");
        nextTaskNameTheStreet();
        break;
      case "pointToStreet":
        set_mode("pointToStreet");
        nextTaskPointToStreet();
        break;
      case "free":
        set_mode("pointToStreet");
        nextTaskPointToStreet();
        break;
    }
  }

  function loadMap(): void {
    if(mapInstance.current || !mapRef.current) return;

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
    mapInstance.current = new Map({
      target: mapRef.current!,
      layers: [map_layer_solution, map_layer_task],
      view: new View({
        center: fromLonLat([13.0702085, 52.41924]),
        zoom: 12,
      }),
    });

    document.onkeyup = (ev: KeyboardEvent): void => {
      if (ev.key === "Enter") {
        submitstreetname();
      }
    };

    // Trigger resize after mount
    setTimeout(() => {
      mapInstance.current?.updateSize();
    }, 100);

  }
  function updateStreetLayer(): void {
    if(street_layer) {
      mapInstance.current!.removeLayer(street_layer);
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
    mapInstance.current!.addLayer(street_layer);
  }
  function getRandomStreetName(): string {
    const street_names = Object.keys(features);
    let current_name: string;
    do { 
      current_name = street_names[Math.floor(Math.random() * street_names.length)];
    } while (features[current_name].length < 10);
    return current_name;
  }
  function nextTaskNameTheStreet(): void {
    set_mode("nameTheStreet")
    set_street_name(getRandomStreetName());
    set_should_highlight_street(true);
    set_should_show_draw_layer(false);
    set_street_name_input_content("");
    set_success_info_text("");
    set_success_value(-1);
    set_should_show_solution(false);
    zoomToPdm();
  }
  function nextTaskPointToStreet(): void {
    set_mode("pointToStreet");
    set_street_name(getRandomStreetName());
    set_should_highlight_street(false);
    set_should_show_draw_layer(true);
    set_success_value(-1);
    set_should_show_solution(false);
    zoomToPdm();
  }
  function updateDrawLayer() {
    if(!mapInstance.current) return;
    if(draw) {
      mapInstance.current!.removeInteraction(draw);
      draw = null;
    }
    if(draw_layer) {
      mapInstance.current!.removeLayer(draw_layer);
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
      if(should_show_solution && game_type === "pointToStreet") {
        // next task in scored point to street game
        nextTaskPointToStreet();
      } else {
        // show the distance to the solution
        const feature_coords = getCenter(e.feature.getGeometry()!.getExtent());
        const feature_lonlat = transform(feature_coords, "EPSG:3857", "EPSG:4326");
        const street_features = features[street_name];
        const distances = street_features.map((f) => {
          return getDistance(f, feature_lonlat);
        });
        const min = Math.min(...distances);
        set_distance(min);
        set_should_show_solution(true);
        set_should_highlight_street(true);
        set_rounds_played(rounds_played + 1);
        const scoreThisRound = Math.max(0, min < 100 ? 1 : 1-(min - 100)/1000);
        set_success_value(scoreThisRound);
        set_score(score + Math.round(scoreThisRound * 100));
      }
    });
    mapInstance.current!.addInteraction(draw);
    mapInstance.current!.addLayer(draw_layer);
  }
  function submitstreetname(): void {
    if(should_show_solution && game_type === "nameTheStreet") {
      // next task in scored name the street game
      nextTaskNameTheStreet();
      return;
    }
    if (street_name.toLowerCase() === street_name_input_content.toLowerCase()) {
      set_success_info_text("Correct!");
      set_success_value(1);
      set_score(score + 100);
    } else {
      set_success_info_text("Wrong, it was " + street_name + ".");
      set_success_value(0);
    }
    set_rounds_played(rounds_played + 1);
    set_should_show_solution(true);
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
    if(should_show_solution) {
      map_layer_solution.setVisible(true);
      map_layer_task.setVisible(false);
    } else {
      map_layer_solution.setVisible(false);
      map_layer_task.setVisible(true);
    }
  }

  function zoomToPdm(): void {
    mapInstance.current!.setView(
      new View({
        center: fromLonLat([13.0702085, 52.4]),
        zoom: 12.5,
      })
    );
  }

  return (
    <div className='px-20 py-8 w-dvw h-dvh'>
      {(mode === "nameTheStreet") && (
          <div className='mb-4'>
            <input className='text-4xl mr-2 border-b-2 border-gray-200' type="text" value={street_name_input_content} onChange={(e) => set_street_name_input_content(e.target.value)} placeholder="Enter street name" />
            <button onClick={submitstreetname} className="bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer" type="button">ok</button>
            {( should_show_solution && (<span className='text-4xl ml-4 font-bold'>{success_info_text}</span>))}
          </div>
        )}
        {(mode === "pointToStreet") && (
          <div className='text-4xl mb-4'>
            Click <b>{street_name}</b> on the map!&nbsp;
            {(should_show_solution && (
              <span>
                Distance:&nbsp;
                <b>{distance.toFixed(0) + "m"}</b>
              </span>
            ))}
          </div>
        )}
        {(game_type !== "free") && (
          <div className='text-2xl mb-4'>
            Score: <b>{score}</b> | Rounds played: <b>{rounds_played}</b>
            {(should_show_solution && (
              <span> | 
                {( game_type === "pointToStreet" && (<b> Click map to continue</b>))} 
                {( game_type === "nameTheStreet" && (<b> Click ok again to continue</b>))}
              </span>
            ))}
          </div>
        )}
      {(game_type === "free") && (
        <div className='mt-8 mb-4'>
          <button type="button" className="bg-transparent hover:bg-black hover:text-white py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer" onClick={nextTaskPointToStreet}>Next task (point to street)</button>
          <button type="button" className="bg-transparent hover:bg-black hover:text-white py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer" onClick={nextTaskNameTheStreet}>Next task (name the street)</button>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-[calc(100%-9rem)] mt-5"></div><br/>
    </div>
  )
}
