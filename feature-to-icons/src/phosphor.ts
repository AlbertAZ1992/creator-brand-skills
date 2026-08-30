import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { icons } from "@phosphor-icons/core";

import type {
  FeatureIconInput,
  FeatureIconOutput,
  IconArtifact,
  IconCandidate,
  IconDesignSystem,
  IconOverrides,
  IconSource,
  PhosphorWeight,
} from "./types.js";

const PACKAGE_NAME = "@phosphor-icons/core" as const;
const PACKAGE_VERSION = "2.1.1" as const;
const require = createRequire(import.meta.url);
const STOP_WORDS = new Set(["a", "an", "and", "for", "of", "the", "to", "with"]);

const PREFERRED_ICONS: Readonly<Record<string, string>> = {
  search: "magnifying-glass",
  filters: "funnel",
  filter: "funnel",
  "team sharing": "users-three",
  "cloud sync": "cloud-arrow-up",
  dashboard: "squares-four",
  analytics: "chart-pie-slice",
  reports: "presentation-chart",
  trends: "chart-line-up",
  "export data": "database",
  "team chat": "chats-circle",
  "file sharing": "file-arrow-up",
  "video calls": "video-camera",
  "task board": "kanban",
  calendar: "calendar-blank",
  "shopping cart": "shopping-cart",
  wishlist: "heart",
  orders: "package",
  payment: "credit-card",
  delivery: "truck",
  authentication: "shield-check",
  encryption: "lock-key",
  "access control": "key",
  "audit log": "clipboard-text",
  alerts: "warning",
  "image generation": "image",
  "background removal": "selection-background",
  "brand kit": "briefcase",
  "export assets": "folder-simple-plus",
  templates: "stack",
  settings: "gear",
  notifications: "bell",
  users: "users",
  profile: "user",
  upload: "upload-simple",
  download: "download-simple",
  share: "share-network",
  security: "shield-check",
  help: "question",
  warning: "warning",
  email: "envelope",
  location: "map-pin",
  refresh: "arrows-clockwise",
  sync: "arrows-clockwise",
  automation: "lightning",
  integration: "puzzle-piece",
  workflow: "flow-arrow",
  "ai copilot": "head-circuit",
  "knowledge search": "book-open-text",
  "single sign on": "sign-in",
  "version history": "clock-counter-clockwise",
  "user management": "users-three",
};

export function searchPhosphorIcons(
  feature: string,
  limit = 5,
  productContext = "",
): IconCandidate[] {
  const normalized = normalize(feature);
  if (!normalized) return [];
  const preferred = PREFERRED_ICONS[normalized];
  if (preferred) return preferredCandidates(preferred, limit);

  const queryTokens = tokenize(`${normalized} ${productContext}`);
  return icons
    .map((icon) => scoreIcon(icon, normalized, queryTokens))
    .filter((candidate) => candidate.confidence > 0)
    .sort(compareCandidates)
    .slice(0, limit);
}

export async function buildPhosphorIconFamily(
  input: FeatureIconInput,
  designSystem: IconDesignSystem,
  overrides: IconOverrides = {},
): Promise<FeatureIconOutput> {
  if (designSystem.purpose !== "system") {
    throw new Error(
      "Phosphor is only available for purpose=system; brand feature art requires custom SVG",
    );
  }
  if (input.cornerRadius === "sharp") {
    throw new Error(
      "Phosphor library mode does not provide a sharp-corner family; use the custom fallback",
    );
  }
  const weight = selectWeight(input);
  const libraryDesignSystem: IconDesignSystem = {
    ...designSystem,
    geometryPolicy: "library-native",
    sourceWeight: weight,
  };
  const artifacts = await Promise.all(
    input.features.map((feature) =>
      buildArtifact(feature, input, libraryDesignSystem, weight, overrides),
    ),
  );
  ensureUniqueArtifacts(artifacts);
  return {
    prompt: "",
    iconCount: artifacts.length,
    icons: artifacts.map(({ fileName: _fileName, svg: _svg, ...metadata }) => metadata),
    artifacts,
    designSystem: libraryDesignSystem,
  };
}

export function selectWeight(input: FeatureIconInput): PhosphorWeight {
  if (input.style === "filled") return "fill";
  if (input.style === "duotone") return "duotone";
  if (input.visualWeight === "light" || (input.strokeWidth ?? 2) < 2) return "light";
  if (input.visualWeight === "bold" || (input.strokeWidth ?? 2) > 2.25) return "bold";
  return "regular";
}

async function buildArtifact(
  feature: string,
  input: FeatureIconInput,
  designSystem: IconDesignSystem,
  weight: PhosphorWeight,
  overrides: IconOverrides,
): Promise<IconArtifact> {
  const candidate = resolveCandidate(feature, overrides[feature], input.productContext);
  const source = buildSource(candidate.iconName, weight);
  const rawSvg = await readPhosphorSvg(candidate.iconName, weight);
  const svg = adaptSvg(rawSvg, candidate.iconName, weight, input, designSystem);
  return {
    feature,
    semanticConcept: humanize(candidate.iconName),
    visualDescription: `Phosphor ${weight} icon “${candidate.iconName}” selected for ${feature}`,
    source,
    fileName: `${slugify(feature)}.svg`,
    svg,
  };
}

function resolveCandidate(
  feature: string,
  override: string | undefined,
  productContext: string | undefined,
): IconCandidate {
  if (override) {
    const icon = icons.find((entry) => entry.name === override);
    if (!icon) throw new Error(`Unknown Phosphor icon override "${override}" for "${feature}"`);
    return toCandidate(icon, 1, "override");
  }
  const candidate = searchPhosphorIcons(feature, 1, productContext)[0];
  if (!candidate || candidate.confidence < 0.4) {
    const suggestions = searchPhosphorIcons(feature, 3, productContext).map(
      (item) => item.iconName,
    );
    const detail = suggestions.length > 0 ? ` Candidates: ${suggestions.join(", ")}.` : "";
    throw new Error(`No confident Phosphor match for "${feature}".${detail} Provide an override.`);
  }
  return candidate;
}

function ensureUniqueArtifacts(artifacts: IconArtifact[]): void {
  const fileNames = new Set<string>();
  const iconNames = new Set<string>();
  for (const artifact of artifacts) {
    if (fileNames.has(artifact.fileName)) {
      throw new Error(`Feature names produce the same output filename: ${artifact.fileName}`);
    }
    fileNames.add(artifact.fileName);
    const iconName = artifact.source?.iconName;
    if (iconName && iconNames.has(iconName)) {
      throw new Error(`Phosphor icon "${iconName}" was selected more than once in the family`);
    }
    if (iconName) iconNames.add(iconName);
  }
}

async function readPhosphorSvg(iconName: string, weight: PhosphorWeight): Promise<string> {
  const suffix = weight === "regular" ? "" : `-${weight}`;
  const specifier = `${PACKAGE_NAME}/${weight}/${iconName}${suffix}.svg`;
  return readFile(require.resolve(specifier), "utf8");
}

function adaptSvg(
  rawSvg: string,
  iconName: string,
  weight: PhosphorWeight,
  input: FeatureIconInput,
  designSystem: IconDesignSystem,
): string {
  const gridSize = designSystem.gridSize;
  const bodyMatch = rawSvg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  if (!bodyMatch?.[1]) throw new Error(`Phosphor asset "${iconName}" is not a complete SVG`);
  const primary = input.colors?.primary ?? "currentColor";
  const body = applyDuotoneColor(bodyMatch[1], weight, input.colors?.secondary);
  const scale = gridSize / 256;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}"`,
    ` fill="${primary}" data-icon-source="phosphor" data-icon-name="${iconName}"`,
    ` data-icon-weight="${weight}">`,
    `<g transform="scale(${scale})">${body.trim()}</g>`,
    "</svg>",
  ].join("");
}

function applyDuotoneColor(
  body: string,
  weight: PhosphorWeight,
  secondary: string | undefined,
): string {
  if (weight !== "duotone" || !secondary) return body;
  return body.replace(/<path\b([^>]*?)\sopacity="0\.2"([^>]*)>/i, (_match, before, after) => {
    return `<path${before} fill="${secondary}" opacity="0.28"${after}>`;
  });
}

function buildSource(iconName: string, weight: PhosphorWeight): IconSource {
  return {
    type: "library",
    library: "Phosphor",
    package: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    iconName,
    weight,
    license: "MIT",
    geometryModified: false,
    presentationModified: true,
  };
}

function preferredCandidates(iconName: string, limit: number): IconCandidate[] {
  const icon = icons.find((entry) => entry.name === iconName);
  if (!icon) throw new Error(`Configured Phosphor icon does not exist: ${iconName}`);
  const preferred = toCandidate(icon, 1, "preferred");
  const related = icons
    .filter((entry) => entry.name !== iconName)
    .map((entry) => scoreIcon(entry, iconName, tokenize(iconName)))
    .filter((candidate) => candidate.confidence > 0)
    .sort(compareCandidates);
  return [preferred, ...related].slice(0, limit);
}

function scoreIcon(
  icon: (typeof icons)[number],
  query: string,
  queryTokens: string[],
): IconCandidate {
  if (!query || queryTokens.length === 0) return toCandidate(icon, 0, "metadata");
  const name = normalize(icon.name);
  if (name === query) return toCandidate(icon, 0.95, "name");
  const nameTokens = tokenize(name);
  const metadataTokens = tokenize([...icon.tags, ...icon.categories].join(" "));
  const nameOverlap = intersectionSize(queryTokens, nameTokens);
  const metadataOverlap = intersectionSize(queryTokens, metadataTokens);
  const containsBonus = name.includes(query) || query.includes(name) ? 0.35 : 0;
  const confidence = Math.min(0.9, containsBonus + nameOverlap * 0.24 + metadataOverlap * 0.09);
  return toCandidate(icon, confidence, nameOverlap > 0 ? "name" : "metadata");
}

function toCandidate(
  icon: (typeof icons)[number],
  confidence: number,
  matchedBy: IconCandidate["matchedBy"],
): IconCandidate {
  return {
    iconName: icon.name,
    confidence: Math.round(confidence * 1000) / 1000,
    matchedBy,
    tags: [...icon.tags],
    categories: [...icon.categories],
  };
}

function compareCandidates(left: IconCandidate, right: IconCandidate): number {
  return right.confidence - left.confidence || left.iconName.localeCompare(right.iconName);
}

function intersectionSize(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return new Set(left.filter((token) => rightSet.has(token))).size;
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function humanize(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "icon"
  );
}
