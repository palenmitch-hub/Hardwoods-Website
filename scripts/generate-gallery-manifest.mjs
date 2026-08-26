import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const galleryDir = path.join(repoRoot, 'images', 'gallery');
const outputFile = path.join(galleryDir, 'gallery-manifest.json');

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Root-level files are legacy/uncategorized and are treated as "boards".
// Drop new photos into boards/, chairs/, or other/ to categorize them.
const SUBFOLDERS = [
  { dir: '', category: 'boards' },
  { dir: 'boards', category: 'boards' },
  { dir: 'chairs', category: 'chairs' },
  { dir: 'other', category: 'other' }
];

async function listImages(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function generateManifest() {
  const manifest = { boards: [], chairs: [], other: [] };

  for (const folder of SUBFOLDERS) {
    const dirPath = folder.dir ? path.join(galleryDir, folder.dir) : galleryDir;
    const names = await listImages(dirPath);
    const relNames = folder.dir ? names.map((name) => `${folder.dir}/${name}`) : names;
    manifest[folder.category].push(...relNames);
  }

  const json = JSON.stringify(manifest, null, 2) + '\n';
  await writeFile(outputFile, json, 'utf8');

  const total = manifest.boards.length + manifest.chairs.length + manifest.other.length;
  console.log(`Wrote ${total} item(s) to ${path.relative(repoRoot, outputFile)}`);
  console.log(`  boards: ${manifest.boards.length}, chairs: ${manifest.chairs.length}, other: ${manifest.other.length}`);
}

generateManifest().catch((err) => {
  console.error('Failed to generate gallery manifest:', err);
  process.exitCode = 1;
});
