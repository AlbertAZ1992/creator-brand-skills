import { validate, buildPrompt } from '../src/index.js';

const SAMPLE_INPUT = {
  productName: 'CodeLens',
  productDescription:
    'An AI-powered code review platform that automatically analyzes pull requests and provides inline suggestions. Designed for engineering teams who want faster, more consistent code reviews.',
  targetAudience: 'Software developers and engineering managers',
  personality: 'friendly' as const,
  mascotType: 'animal' as const,
  variationCount: 4,
};

const result = validate(SAMPLE_INPUT);

if (!result.ok) {
  console.error('Validation errors:');
  for (const e of result.errors) {
    console.error(`  ${e.field}: ${e.message}`);
  }
  process.exit(1);
}

const prompt = buildPrompt(result.value);
console.log(prompt);
console.log();

if (process.argv.includes('--generate')) {
  const imagePrompt =
    'A friendly owl mascot for a code review platform called CodeLens. The owl wears round glasses, has a magnifying glass motif, warm color palette with rounded shapes, approachable and trustworthy. Primary pose: owl looking at code through a magnifying glass with a friendly smile. Variations in a 2x2 grid: owl giving thumbs up, owl working late with a coffee cup, owl high-fiving, owl pointing at a bug while wearing a detective hat. Clean modern illustration style suitable for a tech product.';
  await generateImage(imagePrompt);
} else {
  console.log('If you have an OpenAI API key:');
  console.log('  export OPENAI_API_KEY="sk-..."');
  console.log('  npx tsx verify.ts --generate');
  console.log();
  console.log('Without a key:');
  console.log('  Copy the prompt above into ChatGPT/Claude and ask it to create the mascot concept.');
}

async function generateImage(promptText: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('\nSet OPENAI_API_KEY to generate images automatically.');
    return;
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: promptText,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;
  const dataArray = data['data'] as Array<{ url?: string }> | undefined;
  if (dataArray?.[0]?.url) {
    console.log(`\nImage generated: ${dataArray[0].url}`);
  }
}