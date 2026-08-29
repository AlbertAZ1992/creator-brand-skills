import { describe, expect, it } from "vitest";
import { buildPrompt, buildSourceCard, resolveSpec, validate } from "../src/index.js";

describe("simple image-to-sticker contract", () => {
  it("defaults to the Sticker Forge outline, material, and tilt controls", () => {
    expect(resolveSpec({ imagePath: "./logo.png" })).toEqual({
      imagePath: "./logo.png",
      backgroundMode: "auto",
      outlineWidth: 18,
      outlineColor: "#ffffff",
      material: "original",
      tilt: -3,
      size: 1024,
    });
  });

  it("accepts the full simple-image control surface", () => {
    const result = validate({
      imagePath: "./logo.png",
      backgroundMode: "flat",
      outlineWidth: 1,
      outlineColor: "#fefefe",
      material: "holographic",
      tilt: -10.5,
      size: 512,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects removed complex-image options and unknown materials", () => {
    const result = validate({
      imagePath: "./photo.jpg",
      contentMode: "subject",
      style: "enamel-pin",
      holePolicy: "solid",
      backgroundMode: "model",
      material: "chrome",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(["contentMode", "style", "holePolicy", "backgroundMode", "material"]),
    );
  });

  it("enforces the source application's width and tilt ranges", () => {
    const result = validate({
      imagePath: "./logo.png",
      outlineWidth: 45,
      tilt: -12.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { field: "outlineWidth", message: "Must be a number from 0 to 44" },
        { field: "tilt", message: "Must be a number from -12 to 12" },
      ]),
    );
  });

  it("writes a compact V4 source card", () => {
    expect(buildSourceCard({ imagePath: "./logo.png" })).toEqual({
      version: 4,
      sourceImage: "./logo.png",
      backgroundMode: "auto",
      outlineWidth: 18,
      outlineColor: "#ffffff",
      material: "original",
      tilt: -3,
      size: 1024,
    });
  });

  it("describes source pixels, scaled outline radius, and whole-image handling", () => {
    const output = buildPrompt({ imagePath: "./wordmark.png" });
    expect(output.prompt).toContain("Keep the complete supplied image");
    expect(output.prompt).toContain("preserve its existing text");
    expect(output.prompt).toContain("42.3px Euclidean alpha expansion");
    expect(output.prompt).toContain("original front material");
    expect(output.prompt).toContain("-3°");
    expect(output.prompt).not.toContain("segmentation model");
  });
});
