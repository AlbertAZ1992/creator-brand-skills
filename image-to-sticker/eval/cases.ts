import type { ImageToStickerInput } from "../src/index.js";

export interface EvalCase {
  name: string;
  input: ImageToStickerInput;
  expected: string[];
  forbidden: string[];
}

export const cases: EvalCase[] = [
  {
    name: "default-simple-sticker",
    input: { imagePath: "./fixtures/wordmark.png" },
    expected: ["complete supplied image", "source rgb pixels", "42.3px", "-3°", "1024"],
    forbidden: ["sticker sheet", "enamel pin", "scene crop"],
  },
  {
    name: "thin-outline-and-tilt",
    input: {
      imagePath: "./fixtures/logo.png",
      backgroundMode: "flat",
      outlineWidth: 1,
      outlineColor: "#fefefe",
      tilt: -10.5,
      size: 512,
    },
    expected: ["2.4px", "#fefefe", "-10.5°", "512"],
    forbidden: ["sticker sheet", "character bible", "fridge magnet"],
  },
  {
    name: "no-outline-transparent-source",
    input: {
      imagePath: "./fixtures/mark.png",
      backgroundMode: "alpha",
      outlineWidth: 0,
      tilt: 0,
    },
    expected: ["0.0px", "existing alpha", "0°", "complete supplied image"],
    forbidden: ["sticker sheet", "holographic", "scene crop"],
  },
  {
    name: "maximum-outline-control",
    input: {
      imagePath: "./fixtures/badge.png",
      outlineWidth: 44,
      outlineColor: "#2f80ed",
      tilt: 12,
    },
    expected: ["103.4px", "#2f80ed", "12°"],
    forbidden: ["hole policy", "scene crop", "enamel"],
  },
  {
    name: "holographic-front-material",
    input: {
      imagePath: "./fixtures/mark.png",
      backgroundMode: "alpha",
      outlineWidth: 4,
      material: "holographic",
      tilt: 0,
    },
    expected: ["holographic front material", "without changing alpha geometry", "complete"],
    forbidden: ["3d scene", "scene crop", "enamel"],
  },
];
