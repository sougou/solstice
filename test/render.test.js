import { test } from "node:test";
import assert from "node:assert/strict";
import { buildModel } from "../src/timeModel.js";

// render.js builds DOM nodes. There's no DOM in node:test, so run it against a
// permissive stand-in. This catches ReferenceErrors and bad calls in the render
// paths (a missing helper function, a wrong name), not layout.
function fakeNode() {
  const target = function () {};
  const style = new Proxy({}, {
    get: (t, prop) => (prop in t ? t[prop] : () => {}),
    set: (t, prop, value) => { t[prop] = value; return true; },
  });
  const store = { dataset: {}, style, children: [], className: "", innerHTML: "", textContent: "" };
  return new Proxy(target, {
    get(_, prop) {
      if (prop in store) return store[prop];
      if (prop === "classList") return { add() {}, remove() {}, toggle() {}, contains: () => false };
      if (prop === "clientWidth" || prop === "offsetWidth") return 1200;
      if (prop === Symbol.iterator) return function* () {};
      if (prop === "querySelector" || prop === "closest") return () => fakeNode();
      if (prop === "querySelectorAll") return () => [];
      return () => fakeNode();
    },
    set(_, prop, value) { store[prop] = value; return true; },
    apply() { return fakeNode(); },
  });
}

globalThis.document = {
  createElement: () => fakeNode(),
  createElementNS: () => fakeNode(),
  createDocumentFragment: () => fakeNode(),
  createTextNode: () => fakeNode(),
  documentElement: fakeNode(),
  body: fakeNode(),
};
globalThis.window = { scrollY: 0, innerWidth: 1280, addEventListener() {}, matchMedia: () => ({ matches: false }) };

const { renderLive, updateLive, renderEditBar } = await import("../src/render.js");

const zones = [
  { label: "You", tz: "local", lat: 40.7, lon: -74 },
  { label: "London", tz: "Europe/London", lat: 51.5, lon: -0.13, name: "London" },
];

function ctx(extra = {}) {
  return {
    editMode: false, query: "", cities: [], focusSearch: false, zones, localLabel: null,
    scrubAt: null, home: "", timeMode: "12", theme: "system", scheme: "teal",
    tempUnit: "F", weather: null,
    onTimeMode() {}, onTheme() {}, onScheme() {}, onToggle() {}, onQuery() {}, onAdd() {},
    onRemove() {}, onHome() {}, onRename() {}, onReorder() {}, onScrub() {}, onResetScrub() {},
    onTempUnit() {},
    ...extra,
  };
}

const weather = { tempC: 20, code: 1, isDay: true, feelsC: 19, humidity: 50, windKmh: 12, windDeg: 90, cloud: 40 };

test("renderLive and updateLive run without weather", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  const live = fakeNode();
  renderLive(buildModel(zones, now), live, now, ctx());
  updateLive(buildModel(zones, now), live, now, ctx());
});

test("renderLive runs with weather in both units, and when only one zone is shown", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  for (const tempUnit of ["F", "C"]) {
    renderLive(buildModel(zones, now), fakeNode(), now, ctx({ weather, tempUnit }));
  }
  renderLive(buildModel(zones.slice(0, 1), now), fakeNode(), now, ctx({ weather }));
});

test("renderEditBar runs, in and out of edit mode", () => {
  renderEditBar(fakeNode(), ctx());
  renderEditBar(fakeNode(), ctx({ editMode: true }));
});
