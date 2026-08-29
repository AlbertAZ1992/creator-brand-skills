import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMesh, validate } from "../src/index.js";

async function main(): Promise<void> {
  const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
  const outputDir = await mkdtemp(join(tmpdir(), "logo-to-clay-eval-"));
  const validation = validate({
    logoPath: join(projectDir, "tests", "fixtures", "simple-logo.png"),
    output: "mesh",
    outputDir,
    shape: "object",
    depth: 4,
    clayColor: "#C4956A",
    background: "studio",
  });
  if (validation.errors.length > 0) {
    throw new Error(`Fixture input failed validation: ${JSON.stringify(validation.errors)}`);
  }

  try {
    const result = await buildMesh(validation.options);
    if (!result.validation?.passed || !result.manifestPath || !result.imagePath) {
      throw new Error("The mesh pipeline did not return verified deliverables");
    }
    console.log("PASS real clay mesh deliverable");
    console.log(
      `  ${result.validation.geometry.vertices} vertices, ` +
        `${result.validation.geometry.faces} faces, 1024px preview`,
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
