import { describe, expect, it } from "vitest";
import { resolveSvgDensity } from "../src/render.js";

describe("SVG sticker rendering", () => {
  it("rasterizes small-viewBox artwork near the requested delivery resolution", () => {
    expect(resolveSvgDensity(24, 24, 2048)).toBe(6144);
    expect(resolveSvgDensity(261, 226, 2048)).toBe(565);
    expect(resolveSvgDensity(4096, 4096, 2048)).toBe(72);
  });
});
