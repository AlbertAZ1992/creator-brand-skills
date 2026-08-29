import { mkdir, writeFile } from "node:fs/promises";
import { dirname, basename, extname, join } from "node:path";

const DEFAULT_OUTPUT_DIR = join(process.cwd(), "outputs");

/**
 * Generate an output file path for a given logo and suffix.
 */
export function makeOutputPath(
  logoPath: string,
  suffix: string,
  outputDir: string = DEFAULT_OUTPUT_DIR,
): string {
  const name = basename(logoPath, extname(logoPath));
  return join(outputDir, `${name}-clay-${suffix}`);
}

/**
 * Write file bytes to disk, creating parent directories as needed.
 */
export async function writeOutputFile(filePath: string, data: Buffer | Uint8Array): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, data);
}

/**
 * Write a JSON record alongside the output files.
 */
export async function writeRecord(
  logoPath: string,
  record: Record<string, unknown>,
  outputDir?: string,
): Promise<string> {
  const recordPath = makeOutputPath(logoPath, "manifest.json", outputDir);
  const dir = dirname(recordPath);
  await mkdir(dir, { recursive: true });
  await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n");
  return recordPath;
}
