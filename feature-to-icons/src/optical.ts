import { Resvg } from "@resvg/resvg-js";

import type { IconOpticalMetrics } from "./types.js";

const RASTER_SIZE = 256;
const ALPHA_THRESHOLD = 8;
const MAX_CENTER_OFFSET_RATIO = 0.13;
const MIN_DIMENSION_RATIO = 0.24;
const MAX_DIMENSION_RATIO = 0.98;

export function measureSvgOptics(
  feature: string,
  svg: string,
  gridSize: number,
): IconOpticalMetrics {
  const image = new Resvg(svg, {
    fitTo: { mode: "width", value: RASTER_SIZE },
    font: { loadSystemFonts: false },
  }).render();
  const pixels = image.pixels;
  const bounds = findAlphaBounds(pixels, image.width, image.height);
  if (!bounds) {
    throw new Error(`preview contains no visible icon pixels for "${feature}"`);
  }
  const scale = gridSize / image.width;
  const centroid = findAlphaCentroid(pixels, image.width, image.height);
  return {
    feature,
    bounds: {
      x: round(bounds.minX * scale),
      y: round(bounds.minY * scale),
      width: round((bounds.maxX - bounds.minX + 1) * scale),
      height: round((bounds.maxY - bounds.minY + 1) * scale),
    },
    centerOffset: {
      x: round(centroid.x * scale - gridSize / 2),
      y: round(centroid.y * scale - gridSize / 2),
    },
    inkRatio: round(centroid.alpha / (255 * image.width * image.height)),
    occupiedAreaRatio: round(
      ((bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1)) /
        (image.width * image.height),
    ),
  };
}

export function validateFamilyOptics(
  metrics: IconOpticalMetrics[],
  gridSize: number,
): { errors: string[]; warnings: string[] } {
  const errors = metrics.flatMap((metric) => validateMetric(metric, gridSize));
  const warnings = compareFamilyRatios(metrics, "inkRatio", "ink density");
  warnings.push(...compareFamilyRatios(metrics, "occupiedAreaRatio", "optical volume"));
  return { errors, warnings };
}

function validateMetric(metric: IconOpticalMetrics, gridSize: number): string[] {
  const errors: string[] = [];
  const maxOffset = gridSize * MAX_CENTER_OFFSET_RATIO;
  if (Math.abs(metric.centerOffset.x) > maxOffset) {
    errors.push(`${metric.feature}: horizontal optical center exceeds ${round(maxOffset)} px`);
  }
  if (Math.abs(metric.centerOffset.y) > maxOffset) {
    errors.push(`${metric.feature}: vertical optical center exceeds ${round(maxOffset)} px`);
  }
  const widthRatio = metric.bounds.width / gridSize;
  const heightRatio = metric.bounds.height / gridSize;
  if (widthRatio < MIN_DIMENSION_RATIO || heightRatio < MIN_DIMENSION_RATIO) {
    errors.push(`${metric.feature}: visible shape is too small for the shared grid`);
  }
  if (widthRatio > MAX_DIMENSION_RATIO || heightRatio > MAX_DIMENSION_RATIO) {
    errors.push(`${metric.feature}: visible shape leaves insufficient grid padding`);
  }
  return errors;
}

function compareFamilyRatios(
  metrics: IconOpticalMetrics[],
  key: "inkRatio" | "occupiedAreaRatio",
  label: string,
): string[] {
  const median = getMedian(metrics.map((metric) => metric[key]));
  return metrics.flatMap((metric) => {
    const ratio = metric[key] / median;
    if (ratio >= 0.55 && ratio <= 1.8) return [];
    return [`${metric.feature}: ${label} is ${round(ratio)}× the family median`];
  });
}

function findAlphaBounds(
  pixels: Buffer,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3]! <= ALPHA_THRESHOLD) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? undefined : { minX, minY, maxX, maxY };
}

function findAlphaCentroid(
  pixels: Buffer,
  width: number,
  height: number,
): { x: number; y: number; alpha: number } {
  let alpha = 0;
  let weightedX = 0;
  let weightedY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = pixels[(y * width + x) * 4 + 3]!;
      alpha += value;
      weightedX += (x + 0.5) * value;
      weightedY += (y + 0.5) * value;
    }
  }
  return { x: weightedX / alpha, y: weightedY / alpha, alpha };
}

function getMedian(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
