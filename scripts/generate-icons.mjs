#!/usr/bin/env node

/**
 * Generates colored circular SVG pin icons from the map dataset.
 * Each unique (FA icon + ward color) combination produces one SVG file
 * in src/icons/, named "{fa-icon-name}_{color}.svg".
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as fa from "@fortawesome/free-solid-svg-icons";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = resolve(__dirname, "..", "src", "dataset", "map.json");
const ICONS_DIR = resolve(__dirname, "..", "src", "icons");

// Map FA5 css class names (fa-xxx) to FA6 JS export names (faXxx)
function cssToJsName(cssClass) {
  return "fa" + cssClass
    .replace("fa-", "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function generateSvg(iconDef, fillColor) {
  const [width, height, , , pathData] = iconDef.icon;

  // Circle background with icon glyph in white, matching city-of-doors style
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64" height="64">`,
    `  <circle cx="256" cy="256" r="256" fill="${fillColor}"/>`,
    `  <g transform="translate(${(512 - width * 0.6) / 2}, ${(512 - height * 0.6) / 2}) scale(0.6)">`,
    `    <path fill="#ffffff" d="${pathData}"/>`,
    `  </g>`,
    `</svg>`,
  ].join("\n");
}

function main() {
  const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
  const locations = dataset.levels[0]?.locations ?? [];

  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }

  // Collect unique icon + color combos
  const combos = new Set();
  for (const loc of locations) {
    if (loc.pin === "hidden") continue;
    const parts = loc.pin.split(" ");
    const iconClass = parts[parts.length - 1]; // e.g. "fa-home"
    combos.add(`${iconClass}|${loc.fill}`);
  }

  let generated = 0;
  let skipped = 0;

  for (const combo of combos) {
    const [iconClass, fill] = combo.split("|");
    const jsName = cssToJsName(iconClass);
    const iconDef = fa[jsName];

    if (!iconDef) {
      console.warn(`Unknown icon: ${iconClass} (${jsName})`);
      skipped++;
      continue;
    }

    const safeFill = fill.replace("#", "");
    const filename = `${iconClass.replace("fa-", "")}__${safeFill}.svg`;
    const svg = generateSvg(iconDef, fill);
    writeFileSync(resolve(ICONS_DIR, filename), svg);
    generated++;
  }

  console.log(`Generated ${generated} icons in ${ICONS_DIR}`);
  if (skipped > 0) console.warn(`Skipped ${skipped} unknown icons`);
}

main();
