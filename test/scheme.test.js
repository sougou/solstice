import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SCHEMES, SCHEME_LABELS, normalizeScheme } from "../src/scheme.js";
import { PALETTES, applyToCss, buildSchemeCss } from "../tools/make-schemes.mjs";

const css = readFileSync(new URL("../newtab.css", import.meta.url), "utf8");

test("normalizeScheme keeps known schemes and defaults the rest to teal", () => {
  for (const s of SCHEMES) assert.equal(normalizeScheme(s), s);
  assert.equal(normalizeScheme(null), "teal");
  assert.equal(normalizeScheme("neon"), "teal");
});

test("every scheme has a label and both a dark and a light palette", () => {
  assert.deepEqual(Object.keys(PALETTES), SCHEMES);
  for (const s of SCHEMES) {
    assert.ok(SCHEME_LABELS[s], `${s} label`);
    for (const mode of ["dark", "light"]) {
      assert.ok(PALETTES[s][mode], `${s} ${mode} palette`);
      assert.match(css, new RegExp(`\\[data-theme="${mode}"\\]\\[data-scheme="${s}"\\]`), `${s} ${mode} rule`);
    }
  }
});

test("the generated scheme CSS in newtab.css is up to date", () => {
  assert.equal(applyToCss(css), css, "run: node tools/make-schemes.mjs");
});

test("each scheme sets every variable the page reads", () => {
  const need = ["bg", "panel", "border", "txt", "muted", "accent", "on-accent", "accent-border",
    "local-glow", "accent-soft", "accent-soft-hover", "track", "raised", "raised-txt",
    "chip-txt", "danger-bg", "danger", "night", "morning", "work", "evening", "dst"];
  for (const block of buildSchemeCss().split("\n}\n")) {
    for (const v of need) assert.ok(block.includes(`--${v}:`), `${block.split("\n")[0]} missing --${v}`);
  }
});

test("text and accent keep readable contrast on every background", () => {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  for (const s of SCHEMES) {
    for (const mode of ["dark", "light"]) {
      const p = PALETTES[s][mode];
      assert.ok(ratio(p.txt, p.bg) >= 7, `${s} ${mode} txt`);
      assert.ok(ratio(p.muted, p.bg) >= 4.5, `${s} ${mode} muted`);
      assert.ok(ratio(p.accent, p.bg) >= 4.5, `${s} ${mode} accent`);
    }
  }
});
