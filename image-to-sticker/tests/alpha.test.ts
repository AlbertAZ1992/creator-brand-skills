import { describe, expect, it } from "vitest";
import { createExteriorAlphaMask, expandAlphaMask } from "../src/alpha.js";

function ringAlpha(): Uint8ClampedArray {
  return new Uint8ClampedArray([
    0, 0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 255, 0, 255, 0, 0, 255, 255, 255, 0, 0, 0, 0, 0, 0,
  ]);
}

describe("alpha topology", () => {
  it("distinguishes the exterior from an enclosed transparent hole", () => {
    const exterior = createExteriorAlphaMask(ringAlpha(), 5, 5);
    expect(exterior[0]).toBe(1);
    expect(exterior[12]).toBe(0);
  });

  it("builds a soft round outline with Euclidean expansion", () => {
    const alpha = new Uint8ClampedArray(25);
    alpha[12] = 255;
    const expanded = expandAlphaMask(alpha, 5, 5, 1.5);
    expect(expanded[12]).toBe(255);
    expect(expanded[7]).toBe(255);
    expect(expanded[6]).toBeGreaterThan(0);
    expect(expanded[0]).toBe(0);
  });
});
