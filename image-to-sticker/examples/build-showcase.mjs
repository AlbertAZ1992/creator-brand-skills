import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const examplesRoot = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(examplesRoot, "generated/open-source-tech");

const background = `
  <svg width="1400" height="900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1400" height="900" fill="#F7F5EF"/>
    <defs>
      <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="#D5D0C7"/>
      </pattern>
    </defs>
    <rect width="1400" height="900" fill="url(#dots)"/>
  </svg>`;

const placements = [
  ["vite-bolt", 196, 52, 260],
  ["vue", 370, 98, 430],
  ["react", 754, 52, 348],
  ["deno", 1052, 226, 230],
  ["ship-it", 194, 398, 348],
  ["merge-ready", 568, 398, 500],
  ["typescript", 222, 606, 238],
  ["git", 460, 632, 208],
  ["astro", 638, 600, 228],
  ["nodejs", 852, 586, 318],
];

async function prepareSticker(name, width) {
  return sharp(resolve(exampleRoot, `${name}/sticker.png`))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
}

const layers = await Promise.all(
  placements.map(async ([name, left, top, width]) => ({
    input: await prepareSticker(name, width),
    left,
    top,
  })),
);

await sharp(Buffer.from(background))
  .composite(layers)
  .png()
  .toFile(resolve(exampleRoot, "sticker-wall.png"));
