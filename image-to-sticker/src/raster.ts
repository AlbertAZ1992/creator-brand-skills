// Adapted from CatsJuice/sticker-forge (MIT), Copyright (c) 2026 CatsJuice.
// See THIRD_PARTY_NOTICES.md for the full license notice.

import { expandAlphaMask } from "./alpha.js";

type PixelArray = Uint8Array | Uint8ClampedArray;

export interface OutlineComposition {
  rgba: PixelArray;
  alpha: PixelArray;
  width: number;
  height: number;
  radius: number;
  color: string;
}

export interface FlatBackgroundResult {
  rgba: Uint8ClampedArray;
  alpha: Uint8ClampedArray;
}

function assertRgbaDimensions(rgba: PixelArray, width: number, height: number): void {
  if (width < 1 || height < 1 || rgba.length !== width * height * 4) {
    throw new Error("RGBA dimensions do not match the supplied buffer");
  }
}

function cornerBackground(rgba: PixelArray, width: number, height: number): number[] {
  const indices = [0, width - 1, (height - 1) * width, width * height - 1];
  return [0, 1, 2].map((channel) => {
    const values = indices
      .map((index) => rgba[index * 4 + channel] ?? 0)
      .sort((left, right) => left - right);
    return Math.round(((values[1] ?? 0) + (values[2] ?? 0)) / 2);
  });
}

function channelCoverage(value: number, background: number): number {
  if (value < background && background > 0) return (background - value) / background;
  if (value > background && background < 255) return (value - background) / (255 - background);
  return 0;
}

function recoverChannel(value: number, background: number, coverage: number): number {
  return Math.max(0, Math.min(255, Math.round((value - background * (1 - coverage)) / coverage)));
}

export function removeFlatBackground(
  rgba: PixelArray,
  width: number,
  height: number,
  tolerance: number,
): FlatBackgroundResult {
  assertRgbaDimensions(rgba, width, height);
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 255) {
    throw new Error("Background tolerance must be between 0 and 255");
  }
  const background = cornerBackground(rgba, width, height);
  const output = new Uint8ClampedArray(rgba);
  const alpha = new Uint8ClampedArray(width * height);
  for (let index = 0; index < alpha.length; index += 1) {
    const offset = index * 4;
    const difference = Math.max(
      ...[0, 1, 2].map((channel) =>
        Math.abs((rgba[offset + channel] ?? 0) - (background[channel] ?? 0)),
      ),
    );
    const coverage = Math.max(
      ...[0, 1, 2].map((channel) =>
        channelCoverage(rgba[offset + channel] ?? 0, background[channel] ?? 0),
      ),
    );
    const matteCoverage = coverage >= 0.9 ? 1 : coverage;
    const sourceAlpha = (rgba[offset + 3] ?? 0) / 255;
    const outputAlpha = difference <= tolerance ? 0 : Math.round(matteCoverage * sourceAlpha * 255);
    alpha[index] = outputAlpha;
    output[offset + 3] = outputAlpha;
    if (outputAlpha === 0) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      output[offset + channel] = recoverChannel(
        rgba[offset + channel] ?? 0,
        background[channel] ?? 0,
        matteCoverage,
      );
    }
  }
  return { rgba: output, alpha };
}

export function createFlatBackgroundAlpha(
  rgba: PixelArray,
  width: number,
  height: number,
  tolerance: number,
): Uint8ClampedArray {
  return removeFlatBackground(rgba, width, height, tolerance).alpha;
}

function parseHexColor(color: string): number[] {
  const match = /^#([0-9a-f]{6})$/iu.exec(color);
  if (!match?.[1]) throw new Error("Outline color must use #RRGGBB");
  return [0, 2, 4].map((offset) => Number.parseInt(match[1]?.slice(offset, offset + 2) ?? "0", 16));
}

function compositePixel(
  output: Uint8ClampedArray,
  input: OutlineComposition,
  index: number,
  outlineAlpha: number,
  outlineColor: number[],
): void {
  const offset = index * 4;
  const sourceCoverage = (input.alpha[index] ?? 0) / 255;
  const outlineCoverage = (outlineAlpha / 255) * (1 - sourceCoverage);
  const outputCoverage = sourceCoverage + outlineCoverage;
  if (outputCoverage === 0) return;
  for (let channel = 0; channel < 3; channel += 1) {
    const source = (input.rgba[offset + channel] ?? 0) * sourceCoverage;
    const outline = (outlineColor[channel] ?? 0) * outlineCoverage;
    output[offset + channel] = Math.round((source + outline) / outputCoverage);
  }
  output[offset + 3] = Math.round(outputCoverage * 255);
}

export function composeOutline(input: OutlineComposition): Uint8ClampedArray {
  assertRgbaDimensions(input.rgba, input.width, input.height);
  if (input.alpha.length !== input.width * input.height || input.radius < 0) {
    throw new Error("Invalid alpha dimensions or outline radius");
  }
  if (input.radius === 0) {
    const output = new Uint8ClampedArray(input.rgba);
    for (let index = 0; index < input.alpha.length; index += 1) {
      output[index * 4 + 3] = input.alpha[index] ?? 0;
    }
    return output;
  }
  const color = parseHexColor(input.color);
  const outline = expandAlphaMask(input.alpha, input.width, input.height, input.radius);
  const output = new Uint8ClampedArray(input.rgba.length);
  for (let index = 0; index < input.alpha.length; index += 1) {
    compositePixel(output, input, index, outline[index] ?? 0, color);
  }
  return output;
}

export function resolveOutlineRadius(width: number): number {
  return Math.min(112, Math.max(0, width * 2.35));
}
