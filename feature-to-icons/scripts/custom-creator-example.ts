import type { FeatureIconInput } from "../src/types.js";

const INK = "#17142C";
const CORAL = "#FF6B57";
const PAPER = "#FFF8E8";

export const creatorStudioInput: FeatureIconInput = {
  purpose: "brand",
  features: [
    "Idea Spark",
    "Visual Compose",
    "Brand System",
    "Smart Export",
    "Asset Library",
    "Launch Story",
  ],
  style: "duotone",
  colors: { primary: INK, secondary: CORAL },
  gridSize: 48,
  strokeWidth: 2.5,
  cornerRadius: "round",
  visualWeight: "bold",
  productContext: "A warm editorial creation studio for independent makers",
};

export const creatorStudioRequest =
  "Original brand feature art for Idea Spark, Visual Compose, Brand System, Smart Export, " +
  "Asset Library, and Launch Story. Use editorial ink and coral on a 48 px grid.";

export const creatorStudioIcons: Record<string, string> = {
  "Idea Spark": icon(`
    <circle cx="24" cy="20" r="16" fill="${CORAL}" stroke="none"/>
    <path d="M15 20a9 9 0 1 1 18 0c0 4-2 6-4.5 8.5L27 30v4h-6v-4l-1.5-1.5C17 26 15 24 15 20Z" fill="${PAPER}"/>
    <path d="M20 38h8M24 4V1M9 9 6 6M39 9l3-3M8 22H4M44 22h-4"/>
    <path d="m24 13 2.2 4.7 5.1.6-3.8 3.5 1 5-4.5-2.5-4.5 2.5 1-5-3.8-3.5 5.1-.6Z" fill="${CORAL}" stroke="none"/>
  `),
  "Visual Compose": icon(`
    <rect x="6" y="8" width="28" height="28" rx="6" fill="${PAPER}"/>
    <path d="M12 27c6-10 11-11 17-11M12 31h16"/>
    <circle cx="13" cy="15" r="3" fill="${CORAL}" stroke="none"/>
    <path d="m29 24 13 5-6 3 3 7-4 2-3-7-5 5Z" fill="${CORAL}"/>
  `),
  "Brand System": icon(`
    <circle cx="17" cy="17" r="10" fill="${PAPER}"/>
    <rect x="23" y="11" width="18" height="18" rx="5" fill="${CORAL}"/>
    <path d="m14 39 10-17 10 17Z" fill="${PAPER}"/>
    <path d="M7 34h8M33 7h8"/>
  `),
  "Smart Export": icon(`
    <path d="M8 16h25v24H8z" fill="${PAPER}"/>
    <path d="M14 16V9h25v24h-6"/>
    <path d="M21 28h18m-6-6 6 6-6 6"/>
    <path d="m12 7 1.5 3L17 12l-3.5 2L12 17l-1.5-3L7 12l3.5-2Z" fill="${CORAL}" stroke="none"/>
  `),
  "Asset Library": icon(`
    <path d="M6 13h15l4 5h17v23H6z" fill="${PAPER}"/>
    <rect x="11" y="24" width="8" height="7" rx="2" fill="${CORAL}"/>
    <rect x="23" y="24" width="8" height="7" rx="2"/>
    <rect x="11" y="34" width="8" height="4" rx="2"/>
    <rect x="23" y="34" width="13" height="4" rx="2" fill="${CORAL}"/>
  `),
  "Launch Story": icon(`
    <path d="m6 25 35-14-10 31-7-11-11 5 4-12Z" fill="${PAPER}"/>
    <path d="m17 24 24-13-17 20"/>
    <circle cx="8" cy="10" r="3" fill="${CORAL}" stroke="none"/>
    <path d="M5 17H1M14 6l3-3"/>
  `),
};

export function creatorStudioRaw(): string {
  return JSON.stringify({ icons: creatorStudioIcons });
}

function icon(body: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"`,
    ` fill="none" stroke="${INK}" stroke-width="2.5"`,
    ` stroke-linecap="round" stroke-linejoin="round">`,
    body.trim(),
    "</svg>",
  ].join("");
}
