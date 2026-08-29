import { describe, expect, it } from "vitest";

import { measureSvgOptics, validateFamilyOptics } from "../src/index.js";

const centered =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
  '<circle cx="12" cy="12" r="8"/></svg>';

const shifted =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
  '<circle cx="4" cy="12" r="2"/></svg>';

describe("optical validation", () => {
  it("measures visible bounds and alpha-weighted center", () => {
    const metric = measureSvgOptics("Centered", centered, 24);
    expect(Math.abs(metric.centerOffset.x)).toBeLessThan(0.1);
    expect(Math.abs(metric.centerOffset.y)).toBeLessThan(0.1);
    expect(metric.bounds.width).toBeGreaterThan(15);
    expect(metric.inkRatio).toBeGreaterThan(0);
  });

  it("rejects a visibly undersized and off-center icon", () => {
    const metric = measureSvgOptics("Shifted", shifted, 24);
    const result = validateFamilyOptics([metric], 24);
    expect(result.errors.join(" ")).toContain("optical center");
    expect(result.errors.join(" ")).toContain("too small");
  });
});
