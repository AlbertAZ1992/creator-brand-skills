import { validate, buildPrompt, buildMesh } from "../src/index.js";

async function main() {
  const { options, errors } = validate({
    logoPath: "./tests/fixtures/simple-logo.png",
    shape: "object",
    depth: 6,
    background: "studio",
  });

  if (errors.length > 0) {
    console.error(errors);
    process.exit(1);
  }

  console.log("=== Clay Render: Prompt ===");
  console.log(buildPrompt(options));
  console.log(`\nChars: ${buildPrompt(options).length}`);

  console.log("\n=== Clay Asset: 3D Mesh ===");
  const result = await buildMesh(options);
  console.log("✅", JSON.stringify(result, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
