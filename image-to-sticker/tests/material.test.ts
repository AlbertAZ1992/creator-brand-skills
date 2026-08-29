import { describe, expect, it } from "vitest";
import { applyMaterial } from "../src/material.js";

function sourceFixture(): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(32 * 32 * 4);
  for (let index = 0; index < 32 * 32; index += 1) {
    rgba.set([20, 40, 60, 255], index * 4);
  }
  rgba.set([140, 160, 180, 0], 7 * 4);
  return rgba;
}

function alphaBytes(rgba: Uint8ClampedArray): number[] {
  const alpha: number[] = [];
  for (let index = 3; index < rgba.length; index += 4) alpha.push(rgba[index] ?? 0);
  return alpha;
}

describe("Sticker Forge-compatible front materials", () => {
  it("leaves original pixels byte-for-byte unchanged", () => {
    const source = sourceFixture();
    const output = applyMaterial({ rgba: source, width: 32, height: 32, material: "original" });
    expect(output).toEqual(source);
  });

  it.each(["holographic", "glitter", "reflective"] as const)(
    "preserves alpha while %s changes visible RGB",
    (material) => {
      const source = sourceFixture();
      const output = applyMaterial({ rgba: source, width: 32, height: 32, material });
      expect(alphaBytes(output)).toEqual(alphaBytes(source));
      expect(output).not.toEqual(source);
      expect(output.slice(7 * 4, 7 * 4 + 4)).toEqual(source.slice(7 * 4, 7 * 4 + 4));
    },
  );

  it("is deterministic for repeated renders", () => {
    const input = {
      rgba: sourceFixture(),
      width: 32,
      height: 32,
      material: "glitter" as const,
    };
    expect(applyMaterial(input)).toEqual(applyMaterial(input));
  });
});
