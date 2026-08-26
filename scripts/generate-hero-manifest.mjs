import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const heroDir = path.join(repoRoot, 'images', 'hero');
const outputFile = path.join(heroDir, 'hero-manifest.json');

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function generateManifest() {
  const dirEntries = await readdir(heroDir, { withFileTypes: true });

  const imageFiles = dirEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const json = JSON.stringify(imageFiles, null, 2) + '\n';
  await writeFile(outputFile, json, 'utf8');

  console.log(`Wrote ${imageFiles.length} item(s) to ${path.relative(repoRoot, outputFile)}`);
}

generateManifest().catch((err) => {
  console.error('Failed to generate hero manifest:', err);
  process.exitCode = 1;
});
