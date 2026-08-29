import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { Resvg } from "@resvg/resvg-js";

import { measureSvgOptics, validateFamilyOptics } from "./optical.js";
import type {
  DeliveredIconFamily,
  FeatureIconOutput,
  IconDesignSystem,
  IconFamilyManifest,
  IconOpticalMetrics,
  IconSource,
} from "./types.js";

const CELL_SIZE = 128;
const ICON_SIZE = 72;
const ICON_OFFSET = (CELL_SIZE - ICON_SIZE) / 2;
const CELL_BACKGROUND = [248, 250, 252, 255] as const;
const FORBIDDEN_ELEMENT_RE = /<(?:script|text|foreignObject|image|iframe)\b/i;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=/i;
const EXTERNAL_REFERENCE_RE = /\b(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/)/i;
const EXTERNAL_STYLE_RE = /(?:@import|url\(\s*["']?(?:https?:|\/\/))/i;
const FORBIDDEN_XML_RE = /<!DOCTYPE|<\?xml-stylesheet/i;

export function validateSvgArtifact(
  svg: string,
  design: IconDesignSystem,
  source?: IconSource,
): string[] {
  const errors: string[] = [];
  const expectedViewBox = `0 0 ${design.gridSize} ${design.gridSize}`;

  if (!/^\s*<svg\b[\s\S]*<\/svg>\s*$/i.test(svg)) {
    errors.push("must contain one complete SVG root");
  }
  if (!/\bxmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(svg)) {
    errors.push("must declare the SVG namespace");
  }
  if (!new RegExp(`\\bviewBox=["']${expectedViewBox}["']`, "i").test(svg)) {
    errors.push(`viewBox must equal "${expectedViewBox}"`);
  }
  if (FORBIDDEN_ELEMENT_RE.test(svg)) {
    errors.push("must not contain script, text, foreignObject, image, or iframe elements");
  }
  if (EVENT_HANDLER_RE.test(svg) || EXTERNAL_REFERENCE_RE.test(svg)) {
    errors.push("must not contain event handlers or external references");
  }
  if (EXTERNAL_STYLE_RE.test(svg) || FORBIDDEN_XML_RE.test(svg)) {
    errors.push("must not contain external stylesheets or document type declarations");
  }
  if (source?.type === "library") {
    validateLibrarySource(svg, source, errors);
  } else if (design.style !== "filled") {
    const widths = [...svg.matchAll(/\bstroke-width=["']([^"']+)["']/gi)].map((match) => match[1]);
    if (widths.length === 0) {
      errors.push(`must use stroke-width="${design.strokeWidth}"`);
    } else if (widths.some((width) => Number(width) !== design.strokeWidth)) {
      errors.push(`every stroke-width must equal "${design.strokeWidth}"`);
    }
  }
  return errors;
}

export async function writeIconFamily(
  output: FeatureIconOutput,
  outputDir: string,
): Promise<DeliveredIconFamily> {
  validateOutputArtifacts(output);
  const metrics = output.artifacts.map((artifact) =>
    measureSvgOptics(artifact.feature, artifact.svg, output.designSystem.gridSize),
  );
  const opticalValidation = validateFamilyOptics(metrics, output.designSystem.gridSize);
  if (opticalValidation.errors.length > 0) {
    throw new Error(
      `Icon family failed optical validation: ${opticalValidation.errors.join("; ")}`,
    );
  }
  await mkdir(outputDir, { recursive: true });
  const iconPaths = await writeIcons(output, outputDir);
  const specPath = join(outputDir, "icon-spec.json");
  const metadataPath = join(outputDir, "icon-metadata.json");
  const previewSvgPath = join(outputDir, "icon-family-preview.svg");
  const previewPngPath = join(outputDir, "icon-family-preview.png");
  const manifestPath = join(outputDir, "icon-family-manifest.json");

  await writeJson(specPath, {
    designSystem: output.designSystem,
    source: buildFamilySource(output),
    ...(output.prompt ? { prompt: output.prompt } : {}),
  });
  await writeJson(metadataPath, { icons: output.icons });
  const previewSvg = buildPreviewSvg(output);
  await writeFile(previewSvgPath, previewSvg, "utf8");
  await renderPreview(previewSvg, previewPngPath, output);
  await writeJson(manifestPath, buildManifest(output, metrics, opticalValidation.warnings));

  return { outputDir, manifestPath, previewPath: previewPngPath, iconPaths };
}

async function writeIcons(output: FeatureIconOutput, outputDir: string): Promise<string[]> {
  const paths: string[] = [];
  for (const artifact of output.artifacts) {
    const filePath = join(outputDir, artifact.fileName);
    await writeFile(filePath, `${artifact.svg.trim()}\n`, "utf8");
    paths.push(filePath);
  }
  return paths;
}

function buildPreviewSvg(output: FeatureIconOutput): string {
  const columns = Math.min(4, output.iconCount);
  const rows = Math.ceil(output.iconCount / columns);
  const cells = output.artifacts.map((artifact, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const icon = positionSvg(artifact.svg, ICON_OFFSET, ICON_OFFSET);
    return [
      `<g transform="translate(${column * CELL_SIZE} ${row * CELL_SIZE})">`,
      `<rect x="8" y="8" width="112" height="112" rx="20" fill="#f8fafc"/>`,
      icon,
      "</g>",
    ].join("");
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * CELL_SIZE}"`,
    ` height="${rows * CELL_SIZE}" viewBox="0 0 ${columns * CELL_SIZE} ${rows * CELL_SIZE}">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    ...cells,
    "</svg>",
    "",
  ].join("\n");
}

function positionSvg(svg: string, x: number, y: number): string {
  return svg.trim().replace(/^\s*<svg\b([^>]*)>/i, (_match, attributes: string) => {
    const positioned = attributes.replace(/\s(?:x|y|width|height)=["'][^"']*["']/gi, "");
    return `<svg${positioned} x="${x}" y="${y}" width="${ICON_SIZE}" height="${ICON_SIZE}">`;
  });
}

async function renderPreview(
  source: string,
  destinationPath: string,
  output: FeatureIconOutput,
): Promise<void> {
  try {
    const image = new Resvg(source, { font: { loadSystemFonts: false } }).render();
    verifyPreview(image.pixels, image.width, image.height, output);
    await writeFile(destinationPath, image.asPng());
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not render or verify the icon preview: ${detail}`);
  }
}

function verifyPreview(
  pixels: Buffer,
  width: number,
  height: number,
  output: FeatureIconOutput,
): void {
  const columns = Math.min(4, output.iconCount);
  const expectedWidth = columns * CELL_SIZE;
  const expectedHeight = Math.ceil(output.iconCount / columns) * CELL_SIZE;
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`preview dimensions must equal ${expectedWidth}x${expectedHeight}`);
  }
  for (let index = 0; index < output.artifacts.length; index++) {
    if (!hasVisibleIconPixels(pixels, width, index, columns)) {
      const feature = output.artifacts[index]!.feature;
      throw new Error(`preview contains no visible icon pixels for "${feature}"`);
    }
  }
}

function hasVisibleIconPixels(
  pixels: Buffer,
  width: number,
  index: number,
  columns: number,
): boolean {
  const startX = (index % columns) * CELL_SIZE + ICON_OFFSET;
  const startY = Math.floor(index / columns) * CELL_SIZE + ICON_OFFSET;
  for (let y = startY; y < startY + ICON_SIZE; y++) {
    for (let x = startX; x < startX + ICON_SIZE; x++) {
      const pixel = (y * width + x) * 4;
      if (CELL_BACKGROUND.some((channel, offset) => pixels[pixel + offset] !== channel)) {
        return true;
      }
    }
  }
  return false;
}

function buildManifest(
  output: FeatureIconOutput,
  opticalMetrics: IconOpticalMetrics[],
  warnings: string[],
): IconFamilyManifest {
  return {
    contractVersion: "1.0",
    featureCount: output.iconCount,
    designSystem: output.designSystem,
    source: buildFamilySource(output),
    files: {
      spec: "icon-spec.json",
      metadata: "icon-metadata.json",
      previewSvg: "icon-family-preview.svg",
      previewPng: "icon-family-preview.png",
      icons: output.artifacts.map((artifact) => artifact.fileName),
    },
    validation: {
      passed: true,
      checks: [
        "exact feature coverage",
        "safe self-contained SVG",
        "shared viewBox and stroke width",
        "no text or embedded raster content",
        "preview dimensions and visible icon pixels verified",
        "optical center and occupied bounds verified",
      ],
      opticalMetrics,
      warnings,
    },
  };
}

function buildFamilySource(output: FeatureIconOutput): IconFamilyManifest["source"] {
  const librarySource = output.artifacts[0]?.source;
  const isLibraryFamily = output.artifacts.every(
    (artifact) =>
      artifact.source?.type === "library" && artifact.source.weight === librarySource?.weight,
  );
  if (!isLibraryFamily || librarySource?.type !== "library") {
    return { strategy: "custom", license: "user-provided" };
  }
  return {
    strategy: "library-first",
    library: "Phosphor",
    package: "@phosphor-icons/core",
    version: "2.1.1",
    license: "MIT",
    ...(librarySource.weight ? { weight: librarySource.weight } : {}),
  };
}

function validateOutputArtifacts(output: FeatureIconOutput): void {
  validateFamilySources(output);
  for (const artifact of output.artifacts) {
    const errors = validateSvgArtifact(artifact.svg, output.designSystem, artifact.source);
    if (errors.length > 0) {
      throw new Error(`Invalid SVG for "${artifact.feature}": ${errors.join("; ")}`);
    }
  }
}

function validateFamilySources(output: FeatureIconOutput): void {
  const sourceTypes = new Set(
    output.artifacts.map((artifact) => artifact.source?.type ?? "custom"),
  );
  if (sourceTypes.size > 1) {
    throw new Error("Icon family must not mix library-backed and custom geometry");
  }
  if (!sourceTypes.has("library")) return;
  const weights = new Set(output.artifacts.map((artifact) => artifact.source?.weight));
  if (weights.size > 1) {
    throw new Error("Icon family must use one Phosphor weight");
  }
}

function validateLibrarySource(svg: string, source: IconSource, errors: string[]): void {
  if (source.library !== "Phosphor" || source.package !== "@phosphor-icons/core") {
    errors.push("library source must identify the supported Phosphor package");
    return;
  }
  if (source.version !== "2.1.1" || source.license !== "MIT") {
    errors.push("library source must identify pinned Phosphor 2.1.1 under MIT");
  }
  if (source.geometryModified) {
    errors.push("library-first geometry must remain unmodified");
  }
  if (!source.iconName || !source.weight) {
    errors.push("library source must record icon name and weight");
    return;
  }
  if (!svg.includes(`data-icon-name="${source.iconName}"`)) {
    errors.push("SVG source name must match provenance metadata");
  }
  if (!svg.includes('data-icon-source="phosphor"')) {
    errors.push("SVG must identify Phosphor as its embedded source");
  }
  if (!svg.includes(`data-icon-weight="${source.weight}"`)) {
    errors.push("SVG source weight must match provenance metadata");
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function listedFileNames(output: FeatureIconOutput): string[] {
  return output.artifacts.map((artifact) => basename(artifact.fileName));
}
