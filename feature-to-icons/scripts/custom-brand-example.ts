import type { FeatureIconInput } from "../src/types.js";

const NAVY = "#172A46";
const YELLOW = "#F7DF1E";
const PAPER = "#FFF8E8";

export const customBrandInput: FeatureIconInput = {
  purpose: "brand",
  features: [
    "Instant Preview",
    "Typed Confidence",
    "Component Canvas",
    "Tiny Bundles",
    "Living Docs",
    "Edge Release",
  ],
  style: "duotone",
  colors: { primary: NAVY, secondary: YELLOW },
  gridSize: 48,
  strokeWidth: 2.5,
  cornerRadius: "round",
  visualWeight: "bold",
  productContext:
    "Nightly is a playful open-source web release studio for JavaScript component teams",
};

export const customBrandRequest =
  "Custom brand feature art for Instant Preview, Typed Confidence, Component Canvas, " +
  "Tiny Bundles, Living Docs, and Edge Release. Use navy and JavaScript yellow on a 48 px grid.";

export const customBrandIcons: Record<string, string> = {
  "Instant Preview": icon(`
    <path d="M7 11.5C7 9.57 8.57 8 10.5 8h27C39.43 8 41 9.57 41 11.5v22C41 35.43 39.43 37 37.5 37h-27A3.5 3.5 0 0 1 7 33.5z" fill="${PAPER}"/>
    <path d="M7 15h34M12 11.5h.01M16 11.5h.01"/>
    <path d="M25.5 18 18 28h6l-1.5 8L31 25h-6z" fill="${YELLOW}" stroke="${NAVY}"/>
  `),
  "Typed Confidence": icon(`
    <path d="m18 11-9 13 9 13M30 11l9 13-9 13"/>
    <path d="M24 9.5 31.5 13v9c0 7-3.1 11.6-7.5 14-4.4-2.4-7.5-7-7.5-14v-9z" fill="${PAPER}"/>
    <path d="m20 23.5 3 3 6-7"/>
    <path d="M24 9.5 31.5 13v9c0 7-3.1 11.6-7.5 14-4.4-2.4-7.5-7-7.5-14v-9z" fill="none"/>
    <circle cx="31.5" cy="13" r="3.5" fill="${YELLOW}" stroke="none"/>
  `),
  "Component Canvas": icon(`
    <rect x="7" y="9" width="15" height="13" rx="3" fill="${PAPER}"/>
    <rect x="26" y="9" width="15" height="13" rx="3" fill="${YELLOW}"/>
    <rect x="7" y="26" width="15" height="13" rx="3" fill="${YELLOW}"/>
    <path d="M27 27v12l4-3 3 6 3-1.5-3-6 5-.5z" fill="${PAPER}"/>
  `),
  "Tiny Bundles": icon(`
    <path d="m24 7 14 7.5v17L24 40 10 31.5v-17z" fill="${PAPER}"/>
    <path d="m10 14.5 14 8 14-8M24 22.5V40"/>
    <path d="m16 10 8 4.5 8-4.5"/>
    <path d="m5.5 24 6 4-6 4M42.5 24l-6 4 6 4" fill="${YELLOW}"/>
  `),
  "Living Docs": icon(`
    <path d="M7 11c7-2 12 .4 17 5v24c-5-4.6-10-7-17-5z" fill="${PAPER}"/>
    <path d="M41 11c-7-2-12 .4-17 5v24c5-4.6 10-7 17-5z" fill="${PAPER}"/>
    <path d="M12 19h6M12 24h7M30 19h6M29 24h7"/>
    <path d="m31 8 2 3.5L37 13l-4 1.5L31 18l-2-3.5L25 13l4-1.5z" fill="${YELLOW}" stroke="none"/>
  `),
  "Edge Release": icon(`
    <path d="M7 34c7-15 17-21 33-20"/>
    <circle cx="9" cy="34" r="4" fill="${YELLOW}"/>
    <circle cx="22" cy="19" r="3" fill="${PAPER}"/>
    <circle cx="39" cy="14" r="4" fill="${YELLOW}"/>
    <path d="m17 34 24-12-8 20-5-8z" fill="${PAPER}"/>
    <path d="m28 34 13-12"/>
  `),
};

export function customBrandRaw(): string {
  return JSON.stringify({ icons: customBrandIcons });
}

function icon(body: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"`,
    ` fill="none" stroke="${NAVY}" stroke-width="2.5"`,
    ` stroke-linecap="round" stroke-linejoin="round">`,
    body.trim(),
    "</svg>",
  ].join("");
}
