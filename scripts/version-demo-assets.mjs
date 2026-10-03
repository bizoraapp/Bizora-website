#!/usr/bin/env node
/**
 * version-demo-assets.mjs
 * Stamps pages/demo.html with a content-based version on its CSS and JS links
 * (e.g. /js/demo.js?v=1a2b3c4d), so browsers that saved an older copy (the site
 * caches /css and /js for 24 hours) fetch the new files straight away.
 * Run after changing css/demo.css, js/demo.js or js/demo-model.js:
 *   node scripts/version-demo-assets.mjs
 * tests/seo-static.test.mjs fails if the stamp is out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ASSETS = ["css/demo.css", "js/demo-model.js", "js/demo.js"];
export const demoVersion = (r = root) =>
  createHash("sha256").update(ASSETS.map((a) => readFileSync(join(r, a), "utf8")).join("\n")).digest("hex").slice(0, 8);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const v = demoVersion();
  const file = join(root, "pages/demo.html");
  let html = readFileSync(file, "utf8");
  for (const a of ASSETS) html = html.replace(new RegExp(`(["'])/${a.replace(".", "\\.")}(\\?v=[0-9a-f]+)?\\1`), `$1/${a}?v=${v}$1`);
  writeFileSync(file, html);
  console.log(`pages/demo.html stamped with ?v=${v}`);
}
