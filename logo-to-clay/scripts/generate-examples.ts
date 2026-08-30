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

async function writeCapabilityOverview(
  clayRenderPath: string,
  objectPreviewPath: string,
  reliefPreviewPath: string,
): Promise<void> {
  const clayRender = await sharp(clayRenderPath)
    .resize(700, 640, { fit: "cover", position: "centre" })
    .toBuffer();
  const sourceMark = await sharp(sourcePath).resize(128, 128, { fit: "contain" }).toBuffer();
  const objectPreview = await sharp(objectPreviewPath).resize(220, 220).toBuffer();
  const reliefPreview = await sharp(reliefPreviewPath).resize(220, 220).toBuffer();
  const frame = Buffer.from(`
    <svg width="1200" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="720" rx="48" fill="#17142c"/>
      <rect x="32" y="32" width="716" height="656" rx="36" fill="#f8eee2"/>
      <rect x="772" y="32" width="396" height="152" rx="32" fill="#fffaf4"/>
      <rect x="772" y="208" width="396" height="224" rx="32" fill="#eee9ff"/>
      <rect x="772" y="456" width="396" height="232" rx="32" fill="#ffe7de"/>
      <g font-family="Arial, sans-serif" font-weight="700" fill="#242038">
        <text x="802" y="68" font-size="16" letter-spacing="2">SOURCE</text>
        <text x="802" y="248" font-size="16" letter-spacing="2">OBJECT · 5 MM</text>
        <text x="802" y="496" font-size="16" letter-spacing="2">RELIEF · 2 MM</text>
      </g>
    </svg>
  `);
  await sharp({
    create: { width: 1200, height: 720, channels: 4, background: "#17142c" },
  })
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: clayRender, left: 40, top: 40 },
      { input: sourceMark, left: 1008, top: 44 },
      { input: objectPreview, left: 950, top: 208 },
      { input: reliefPreview, left: 950, top: 460 },
    ])
    .png()
    .toFile(join(generatedDir, "capability-overview.png"));
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

  const clayRenderPath = join(generatedDir, "clay-render.png");
  await writeCapabilityOverview(clayRenderPath, objectPreview, reliefPreview);

  process.stdout.write(`Generated Logo to Clay examples in ${generatedDir}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
