import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

import sharp from "sharp";

import type { ClayResult, ClayValidationReport } from "./types.js";

export async function verifyClayDeliverables(result: ClayResult): Promise<ClayValidationReport> {
  const paths = requirePaths(result);
  const [obj, material, manifest, preview, bump] = await Promise.all([
    readFile(paths.meshPath, "utf8"),
    readFile(paths.materialPath, "utf8"),
    readManifest(paths.manifestPath),
    sharp(paths.previewPath).metadata(),
    sharp(paths.bumpPath).metadata(),
  ]);
  const vertices = countLines(obj, "v ");
  const faces = countLines(obj, "f ");
  const errors = validateContents(obj, material, manifest, preview, bump, paths);
  if (vertices < 3) errors.push("OBJ must contain at least three vertices");
  if (faces < 1) errors.push("OBJ must contain at least one face");
  if (errors.length > 0) {
    throw new Error(`Clay deliverable validation failed: ${errors.join("; ")}`);
  }

  const report: ClayValidationReport = {
    passed: true,
    checks: [
      "OBJ geometry and material link",
      "MTL clay material and bump texture",
      "1024px PNG preview",
      "manifest artifact paths",
    ],
    geometry: { vertices, faces },
    preview: { width: preview.width!, height: preview.height!, format: preview.format! },
    materialTexture: { width: bump.width!, height: bump.height!, format: bump.format! },
  };
  await writeFile(
    paths.manifestPath,
    `${JSON.stringify({ ...manifest, validation: report }, null, 2)}\n`,
    "utf8",
  );
  return report;
}

function requirePaths(result: ClayResult): RequiredPaths {
  const entries = {
    meshPath: result.meshPath,
    materialPath: result.materialPath,
    bumpPath: result.bumpPath,
    previewPath: result.imagePath,
    manifestPath: result.manifestPath,
  };
  for (const [name, value] of Object.entries(entries)) {
    if (!value) throw new Error(`Clay deliverable is missing ${name}`);
  }
  return entries as RequiredPaths;
}

function validateContents(
  obj: string,
  material: string,
  manifest: Record<string, unknown>,
  preview: PreviewMetadata,
  bump: PreviewMetadata,
  paths: RequiredPaths,
): string[] {
  const errors: string[] = [];
  if (!obj.includes(`mtllib ${basename(paths.materialPath)}`)) {
    errors.push("OBJ does not reference its MTL file");
  }
  if (!/^newmtl\s+\S+/m.test(material) || !/^Kd\s+[\d.]+\s+[\d.]+\s+[\d.]+/m.test(material)) {
    errors.push("MTL does not contain a diffuse clay material");
  }
  if (!material.includes(`map_Bump -bm `) || !material.includes(basename(paths.bumpPath))) {
    errors.push("MTL does not reference its clay bump texture");
  }
  if (preview.format !== "png" || preview.width !== 1024 || preview.height !== 1024) {
    errors.push("preview must be a 1024 x 1024 PNG");
  }
  if (bump.format !== "png" || bump.width !== 512 || bump.height !== 512) {
    errors.push("material bump texture must be a 512 x 512 PNG");
  }
  const artifacts = manifest["artifacts"];
  if (manifest["contractVersion"] !== "1.0" || !isRecord(artifacts)) {
    errors.push("manifest is missing the artifact contract");
  } else if (
    artifacts["meshPath"] !== paths.meshPath ||
    artifacts["materialPath"] !== paths.materialPath ||
    artifacts["bumpPath"] !== paths.bumpPath ||
    artifacts["previewPath"] !== paths.previewPath
  ) {
    errors.push("manifest artifact paths do not match delivered files");
  }
  return errors;
}

function countLines(value: string, prefix: string): number {
  return value.split("\n").filter((line) => line.startsWith(prefix)).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function readManifest(path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isRecord(value)) throw new Error("Clay manifest must be a JSON object");
  return value;
}

interface RequiredPaths {
  meshPath: string;
  materialPath: string;
  bumpPath: string;
  previewPath: string;
  manifestPath: string;
}

interface PreviewMetadata {
  width?: number;
  height?: number;
  format?: string;
}
