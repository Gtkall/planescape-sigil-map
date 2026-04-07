#!/usr/bin/env node

/**
 * Fetches the Sigil map dataset from the city-of-doors GitHub repository
 * and caches it locally in src/dataset/map.json.
 *
 * Usage:
 *   node scripts/fetch-map-data.mjs          # fetch & cache
 *   node scripts/fetch-map-data.mjs --force   # overwrite even if identical
 *
 * The cached file is committed to the repo as a fallback in case the
 * upstream repository becomes unavailable.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const UPSTREAM_URL =
  process.env.MAP_DATASET_URL ??
  "https://raw.githubusercontent.com/amargon/city-of-doors/master/source/data/en/map.json";

const CACHE_PATH = resolve(__dirname, "..", "src", "dataset", "map.json");

async function fetchUpstream() {
  console.log(`Fetching from ${UPSTREAM_URL} ...`);
  const response = await fetch(UPSTREAM_URL);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

function normalize(json) {
  // Re-serialize with consistent formatting so diffs are meaningful
  return JSON.stringify(JSON.parse(json), null, 4) + "\n";
}

async function readCache() {
  if (!existsSync(CACHE_PATH)) return null;
  return readFile(CACHE_PATH, "utf-8");
}

async function writeCache(content) {
  const dir = dirname(CACHE_PATH);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(CACHE_PATH, content, "utf-8");
}

async function main() {
  const force = process.argv.includes("--force");

  let upstream;
  try {
    upstream = normalize(await fetchUpstream());
  } catch (err) {
    console.error(`Failed to fetch upstream: ${err.message}`);
    const cached = await readCache();
    if (cached) {
      console.log("Using existing cached copy.");
      return;
    }
    console.error("No cached copy available either. Aborting.");
    process.exit(1);
  }

  const cached = await readCache();

  if (!force && cached && normalize(cached) === upstream) {
    console.log("Cache is already up to date. No changes written.");
    return;
  }

  await writeCache(upstream);

  const data = JSON.parse(upstream);
  const locationCount = data.levels?.[0]?.locations?.length ?? 0;
  console.log(`Cached ${locationCount} locations to ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
