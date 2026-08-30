import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const examplesRoot = dirname(fileURLToPath(import.meta.url));
const generatedRoot = resolve(examplesRoot, "generated");
const slugs = ["openpatch-pip", "albertaz-azi", "mora-mori"];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(value, width) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function buildBrief(bible) {
  const connection = wrap(bible.productConnection, 64);
  const essence = bible.brandEssence.map((item) => escapeXml(item)).join(" · ");
  const connectionLines = connection.map(
    (line, index) =>
      `<text x="52" y="${284 + index * 30}" font-family="Arial, sans-serif" ` +
      `font-size="20" fill="#5F5967">${escapeXml(line)}</text>`,
  );
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="480">
      <rect width="800" height="480" rx="30" fill="#F3EFE7"/>
      <path d="M0 0h18v480H0z" fill="#5B4BDB"/>
      <circle cx="724" cy="74" r="34" fill="#FF7165"/>
      <text x="52" y="66" font-family="Arial, sans-serif" font-size="14"
        font-weight="700" letter-spacing="2" fill="#5B4BDB">SOURCE PRODUCT FACTS</text>
      <text x="52" y="132" font-family="Arial, sans-serif" font-size="48"
        font-weight="800" fill="#17142C">${escapeXml(bible.productName)}</text>
      <text x="52" y="177" font-family="Arial, sans-serif" font-size="22"
        font-weight="700" fill="#17142C">${escapeXml(bible.mascotType)} · ${escapeXml(bible.personality)}</text>
      <text x="52" y="222" font-family="Arial, sans-serif" font-size="16"
        font-weight="700" letter-spacing="1.4" fill="#81798A">BRAND ESSENCE</text>
      <text x="52" y="250" font-family="Arial, sans-serif" font-size="18"
        fill="#5F5967">${essence}</text>
      ${connectionLines.join("\n")}
      <text x="52" y="438" font-family="Arial, sans-serif" font-size="14"
        font-weight="700" letter-spacing="1.2" fill="#81798A">LOCKED BEFORE IMAGE GENERATION →</text>
    </svg>`;
}

for (const slug of slugs) {
  const directory = resolve(generatedRoot, slug);
  const bible = JSON.parse(await readFile(resolve(directory, "character-bible.json"), "utf8"));
  await writeFile(resolve(directory, "source-brief.svg"), buildBrief(bible), "utf8");
}
