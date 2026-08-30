import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const examplesRoot = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(examplesRoot, "generated/albertaz-brand");
const cases = [
  { slug: "classic", label: "CLASSIC" },
  { slug: "holographic", label: "HOLOGRAPHIC" },
  { slug: "glitter", label: "GLITTER" },
  { slug: "reflective", label: "REFLECTIVE" },
];

function cardPosition(index) {
  return {
    left: 520 + (index % 2) * 520,
    top: 150 + Math.floor(index / 2) * 315,
  };
}

function buildBackground() {
  const cards = cases.map((entry, index) => {
    const { left, top } = cardPosition(index);
    return `
      <rect x="${left}" y="${top}" width="490" height="285" rx="26"
        fill="#FFFEFB" stroke="#DED9CF" stroke-width="2"/>
      <text x="${left + 28}" y="${top + 42}" font-family="Arial, sans-serif"
        font-size="19" font-weight="800" fill="#5B4BDB">${entry.label}</text>`;
  });
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800">
      <rect width="1600" height="800" fill="#F2EFE8"/>
      <text x="40" y="62" font-family="Arial, sans-serif" font-size="36"
        font-weight="800" fill="#17142C">ONE SOURCE. FOUR STICKER FINISHES.</text>
      <text x="40" y="100" font-family="Arial, sans-serif" font-size="19"
        fill="#686270">Every output keeps the complete ALBERTAZ wordmark and real alpha.</text>
      <rect x="40" y="150" width="440" height="600" rx="28"
        fill="#FFFEFB" stroke="#DED9CF" stroke-width="2"/>
      <text x="70" y="198" font-family="Arial, sans-serif" font-size="19"
        font-weight="800" fill="#17142C">LOCKED SOURCE</text>
      <path d="M472 450h35m-12-12 12 12-12 12" fill="none" stroke="#20A7C9"
        stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${cards.join("\n")}
    </svg>`);
}

async function prepareSource() {
  return sharp(resolve(exampleRoot, "sources/albertaz-wordmark.svg"), { density: 300 })
    .trim()
    .resize({ width: 350, height: 180, fit: "inside" })
    .png()
    .toBuffer();
}

async function prepareSticker(slug) {
  return sharp(resolve(exampleRoot, `${slug}/sticker.png`))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 420, height: 195, fit: "inside" })
    .png()
    .toBuffer();
}

const layers = [{ input: await prepareSource(), left: 84, top: 340 }];
for (const [index, entry] of cases.entries()) {
  const { left, top } = cardPosition(index);
  layers.push({ input: await prepareSticker(entry.slug), left: left + 35, top: top + 65 });
}

await sharp(buildBackground())
  .composite(layers)
  .png()
  .toFile(resolve(exampleRoot, "source-to-sticker.png"));
