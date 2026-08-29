import { validate, buildPrompt } from "../src/index.js";

const SAMPLE_INPUT = {
  features: ["Dark Mode", "Export PDF", "Team Sharing", "Cloud Sync"],
  style: "outline" as const,
  colors: { primary: "#6366F1", secondary: "#818CF8" },
  gridSize: 24 as const,
  strokeWidth: 2,
  cornerRadius: "rounded" as const,
  visualWeight: "regular" as const,
  productContext: "A productivity app for creative teams",
};

const result = validate(SAMPLE_INPUT);

if (result.errors && result.errors.length > 0) {
  console.error("Validation errors:");
  for (const e of result.errors) {
    console.error(`  ${e.field}: ${e.message}`);
  }
  process.exit(1);
}

const prompt = buildPrompt(result.data!);
console.log(prompt);
console.log();

if (process.argv.includes("--generate")) {
  // For SVG icon generation, the prompt is designed for an LLM to produce SVG code.
  // We wrap it with a request to return just the description suitable for DALL-E.
  const imagePrompt = `A clean preview grid showing 4 matching outlined icons at 24x24px viewBox: crescent moon icon (Dark Mode), document with download arrow icon (Export PDF), two connected people icon (Team Sharing), cloud with sync arrows icon (Cloud Sync). All share identical 2px indigo (#6366F1) outlines, rounded corners, and consistent visual weight. Each icon on its own card with label underneath, presented as a product screenshot mockup for a productivity app.`;
  await generateImage(imagePrompt);
} else {
  console.log("If you have an OpenAI API key:");
  console.log('  export OPENAI_API_KEY="sk-..."');
  console.log("  npx tsx verify.ts --generate");
  console.log();
  console.log("Without a key:");
  console.log(
    "  Copy the prompt above into ChatGPT/Claude and ask it to generate the icons as SVGs.",
  );
}

async function generateImage(promptText: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("\nSet OPENAI_API_KEY to generate images automatically.");
    return;
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: promptText,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;
  const dataArray = data["data"] as Array<{ url?: string }> | undefined;
  if (dataArray?.[0]?.url) {
    console.log(`\nImage generated: ${dataArray[0].url}`);
  }
}
