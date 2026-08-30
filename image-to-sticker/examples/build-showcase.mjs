import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const examplesRoot = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(examplesRoot, "generated/open-source-tech");
const cases = [
  { slug: "vite-bolt", name: "Vite Bolt", style: "Classic contour" },
  { slug: "react", name: "React", style: "Holographic" },
  { slug: "typescript", name: "TypeScript", style: "Reflective" },
  { slug: "astro", name: "Astro", style: "Glitter" },
  { slug: "vue", name: "Vue", style: "Color contour" },
  { slug: "deno", name: "Deno", style: "Borderless" },
];

function cardPosition(index) {
  return {
    left: 40 + (index % 3) * 510,
    top: 140 + Math.floor(index / 3) * 390,
  };
}

function buildBackground() {
  const cards = cases.map((entry, index) => {
    const { left, top } = cardPosition(index);
    return `
      <rect x="${left}" y="${top}" width="480" height="350" rx="28"
        fill="#FFFEFB" stroke="#DED9CF" stroke-width="2"/>
      <text x="${left + 28}" y="${top + 42}" font-family="Arial, sans-serif"
        font-size="23" font-weight="700" fill="#161925">${entry.name}</text>
      <text x="${left + 452}" y="${top + 42}" text-anchor="end"
        font-family="Arial, sans-serif" font-size="16" font-weight="700"
        fill="#6657D9">${entry.style}</text>
      <rect x="${left + 28}" y="${top + 72}" width="150" height="190" rx="20"
        fill="#F4F2ED"/>
      <text x="${left + 103}" y="${top + 328}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="14" font-weight="700"
        fill="#8A8491">SOURCE</text>
      <text x="${left + 214}" y="${top + 173}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="30" fill="#A39DAC">→</text>
      <text x="${left + 344}" y="${top + 328}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="14" font-weight="700"
        fill="#8A8491">STICKER.PNG</text>`;
  });
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="960">
      <rect width="1600" height="960" fill="#F2EFE8"/>
      <circle cx="1518" cy="66" r="34" fill="#FF6B57"/>
      <text x="40" y="58" font-family="Arial, sans-serif" font-size="34"
        font-weight="800" fill="#161925">SOURCE → VERIFIED STICKER</text>
      <text x="40" y="94" font-family="Arial, sans-serif" font-size="18"
        fill="#686270">Six inputs. Four materials. Three contour treatments.</text>
      ${cards.join("\n")}
    </svg>`);
}

async function prepareSource(slug) {
  return sharp(resolve(exampleRoot, `sources/${slug}.svg`), { density: 300 })
    .trim()
    .resize({ width: 118, height: 150, fit: "inside" })
    .png()
    .toBuffer();
}

async function prepareSticker(slug) {
  return sharp(resolve(exampleRoot, `${slug}/sticker.png`))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 196, height: 196, fit: "inside" })
    .png()
    .toBuffer();
}

async function buildLayers() {
  const layers = [];
  for (const [index, entry] of cases.entries()) {
    const { left, top } = cardPosition(index);
    layers.push({ input: await prepareSource(entry.slug), left: left + 44, top: top + 92 });
    layers.push({ input: await prepareSticker(entry.slug), left: left + 250, top: top + 84 });
  }
  return layers;
}

await sharp(buildBackground())
  .composite(await buildLayers())
  .png()
  .toFile(resolve(exampleRoot, "source-to-sticker.png"));
