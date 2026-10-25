// Generates the color-scheme CSS in newtab.css (between the schemes:start and
// schemes:end markers) from the palettes below. Edit a palette here, then run:
//
//   node tools/make-schemes.mjs
//
// Most variables are derived from a few base colors; a palette can override any
// of them (teal does, to match the original values exactly).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const hex = (n) => Math.round(n).toString(16).padStart(2, "0");
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// a at 1-t, b at t.
const blend = (a, b, t) => {
  const [x, y] = [rgb(a), rgb(b)];
  return "#" + x.map((v, i) => hex(v + (y[i] - v) * t)).join("");
};
const alpha = (h, a) => `rgba(${rgb(h).join(",")},${a})`;

const DANGER = {
  dark: { "danger-bg": "#3a2530", danger: "#ff8d8d" },
  light: { "danger-bg": "#fbe1e1", danger: "#b42318" },
};

// Base colors per scheme and mode. `bands` = night, morning, work, evening.
export const PALETTES = {
  teal: {
    dark: {
      bg: "#0a0d12", panel: "#0d1219", border: "#1b2230", txt: "#e8edf2", muted: "#7c8593",
      accent: "#2dd4bf", bands: ["#283142", "#c2873f", "#2bb3a3", "#cf7a3a"],
      over: { "on-accent": "#06201d", "accent-border": "#1d6f67", "local-glow": "#0e2b29",
        track: "#11161e", "raised-txt": "#cdd5e0", "chip-txt": "#9aa4b2" },
    },
    light: {
      bg: "#eef4fa", panel: "#f8fbfe", border: "#d8e3ee", txt: "#102030", muted: "#5f7185",
      accent: "#0e7490", bands: ["#2f3b52", "#f2b766", "#3fbfae", "#e8875a"],
      over: { "accent-border": "#8cc3d6", "local-glow": "#e1f0f6", track: "#dfe8f1",
        raised: "#dfe8f1", "raised-txt": "#243447", "chip-txt": "#5f7185", dst: "#a15c12" },
    },
  },
  midnight: {
    dark: {
      bg: "#0b0d1f", panel: "#11142b", border: "#232850", txt: "#e6e8ff", muted: "#7a80b8",
      accent: "#818cf8", bands: ["#262a52", "#c2873f", "#7c83e6", "#cf7a3a"],
    },
    light: {
      bg: "#eef0fb", panel: "#f8f9ff", border: "#d9ddf2", txt: "#14183a", muted: "#5d6490",
      accent: "#4f46e5", bands: ["#3a3f6e", "#f2b766", "#6d73e0", "#e8875a"],
    },
  },
  ember: {
    dark: {
      bg: "#120d09", panel: "#1a130d", border: "#2e2118", txt: "#f3e8dc", muted: "#9a8672",
      accent: "#fb923c", bands: ["#35271c", "#d4a24c", "#e8782a", "#c9573a"],
    },
    light: {
      bg: "#f7f0e8", panel: "#fcf8f2", border: "#e8dccd", txt: "#2d1f14", muted: "#7a6552",
      accent: "#c2410c", bands: ["#4a3a2c", "#e8c25a", "#e0782c", "#c9573a"],
    },
  },
  forest: {
    dark: {
      bg: "#08110c", panel: "#0d1812", border: "#1b2e22", txt: "#e3f2e8", muted: "#76917f",
      accent: "#4ade80", bands: ["#223a2b", "#c2873f", "#34c27a", "#cf7a3a"],
    },
    light: {
      bg: "#eef6f0", panel: "#f8fcf9", border: "#d5e6da", txt: "#10261a", muted: "#587363",
      accent: "#15803d", bands: ["#2c4034", "#f2b766", "#34a96a", "#e8875a"],
    },
  },
  dusk: {
    dark: {
      bg: "#130a10", panel: "#1b0f17", border: "#34202c", txt: "#f6e6ec", muted: "#a07a89",
      accent: "#fb7185", bands: ["#3d2634", "#d4a24c", "#e5546c", "#cf7a3a"],
    },
    light: {
      bg: "#fbeff3", panel: "#fff8fa", border: "#f0d8e0", txt: "#2a1018", muted: "#86606d",
      accent: "#be123c", bands: ["#4a2c3a", "#f2b766", "#e5546c", "#e8875a"],
    },
  },
  graphite: {
    dark: {
      bg: "#0f1012", panel: "#16171a", border: "#26282d", txt: "#ececee", muted: "#8b8d94",
      accent: "#e5e7eb", bands: ["#2f3136", "#8b8d94", "#d1d5db", "#8b8d94"],
    },
    light: {
      bg: "#f2f2f3", panel: "#fbfbfb", border: "#dcdde0", txt: "#17181a", muted: "#666870",
      accent: "#17181a", bands: ["#2f3136", "#9ca3af", "#4b5563", "#9ca3af"],
    },
  },
};

function vars(mode, p) {
  const dark = mode === "dark";
  const [night, morning, work, evening] = p.bands;
  const v = {
    bg: p.bg, panel: p.panel, border: p.border, txt: p.txt, muted: p.muted, accent: p.accent,
    "on-accent": dark ? blend(p.accent, "#000000", 0.86) : "#ffffff",
    "accent-border": blend(p.bg, p.accent, dark ? 0.5 : 0.4),
    "local-glow": blend(dark ? p.panel : p.bg, p.accent, dark ? 0.14 : 0.07),
    "accent-soft": alpha(p.accent, dark ? 0.12 : 0.1),
    "accent-soft-hover": alpha(p.accent, dark ? 0.2 : 0.18),
    track: dark ? blend(p.panel, p.border, 0.3) : blend(p.bg, p.border, 0.7),
    raised: dark ? p.border : blend(p.bg, p.border, 0.7),
    "raised-txt": dark ? blend(p.bg, p.txt, 0.88) : blend(p.txt, p.bg, 0.12),
    "chip-txt": dark ? blend(p.bg, p.txt, 0.62) : p.muted,
    ...DANGER[mode],
    night, morning, work, evening,
    dst: dark ? morning : blend(morning, "#000000", 0.42),
    ...(p.over ?? {}),
  };
  return v;
}

export function buildSchemeCss() {
  const out = [];
  for (const [name, modes] of Object.entries(PALETTES)) {
    for (const mode of ["dark", "light"]) {
      const v = vars(mode, modes[mode]);
      // The second selector lets a swatch with its own data-scheme preview it.
      out.push(
        `[data-theme="${mode}"][data-scheme="${name}"],\n` +
        `[data-theme="${mode}"] [data-scheme="${name}"] {\n` +
        `  color-scheme:${mode};\n` +
        Object.entries(v).map(([k, x]) => `  --${k}:${x};`).join("\n") + "\n}"
      );
    }
  }
  return out.join("\n");
}

const START = "/* schemes:start (generated by tools/make-schemes.mjs; do not edit by hand) */";
const END = "/* schemes:end */";

export function applyToCss(css) {
  const a = css.indexOf(START), b = css.indexOf(END);
  if (a < 0 || b < 0) throw new Error("schemes markers not found in newtab.css");
  return css.slice(0, a) + START + "\n" + buildSchemeCss() + "\n" + css.slice(b);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL("../newtab.css", import.meta.url);
  writeFileSync(path, applyToCss(readFileSync(path, "utf8")));
  console.log("Updated newtab.css");
}
