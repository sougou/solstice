import { test } from "node:test";
import assert from "node:assert/strict";
import {
  describeWeather, formatTemp, resolveUnit, writeUnit,
  readCachedWeather, fetchWeather, refreshWeather, formatWind, compass,
} from "../src/weather.js";

function stub() {
  const mem = {};
  return {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
}
const okFetch = (current) => async () => ({ ok: true, json: async () => ({ current }) });

test("describeWeather maps WMO codes and handles night and unknown codes", () => {
  assert.equal(describeWeather(0, true).label, "Clear");
  assert.equal(describeWeather(0, false).glyph, "☾");
  assert.equal(describeWeather(63).label, "Rain");
  assert.equal(describeWeather(999), null);
});

test("formatTemp converts and rounds", () => {
  assert.equal(formatTemp(21.4, "C"), "21°C");
  assert.equal(formatTemp(20, "F"), "68°F");
  assert.equal(formatTemp(-0.2, "C"), "0°C");
});

test("resolveUnit: stored choice wins, else locale default", () => {
  const s = stub();
  assert.equal(resolveUnit(s, "en-US"), "F");
  assert.equal(resolveUnit(s, "en-GB"), "C");
  writeUnit(s, "C");
  assert.equal(resolveUnit(s, "en-US"), "C");
  writeUnit(s, "K"); // ignored
  assert.equal(resolveUnit(s, "en-GB"), "C");
});

test("fetchWeather parses the response and rejects bad data", async () => {
  const w = await fetchWeather(40.7, -74, okFetch({ temperature_2m: 18.2, weather_code: 3, is_day: 0 }));
  assert.deepEqual(w, {
    tempC: 18.2, code: 3, isDay: false,
    feelsC: null, humidity: null, windKmh: null, windDeg: null, cloud: null,
  });
  const full = await fetchWeather(1, 1, okFetch({
    temperature_2m: 10, weather_code: 0, is_day: 1, apparent_temperature: 8.5,
    relative_humidity_2m: 54, wind_speed_10m: 19, wind_direction_10m: 315, cloud_cover: 40,
  }));
  assert.equal(full.feelsC, 8.5);
  assert.equal(full.windKmh, 19);
  assert.equal(full.cloud, 40);
  assert.equal(await fetchWeather(1, 1, okFetch({})), null);
  assert.equal(await fetchWeather(1, 1, async () => ({ ok: false })), null);
  assert.equal(await fetchWeather(1, 1, async () => { throw new Error("offline"); }), null);
});

test("fetchWeather sends rounded coordinates only", async () => {
  let url;
  await fetchWeather(40.712812, -74.006015, async (u) => { url = u; return { ok: false }; });
  assert.match(url, /latitude=40\.71&longitude=-74\.01/);
});

test("refreshWeather caches by position for 30 minutes", async () => {
  const s = stub();
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return { ok: true, json: async () => ({ current: { temperature_2m: 10, weather_code: 0, is_day: 1 } }) };
  };
  const t0 = 1_000_000;
  await refreshWeather(s, 40.71, -74.01, { fetchImpl, now: t0 });
  await refreshWeather(s, 40.71, -74.01, { fetchImpl, now: t0 + 60_000 });
  assert.equal(calls, 1);
  await refreshWeather(s, 51.5, -0.13, { fetchImpl, now: t0 + 60_000 }); // moved
  assert.equal(calls, 2);
  assert.equal(readCachedWeather(s, 51.5, -0.13, t0 + 32 * 60_000), null); // expired
});

test("formatWind converts km/h to mph for Fahrenheit", () => {
  assert.equal(formatWind(19, "C"), "19 km/h");
  assert.equal(formatWind(19, "F"), "12 mph");
});

test("compass maps degrees to 8 points and wraps", () => {
  assert.equal(compass(0), "N");
  assert.equal(compass(315), "NW");
  assert.equal(compass(359), "N");
  assert.equal(compass(-45), "NW");
  assert.equal(compass(null), "");
});
