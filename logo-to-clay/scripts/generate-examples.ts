import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { buildMesh, validate } from "../src/index.js";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(projectDir, "examples", "assets", "orbit-bloom.png");
const generatedDir = join(projectDir, "examples", "generated");

async function makeManifestPortable(manifestPath: string): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as {
    source: { logoPath: string };
    artifacts: Record<string, string | null>;
  };
  manifest.source.logoPath = "../../assets/orbit-bloom.png";
  for (const [key, value] of Object.entries(manifest.artifacts)) {
    manifest.artifacts[key] = value === null ? null : basename(value);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function buildExample(shape: "object" | "relief", color: string): Promise<string> {
  const outputDir = join(generatedDir, shape);
  await mkdir(outputDir, { recursive: true });
  const validation = validate({
    logoPath: sourcePath,
    output: "mesh",
    outputDir,
    shape,
    depth: shape === "object" ? 5 : 2,
    clayColor: color,
    background: "studio",
  });
  if (validation.errors.length > 0) {
    throw new Error(`Example input failed validation: ${JSON.stringify(validation.errors)}`);
  }
  const result = await buildMesh(validation.options);
  if (!result.validation?.passed || !result.imagePath) {
    throw new Error(`${shape} example did not pass delivery validation`);
  }
  await makeManifestPortable(result.manifestPath!);
  return result.imagePath;
}

async function main(): Promise<void> {
  await mkdir(generatedDir, { recursive: true });
  const objectPreview = await buildExample("object", "#5B4BDB");
  const reliefPreview = await buildExample("relief", "#FF7665");
  const sourcePreview = join(generatedDir, "source.png");
  await sharp(sourcePath)
    .resize({ width: 1200, height: 400, fit: "contain", background: "transparent" })
    .png()
    .toFile(sourcePreview);

  const objectCell = await sharp(objectPreview).resize(720, 720).toBuffer();
  const reliefCell = await sharp(reliefPreview).resize(720, 720).toBuffer();
  const cardBackgrounds = Buffer.from(
    '<svg width="1664" height="800" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="1664" height="800" rx="48" fill="#17142c"/>' +
      '<rect x="48" y="40" width="760" height="720" rx="36" fill="#f8eee2"/>' +
      '<rect x="856" y="40" width="760" height="720" rx="36" fill="#eee9ff"/>' +
      "</svg>",
  );
  await sharp({
    create: { width: 1664, height: 800, channels: 4, background: "#17142c" },
  })
    .composite([
      { input: cardBackgrounds, left: 0, top: 0 },
      { input: objectCell, left: 68, top: 40 },
      { input: reliefCell, left: 876, top: 40 },
    ])
    .png()
    .toFile(join(generatedDir, "mesh-forms.png"));

  process.stdout.write(`Generated Logo to Clay examples in ${generatedDir}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
