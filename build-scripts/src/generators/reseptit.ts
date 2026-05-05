/**
 * Paistaa reseptilistan lukijaversiolle.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { RECIPES, RECIPE_CATEGORIES } from "../../../src/data/recipes.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../../docs/data/reseptit.json");

export async function generateReseptit() {
  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    recipes: RECIPES,
    categories: RECIPE_CATEGORIES,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`  ✓ ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateReseptit();
}
