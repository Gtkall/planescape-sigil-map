#!/usr/bin/env node
/**
 * Called by semantic-release's @semantic-release/exec prepareCmd.
 * Usage: node scripts/prepare-release.mjs <version>
 *
 * - Updates module.json version and download URL
 * - Copies updated module.json into dist/
 * - Creates planescape-sigil-map.zip from dist/ contents
 */

import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

const version = process.argv[2];
if (!version) {
  console.error("Usage: prepare-release.mjs <version>");
  process.exit(1);
}

const repo = process.env.GITHUB_REPOSITORY ?? "Gtkall/planescape-sigil-map";
const tagName = `v${version}`;
const downloadUrl = `https://github.com/${repo}/releases/download/${tagName}/planescape-sigil-map.zip`;

// Update module.json
const moduleJson = JSON.parse(readFileSync("module.json", "utf-8"));
moduleJson.version = version;
moduleJson.download = downloadUrl;
writeFileSync("module.json", JSON.stringify(moduleJson, null, 2) + "\n");

// Publish updated module.json into the build output
copyFileSync("module.json", "dist/module.json");

// Sync package-lock.json to the bumped package.json version
execSync("npm install --package-lock-only", { stdio: "inherit" });

// Package the build output
execSync("cd dist && zip -r ../planescape-sigil-map.zip .", { stdio: "inherit" });

console.log(`✓ Prepared release ${tagName}`);
console.log(`  download: ${downloadUrl}`);
