import { describe, expect, it } from "vitest";
import {
  composeOutline,
  createFlatBackgroundAlpha,
  removeFlatBackground,
  resolveOutlineRadius,
} from "../src/raster.js";

function opaqueWhite(width: number, height: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    rgba.set([255, 255, 255, 255], index * 4);
  }
  return rgba;
}

function ringAlpha(size: number): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(size * size);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (x === 1 || y === 1 || x === size - 2 || y === size - 2) {
        alpha[y * size + x] = 255;
      }
    }
  }
  return alpha;
}

describe("Sticker Forge-compatible raster behavior", () => {
  it("removes matching flat background inside and outside the artwork", () => {
    const rgba = opaqueWhite(5, 5);
    for (const index of [6, 7, 8, 11, 13, 16, 17, 18]) {
      rgba.set([12, 24, 36, 255], index * 4);
    }
    const alpha = createFlatBackgroundAlpha(rgba, 5, 5, 12);
    expect(alpha[0]).toBe(0);
    expect(alpha[12]).toBe(0);
    expect(alpha[6]).toBe(255);
  });

  it("converts a white-matted gray edge into black RGB with soft alpha", () => {
    const rgba = opaqueWhite(3, 3);
    rgba.set([127, 127, 127, 255], 4 * 4);
    const result = removeFlatBackground(rgba, 3, 3, 18);
    expect(result.alpha[4]).toBe(128);
    expect(result.rgba.slice(4 * 4, 4 * 4 + 4)).toEqual(new Uint8ClampedArray([0, 0, 0, 128]));
  });

  it("maps UI outline width to the source application's Euclidean radius", () => {
    expect(resolveOutlineRadius(0)).toBe(0);
    expect(resolveOutlineRadius(1)).toBeCloseTo(2.35);
    expect(resolveOutlineRadius(18)).toBeCloseTo(42.3);
    expect(resolveOutlineRadius(44)).toBeCloseTo(103.4);
  });

  it("lets wider outlines naturally cover small internal holes", () => {
    const size = 9;
    const rgba = new Uint8ClampedArray(size * size * 4);
    const alpha = ringAlpha(size);
    for (let index = 0; index < alpha.length; index += 1) {
      if (alpha[index] === 255) rgba.set([0, 0, 0, 255], index * 4);
    }
    const narrow = composeOutline({
      rgba,
      alpha,
      width: size,
      height: size,
      radius: resolveOutlineRadius(1),
      color: "#ffffff",
    });
    const wide = composeOutline({
      rgba,
      alpha,
      width: size,
      height: size,
      radius: resolveOutlineRadius(2),
      color: "#ffffff",
    });
    expect(narrow[40 * 4 + 3]).toBe(0);
    expect(wide[40 * 4 + 3]).toBe(255);
  });

  it("draws the source over the outline without changing opaque source RGB", () => {
    const rgba = new Uint8ClampedArray(5 * 5 * 4);
    rgba.set([210, 30, 40, 255], 12 * 4);
    const alpha = new Uint8ClampedArray(25);
    alpha[12] = 255;
    const output = composeOutline({
      rgba,
      alpha,
      width: 5,
      height: 5,
      radius: 1.5,
      color: "#ffffff",
    });
    expect(output.slice(12 * 4, 12 * 4 + 4)).toEqual(new Uint8ClampedArray([210, 30, 40, 255]));
  });

  it("keeps soft source pixels unchanged when outline width is zero", () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 128]);
    const alpha = new Uint8ClampedArray([128]);
    const output = composeOutline({
      rgba,
      alpha,
      width: 1,
      height: 1,
      radius: 0,
      color: "#ffffff",
    });
    expect(output).toEqual(new Uint8ClampedArray([0, 0, 0, 128]));
  });
});
