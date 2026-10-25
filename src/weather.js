// Current weather for the local zone via Open-Meteo's free forecast API (no
// key). Only rounded coordinates leave the browser. Cached for 30 minutes so
// opening tabs doesn't re-query. Failures resolve to null; weather is optional.

const API = "https://api.open-meteo.com/v1/forecast";
const KEY = "weatherV2";
const UNIT_KEY = "tempUnit";
const TTL_MS = 30 * 60 * 1000;

// WMO weather codes → [glyph, label]. Unlisted codes fall through to null.
const CODES = [
  [[0], "☀", "Clear"],
  [[1, 2], "⛅", "Partly cloudy"],
  [[3], "☁", "Cloudy"],
  [[45, 48], "🌫", "Fog"],
  [[51, 53, 55, 56, 57], "🌦", "Drizzle"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "🌧", "Rain"],
  [[71, 73, 75, 77, 85, 86], "❄", "Snow"],
  [[95, 96, 99], "⛈", "Thunderstorm"],
];

export function describeWeather(code, isDay = true) {
  for (const [codes, glyph, label] of CODES) {
    if (codes.includes(code)) {
      return { glyph: code === 0 && !isDay ? "☾" : glyph, label };
    }
  }
  return null;
}

export function normalizeUnit(value) {
  return value === "C" || value === "F" ? value : null;
}

// Stored choice wins; otherwise Fahrenheit for en-US, Celsius elsewhere.
export function resolveUnit(storage, locale = "en-US") {
  return normalizeUnit(storage.getItem(UNIT_KEY)) ?? (/-US\b/.test(locale) ? "F" : "C");
}

export function writeUnit(storage, unit) {
  const u = normalizeUnit(unit);
  if (u) storage.setItem(UNIT_KEY, u);
}

export function formatTemp(tempC, unit) {
  const v = unit === "F" ? (tempC * 9) / 5 + 32 : tempC;
  return `${Math.round(v)}°${unit}`;
}

export function formatWind(kmh, unit) {
  const v = unit === "F" ? kmh * 0.621371 : kmh;
  return `${Math.round(v)} ${unit === "F" ? "mph" : "km/h"}`;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
// Direction the wind blows *from*, as an 8-point compass label.
export function compass(deg) {
  return Number.isFinite(deg) ? COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8] : "";
}

const round2 = (n) => Math.round(n * 100) / 100;

export function readCachedWeather(storage, lat, lon, now = Date.now()) {
  try {
    const c = JSON.parse(storage.getItem(KEY));
    if (!c || typeof c.ts !== "number" || now - c.ts > TTL_MS) return null;
    if (c.lat !== round2(lat) || c.lon !== round2(lon)) return null;
    return Number.isFinite(c.tempC) ? c : null;
  } catch {
    return null;
  }
}

export async function fetchWeather(lat, lon, fetchImpl = fetch) {
  const url = `${API}?latitude=${round2(lat)}&longitude=${round2(lon)}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
    `wind_speed_10m,wind_direction_10m,cloud_cover,weather_code,is_day`;
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return null;
    const cur = (await res.json()).current;
    const tempC = Number(cur?.temperature_2m);
    const code = Number(cur?.weather_code);
    if (!Number.isFinite(tempC) || !Number.isFinite(code)) return null;
    // Optional extras are null when the API omits them.
    const opt = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
    return {
      tempC, code, isDay: cur.is_day !== 0,
      feelsC: opt(cur.apparent_temperature),
      humidity: opt(cur.relative_humidity_2m),
      windKmh: opt(cur.wind_speed_10m),
      windDeg: opt(cur.wind_direction_10m),
      cloud: opt(cur.cloud_cover),
    };
  } catch {
    return null;
  }
}

// Cached entry if fresh, else fetch and cache. Resolves to the weather object (see fetchWeather) or null.
export async function refreshWeather(storage, lat, lon, deps = {}) {
  const { fetchImpl = fetch, now = Date.now() } = deps;
  const hit = readCachedWeather(storage, lat, lon, now);
  if (hit) return hit;
  const w = await fetchWeather(lat, lon, fetchImpl);
  if (w) {
    try {
      storage.setItem(KEY, JSON.stringify({ ...w, lat: round2(lat), lon: round2(lon), ts: now }));
    } catch {}
  }
  return w;
}
