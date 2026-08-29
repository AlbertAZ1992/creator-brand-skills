import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { buildMesh, validate } from "../src/index.js";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(projectDir, "examples", "assets", "threads-wordmark.png");
const generatedDir = join(projectDir, "examples", "generated");

async function makeManifestPortable(manifestPath: string): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as {
    source: { logoPath: string };
    artifacts: Record<string, string | null>;
  };
  manifest.source.logoPath = "../../assets/threads-wordmark.png";
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

function labelSvg(label: string): Buffer {
  return Buffer.from(
    `<svg width="960" height="80"><text x="480" y="54" text-anchor="middle" ` +
      `font-family="Arial,sans-serif" font-size="34" font-weight="700" ` +
      `fill="#29251f">${label}</text></svg>`,
  );
}

async function main(): Promise<void> {
  await mkdir(generatedDir, { recursive: true });
  const objectPreview = await buildExample("object", "#C98E68");
  const reliefPreview = await buildExample("relief", "#7B68A6");
  const sourcePreview = join(generatedDir, "source.png");
  await sharp(sourcePath)
    .resize({ width: 1200, height: 400, fit: "contain", background: "transparent" })
    .png()
    .toFile(sourcePreview);

  const objectCell = await sharp(objectPreview).resize(960, 960).toBuffer();
  const reliefCell = await sharp(reliefPreview).resize(960, 960).toBuffer();
  await sharp({
    create: { width: 2048, height: 1120, channels: 4, background: "#eee9e1" },
  })
    .composite([
      { input: objectCell, left: 48, top: 48 },
      { input: reliefCell, left: 1040, top: 48 },
      { input: labelSvg("Standalone object · 5 mm"), left: 48, top: 1020 },
      { input: labelSvg("Relief · 2 mm"), left: 1040, top: 1020 },
    ])
    .png()
    .toFile(join(generatedDir, "mesh-forms.png"));

  process.stdout.write(`Generated Logo to Clay examples in ${generatedDir}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
