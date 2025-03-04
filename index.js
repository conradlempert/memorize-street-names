'use strict';

const fs = require('fs');

const rawdata = fs.readFileSync('potsdam.geojson');
const data = JSON.parse(rawdata);
const features = data.features;
const in_potsdam = features.filter(f => f.properties["addr:city"] === "Potsdam");
const streets_map = new Map();
for(const feature of in_potsdam) {
    const street = feature.properties["addr:street"];
    if(streets_map.has(street)) {
        streets_map.get(street).push(feature);
    } else {
        streets_map.set(street, []);
    }
}
const sorted_map = new Map([...streets_map.entries()].sort());
console.log(features.length);
console.log(in_potsdam.length);
console.log(streets_map.size);
console.log(sorted_map.size);
console.log(sorted_map.keys());

const result = {};

for(const key of sorted_map.keys()) {
    const street_features = sorted_map.get(key);
    const coordinates = street_features.map(f => f.geometry.type === "Polygon" ? f.geometry.coordinates[0][0] : f.geometry.coordinates);
    result[key] = coordinates;
}

const output = JSON.stringify(result);
fs.writeFileSync('potsdam.json', output);