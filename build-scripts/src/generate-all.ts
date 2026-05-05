/**
 * Pääorkestraattori — ajaa kaikki generaattorit järjestyksessä.
 * Lisää uudet generaattorit tähän, kun sivuja tulee lisää.
 */
import { generateIlmiot } from "./generators/ilmiot.ts";
import { generateReseptit } from "./generators/reseptit.ts";

async function main() {
  console.log("→ ilmiot");
  await generateIlmiot();
  console.log("→ reseptit");
  await generateReseptit();
  console.log("✓ valmis");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
