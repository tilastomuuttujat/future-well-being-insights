/**
 * Paistaa ilmiöverkon JSON-paketin lukijaversiolle.
 *
 * Lähde: ../../src/features/ilmiot/data.ts (staattinen). Funktio-kentät
 * (esim. driver.fmt) eivät serialisoidu — ne uudelleenrakennetaan
 * lukijapuolella formaatti-stringistä ja unitista.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHENOMENA, DRIVERS, LINKS, PHENOM_LINKS, SCENARIOS, CONF_META,
} from "../../../src/features/ilmiot/data.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../../docs/data/ilmiot.json");

export async function generateIlmiot() {
  // Drivers: pudota fmt-funktio, säilytä kaikki muu
  const drivers: Record<string, any> = {};
  for (const [k, d] of Object.entries(DRIVERS)) {
    const { fmt, ...rest } = d as any;
    drivers[k] = rest;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    phenomena: PHENOMENA,
    drivers,
    links: LINKS,
    phenomLinks: PHENOM_LINKS,
    scenarios: SCENARIOS,
    confMeta: CONF_META,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`  ✓ ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateIlmiot();
}
