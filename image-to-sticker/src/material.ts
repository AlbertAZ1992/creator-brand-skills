// Adapted from CatsJuice/sticker-forge (MIT), Copyright (c) 2026 CatsJuice.
// See THIRD_PARTY_NOTICES.md for the full license notice.

import type { StickerMaterial } from "./types.js";

const MODULUS = 2_147_483_647;
const MULTIPLIER = 48_271;
const INTENSITY = 0.86;
const GRAIN = 0.72;
const SEED = 0.37;
const HOLOGRAPHIC_COLORS = ["#f2a7c5", "#8edfd5", "#9db4ea"] as const;

export interface MaterialInput {
  rgba: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  material: StickerMaterial;
}

type Rgb = readonly [number, number, number];

function parseHex(color: string): Rgb {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const HOLOGRAPHIC_RGB = HOLOGRAPHIC_COLORS.map(parseHex);

function blendAtop(output: Uint8ClampedArray, index: number, color: Rgb, opacity: number): void {
  const offset = index * 4;
  if ((output[offset + 3] ?? 0) === 0 || opacity <= 0) return;
  const amount = Math.min(1, opacity);
  for (let channel = 0; channel < 3; channel += 1) {
    const source = output[offset + channel] ?? 0;
    output[offset + channel] = Math.round(source * (1 - amount) + (color[channel] ?? 0) * amount);
  }
}

function diagonalPhase(x: number, y: number, width: number, height: number): number {
  const denominator = width * width + height * height;
  return (x * width + (height - y) * height) / denominator;
}

function mix(left: Rgb, right: Rgb, amount: number): Rgb {
  return [0, 1, 2].map((channel) =>
    Math.round((left[channel] ?? 0) * (1 - amount) + (right[channel] ?? 0) * amount),
  ) as unknown as Rgb;
}

function holographicColor(phase: number): Rgb {
  const position = ((phase % 1) + 1) % 1;
  const scaled = position * 3;
  const index = Math.floor(scaled) % 3;
  const fallback: Rgb = [242, 167, 197];
  return mix(
    HOLOGRAPHIC_RGB[index] ?? fallback,
    HOLOGRAPHIC_RGB[(index + 1) % 3] ?? fallback,
    scaled - index,
  );
}

function seededValues(count: number): Float64Array {
  const values = new Float64Array(count);
  let state = Math.floor(SEED * MODULUS) || 1;
  for (let index = 0; index < count; index += 1) {
    state = (state * MULTIPLIER) % MODULUS;
    values[index] = state / MODULUS;
  }
  return values;
}

function applyReflective(output: Uint8ClampedArray, width: number, height: number): void {
  const white: Rgb = [255, 255, 255];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((output[(y * width + x) * 4 + 3] ?? 0) === 0) continue;
      const phase = diagonalPhase(x + 0.5, y + 0.5, width, height);
      const position = phase - Math.floor(phase);
      let opacity = 0;
      if (position >= 0.25 && position < 0.46) opacity = (0.7 * (position - 0.25)) / 0.21;
      else if (position < 0.58 && position >= 0.46) {
        opacity = 0.7 + ((0.14 - 0.7) * (position - 0.46)) / 0.12;
      } else if (position <= 0.78 && position >= 0.58) {
        opacity = 0.14 * (1 - (position - 0.58) / 0.2);
      }
      blendAtop(output, y * width + x, white, opacity * INTENSITY);
    }
  }
}

function applyHolographic(output: Uint8ClampedArray, width: number, height: number): void {
  const noise = seededValues(96 * 96 * 2);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if ((output[index * 4 + 3] ?? 0) === 0) continue;
      const phase = diagonalPhase(x + 0.5, y + 0.5, width, height);
      blendAtop(output, index, holographicColor(phase), 0.24 * INTENSITY);
      const noiseIndex = ((y % 96) * 96 + (x % 96)) * 2;
      const brightness = (noise[noiseIndex] ?? 0) > 0.48 ? 255 : 20;
      const noiseAlpha = 38 + (noise[noiseIndex + 1] ?? 0) * 74;
      const opacity = (noiseAlpha / 255) * 0.42 * INTENSITY * GRAIN;
      blendAtop(output, index, [brightness, brightness, brightness], opacity);
    }
  }
}

function fillFlake(
  output: Uint8ClampedArray,
  width: number,
  height: number,
  flake: { x: number; y: number; size: number; color: Rgb; opacity: number },
): void {
  const right = Math.min(width, Math.ceil(flake.x + flake.size));
  const bottom = Math.min(height, Math.ceil(flake.y + flake.size));
  for (let y = Math.max(0, Math.floor(flake.y)); y < bottom; y += 1) {
    for (let x = Math.max(0, Math.floor(flake.x)); x < right; x += 1) {
      const overlapX = Math.min(x + 1, flake.x + flake.size) - Math.max(x, flake.x);
      const overlapY = Math.min(y + 1, flake.y + flake.size) - Math.max(y, flake.y);
      blendAtop(output, y * width + x, flake.color, flake.opacity * overlapX * overlapY);
    }
  }
}

function applyGlitter(output: Uint8ClampedArray, width: number, height: number): void {
  const count = Math.min(8000, Math.round((width * height) / 520));
  const random = seededValues(count * 5);
  const lightAngle = Math.atan2(0.52, -0.38);
  for (let index = 0; index < count; index += 1) {
    const offset = index * 5;
    const x = (random[offset] ?? 0) * width;
    const y = (random[offset + 1] ?? 0) * height;
    const orientation = ((x * 0.013 + y * 0.017 + SEED * 7) % 1) * Math.PI * 2;
    const twinkle = 0.18 + Math.max(0, Math.cos(orientation - lightAngle)) ** 10 * 0.82;
    fillFlake(output, width, height, {
      x,
      y,
      color: (random[offset + 2] ?? 0) > 0.5 ? [255, 255, 255] : [52, 40, 31],
      opacity: 0.38 * INTENSITY * (random[offset + 3] ?? 0) * twinkle,
      size: 0.7 + (random[offset + 4] ?? 0) * 1.8,
    });
  }
}

export function applyMaterial(input: MaterialInput): Uint8ClampedArray {
  if (input.width < 1 || input.height < 1 || input.rgba.length !== input.width * input.height * 4) {
    throw new Error("RGBA dimensions do not match the supplied buffer");
  }
  const output = new Uint8ClampedArray(input.rgba);
  if (input.material === "reflective") applyReflective(output, input.width, input.height);
  if (input.material === "holographic") applyHolographic(output, input.width, input.height);
  if (input.material === "glitter") applyGlitter(output, input.width, input.height);
  return output;
}
