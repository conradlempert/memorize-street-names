var map;
var features;
var street_name;
var current_layer;
var map_layer_task;
var map_layer_solution;
var draw_layer;
function loadMap() {
  map_layer_task = new ol.layer.VectorTile({
    declutter: true,
    source: new ol.source.VectorTile({
      attributions:
        '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
        '© <a href="https://www.openstreetmap.org/copyright">' +
        "OpenStreetMap contributors</a>",
      format: new ol.format.MVT(),
      url:
        "https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/" +
        "{z}/{x}/{y}.vector.pbf?access_token=" +
        "pk.eyJ1IjoiY2xuZXh1cyIsImEiOiJjajMyNHJzb24wMGE4MzJudTk4b3loaWVlIn0.C5EK2wZ72uTyskjsYjOsTQ",
    }),
    style: createMapboxStreetsV6Style(
      ol.style.Style,
      ol.style.Fill,
      ol.style.Stroke,
      ol.style.Icon,
      ol.style.Text
    ),
  });
  map_layer_solution = new ol.layer.Tile({
    source: new ol.source.OSM(),
  });
  map = new ol.Map({
    target: "map",
    layers: [map_layer_solution, map_layer_task],
    view: new ol.View({
      center: ol.proj.fromLonLat([13.0702085, 52.41924]),
      zoom: 12,
    }),
  });
  console.log(map_layer_task);
  map_layer_task.setVisible(false);
}
function loadData() {
  fetch("./potsdam.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      features = data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function showStreet() {
  const street_features = features[street_name];
  const street = [];
  for (const feature of street_features) {
    street.push(
      new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(feature)),
      })
    );
  }
  // create the source and layer for random features
  const vectorSource = new ol.source.Vector({
    features: street,
  });
  current_layer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 2,
        fill: new ol.style.Fill({ color: "red" }),
      }),
    }),
  });
  map.addLayer(current_layer);
  zoomToStreet();
}
function zoomToStreet(additionalPoints) {
  const extraPoints = additionalPoints ? additionalPoints : [];
  const street_features = [...features[street_name], ...extraPoints];
  const transformed_points = street_features.map((f) => ol.proj.fromLonLat(f));
  const extent = ol.extent.boundingExtent(transformed_points);
  map.getView().fit(extent, { padding: [300, 300, 300, 300] });
}
function getRandomStreetName() {
  const street_names = Object.keys(features);
  return street_names[Math.floor(Math.random() * street_names.length)];
}
function nextTaskOnMap() {
  map_layer_task.setVisible(true);
  map_layer_solution.setVisible(false);
  map.removeLayer(current_layer);
  document.getElementById("streetnameinput").value = "";
  document.getElementById("info").innerHTML = "";
  document.getElementById("elementsOnMap").style.display = "block";
  document.getElementById("elementsStreetName").style.display = "none";
  street_name = getRandomStreetName();
  showStreet();
}
function nextTaskStreetName() {
  zoomToPdm();
  map_layer_task.setVisible(true);
  map_layer_solution.setVisible(false);
  map.removeLayer(current_layer);
  document.getElementById("elementsOnMap").style.display = "none";
  document.getElementById("elementsStreetName").style.display = "block";
  street_name = getRandomStreetName();
  document.getElementById("street_name").innerHTML = street_name;
  map.removeLayer(draw_layer);
  var draw_source = new ol.source.Vector({ wrapX: false });
  draw_layer = new ol.layer.Vector({
    source: draw_source,
    style: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({ color: "blue" }),
      }),
    }),
  });
  draw = new ol.interaction.Draw({
    source: draw_source,
    type: "Point",
  });
  draw.on("drawend", (e) => {
    console.log(e.feature);
    const feature_coords = e.feature.getGeometry().getCoordinates();
    const feature_lonlat = ol.proj.transform(
      feature_coords,
      "EPSG:3857",
      "EPSG:4326"
    );
    const street_features = features[street_name];
    const distances = street_features.map((f) => {
      return ol.sphere.getDistance(f, feature_lonlat);
    });
    const min = Math.min(...distances);
    document.getElementById("distance").innerHTML = min.toFixed(0) + "m";
    map_layer_task.setVisible(false);
    map_layer_solution.setVisible(true);
    showStreet();
    zoomToStreet([feature_lonlat]);
    map.removeInteraction(draw);
  });
  map.addInteraction(draw);
  map.addLayer(draw_layer);
}
function submitstreetname() {
  if (
    street_name.toLowerCase() ===
    document.getElementById("streetnameinput").value.toLowerCase()
  ) {
    document.getElementById("info").innerHTML = "correct :)";
  } else {
    document.getElementById("info").innerHTML = "wrong, it was " + street_name;
  }
  map_layer_task.setVisible(false);
  map_layer_solution.setVisible(true);
}
loadMap();
loadData();
document.onkeyup = (ev) => {
  if (ev.key === "Enter") {
    submitstreetname();
  }
};
function zoomToPdm() {
  map.setView(
    new ol.View({
      center: ol.proj.fromLonLat([13.0702085, 52.41924]),
      zoom: 12,
    })
  );
}
