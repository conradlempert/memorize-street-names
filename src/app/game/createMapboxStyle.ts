// downloaded from https://openlayers.org/en/v10.4.0/examples/resources/mapbox-streets-v6-style.js
// and then i added types

import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import Icon from "ol/style/Icon";
import { FeatureLike } from "ol/Feature";

export default function createMapboxStreetsV6Style() {
  const l = new Fill({ color: "" }),
    s = new Stroke({ color: "", width: 1 }),
    n = new Style({ fill: l }),
    i = new Style({ fill: l, stroke: s }),
    d = new Style({ stroke: s }),
    g = new Style({ text: new Text({ text: "", fill: l, stroke: s }) }),
    c: { [key: string]: Style } = {};
  function b(t: string) {
    let o = c[t];
    return (
      o ||
        ((o = new Style({
          image: new Icon({
            src:
              "https://cdn.jsdelivr.net/npm/@mapbox/maki@4.0.0/icons/" +
              t +
              "-15.svg",
            size: [0, 0],
            crossOrigin: "anonymous",
          }),
        })),
        (c[t] = o)),
      o
    );
  }
  const m: Style[] = [];
  return function (e: FeatureLike, t: number) {
    let o = 0;
    const a = e.get("layer"),
      r = e.get("class"),
      c = e.get("type"),
      C = e.get("scalerank"),
      x = e.get("labelrank"),
      h = e.get("admin_level"),
      p = e.get("maritime"),
      _ = e.get("disputed"),
      T = e.get("maki"),
      W = e.getGeometry()!.getType();
    return (
      "landuse" == a && "park" == r
        ? (l.setColor("#d8e8c8"), (m[o++] = n))
        : "landuse" == a && "cemetery" == r
        ? (l.setColor("#e0e4dd"), (m[o++] = n))
        : "landuse" == a && "hospital" == r
        ? (l.setColor("#fde"), (m[o++] = n))
        : "landuse" == a && "school" == r
        ? (l.setColor("#f0e8f8"), (m[o++] = n))
        : "landuse" == a && "wood" == r
        ? (l.setColor("rgb(233,238,223)"), (m[o++] = n))
        : ("waterway" == a && "river" != r && "stream" != r && "canal" != r) ||
          ("waterway" == a && "river" == r)
        ? (s.setColor("#a0c8f0"), s.setWidth(1), (m[o++] = d))
        : "waterway" != a || ("stream" != r && "canal" != r)
        ? "water" == a
          ? (l.setColor("#a0c8f0"), (m[o++] = n))
          : "aeroway" == a && "Polygon" == W
          ? (l.setColor("rgb(242,239,235)"), (m[o++] = n))
          : "aeroway" == a && "LineString" == W && t <= 76.43702828517625
          ? (s.setColor("#f0ede9"), s.setWidth(1), (m[o++] = d))
          : "building" == a
          ? (l.setColor("#f2eae2"),
            s.setColor("#dfdbd7"),
            s.setWidth(1),
            (m[o++] = i))
          : "tunnel" == a && "motorway_link" == r
          ? (s.setColor("#e9ac77"), s.setWidth(1), (m[o++] = d))
          : "tunnel" == a && "service" == r
          ? (s.setColor("#cfcdca"), s.setWidth(1), (m[o++] = d))
          : "tunnel" != a || ("street" != r && "street_limited" != r)
          ? ("tunnel" == a && "main" == r && t <= 1222.99245256282) ||
            ("tunnel" == a && "motorway" == r)
            ? (s.setColor("#e9ac77"), s.setWidth(1), (m[o++] = d))
            : "tunnel" == a && "path" == r
            ? (s.setColor("#cba"), s.setWidth(1), (m[o++] = d))
            : "tunnel" == a && "major_rail" == r
            ? (s.setColor("#bbb"), s.setWidth(2), (m[o++] = d))
            : "road" == a && "motorway_link" == r
            ? (s.setColor("#e9ac77"), s.setWidth(1), (m[o++] = d))
            : "road" != a ||
              ("street" != r && "street_limited" != r) ||
              "LineString" != W
            ? ("road" == a && "main" == r && t <= 1222.99245256282) ||
              ("road" == a && "motorway" == r && t <= 4891.96981025128)
              ? (s.setColor("#e9ac77"), s.setWidth(1), (m[o++] = d))
              : "road" == a && "path" == r
              ? (s.setColor("#cba"), s.setWidth(1), (m[o++] = d))
              : "road" == a && "major_rail" == r
              ? (s.setColor("#bbb"), s.setWidth(2), (m[o++] = d))
              : ("bridge" == a && "motorway_link" == r) ||
                ("bridge" == a && "motorway" == r)
              ? (s.setColor("#e9ac77"), s.setWidth(1), (m[o++] = d))
              : "bridge" == a && "service" == r
              ? (s.setColor("#cfcdca"), s.setWidth(1), (m[o++] = d))
              : "bridge" != a || ("street" != r && "street_limited" != r)
              ? "bridge" == a && "main" == r && t <= 1222.99245256282
                ? (s.setColor("#e9ac77"), s.setWidth(1), (m[o++] = d))
                : "bridge" == a && "path" == r
                ? (s.setColor("#cba"), s.setWidth(1), (m[o++] = d))
                : "bridge" == a && "major_rail" == r
                ? (s.setColor("#bbb"), s.setWidth(2), (m[o++] = d))
                : ("admin" == a && h >= 3 && 0 === p) ||
                  ("admin" == a && 2 == h && 0 === _ && 0 === p) ||
                  ("admin" == a && 2 == h && 1 === _ && 0 === p)
                ? (s.setColor("#9e9cab"), s.setWidth(1), (m[o++] = d))
                : ("admin" == a && h >= 3 && 1 === p) ||
                  ("admin" == a && 2 == h && 1 === p)
                ? (s.setColor("#a0c8f0"), s.setWidth(1), (m[o++] = d))
                : "country_label" == a && 1 === C
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('bold 11px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#334"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(2),
                  (m[o++] = g))
                : "country_label" == a && 2 === C && t <= 19567.87924100512
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('bold 10px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#334"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(2),
                  (m[o++] = g))
                : "country_label" == a && 3 === C && t <= 9783.93962050256
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('bold 9px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#334"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(2),
                  (m[o++] = g))
                : "country_label" == a && 4 === C && t <= 4891.96981025128
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('bold 8px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#334"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(2),
                  (m[o++] = g))
                : ("marine_label" == a && 1 === x && "Point" == W) ||
                  ("marine_label" == a && 2 === x && "Point" == W)
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('italic 11px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#74aee9"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : "marine_label" == a && 3 === x && "Point" == W
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('italic 10px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#74aee9"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : "marine_label" == a && 4 === x && "Point" == W
                ? (g.getText()!.setText(e.get("name_en")),
                  g
                    .getText()!
                    .setFont('italic 9px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#74aee9"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : "place_label" == a && "city" == c && t <= 1222.99245256282
                ? (g.getText()!.setText(e.get("name_en")),
                  g.getText()!.setFont('11px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#333"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : "place_label" == a && "town" == c && t <= 305.748113140705
                ? (g.getText()!.setText(e.get("name_en")),
                  g.getText()!.setFont('9px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#333"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : "place_label" == a && "village" == c && t <= 38.21851414258813
                ? (g.getText()!.setText(e.get("name_en")),
                  g.getText()!.setFont('8px "Open Sans", "Arial Unicode MS"'),
                  l.setColor("#333"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : "place_label" == a &&
                  t <= 19.109257071294063 &&
                  ("hamlet" == c || "suburb" == c || "neighbourhood" == c)
                ? (g.getText()!.setText(e.get("name_en")),
                  g.getText()!.setFont('bold 9px "Arial Narrow"'),
                  l.setColor("#633"),
                  s.setColor("rgba(255,255,255,0.8)"),
                  s.setWidth(1),
                  (m[o++] = g))
                : (("poi_label" == a &&
                    t <= 19.109257071294063 &&
                    1 == C &&
                    "marker" !== T) ||
                    ("poi_label" == a &&
                      t <= 9.554628535647032 &&
                      2 == C &&
                      "marker" !== T) ||
                    ("poi_label" == a &&
                      t <= 4.777314267823516 &&
                      3 == C &&
                      "marker" !== T) ||
                    ("poi_label" == a &&
                      t <= 2.388657133911758 &&
                      4 == C &&
                      "marker" !== T) ||
                    ("poi_label" == a &&
                      t <= 1.194328566955879 &&
                      C >= 5 &&
                      "marker" !== T)) &&
                  (m[o++] = b(T))
              : (s.setColor("#cfcdca"), s.setWidth(1), (m[o++] = d))
            : (s.setColor("#cfcdca"), s.setWidth(1), (m[o++] = d))
          : (s.setColor("#cfcdca"), s.setWidth(1), (m[o++] = d))
        : (s.setColor("#a0c8f0"), s.setWidth(1), (m[o++] = d)),
      (m.length = o),
      m
    );
  };
}
