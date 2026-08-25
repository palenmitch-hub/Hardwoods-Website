import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const availableDir = path.join(repoRoot, 'images', 'products', 'available');
const outputFile = path.join(availableDir, 'inventory-manifest.json');

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const INVENTORY_PATTERN = /^(.+)-(\d+(?:\.\d{1,2})?)-(\d+)-([A-Za-z0-9]+)(?:-(\d+))?\.(jpe?g|png|webp)$/i;

function sortByProductNumber(files) {
  return files.sort((a, b) => {
    const aMatch = a.match(INVENTORY_PATTERN);
    const bMatch = b.match(INVENTORY_PATTERN);

    if (!aMatch && !bMatch) return a.localeCompare(b, undefined, { sensitivity: 'base' });
    if (!aMatch) return 1;
    if (!bMatch) return -1;

    const aKey = aMatch[4];
    const bKey = bMatch[4];
    var prodCmp = aKey.localeCompare(bKey, undefined, { numeric: true, sensitivity: 'base' });
    if (prodCmp !== 0) return prodCmp;

    const aImage = aMatch[5] ? parseInt(aMatch[5], 10) : 1;
    const bImage = bMatch[5] ? parseInt(bMatch[5], 10) : 1;
    return aImage - bImage;
  });
}

async function generateManifest() {
  const dirEntries = await readdir(availableDir, { withFileTypes: true });

  const imageFiles = dirEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()));

  const files = imageFiles.filter((name) => INVENTORY_PATTERN.test(name));
  const invalidFiles = imageFiles.filter((name) => !INVENTORY_PATTERN.test(name));

  const sorted = sortByProductNumber(files);
  const json = JSON.stringify(sorted, null, 2) + '\n';

  await writeFile(outputFile, json, 'utf8');

  console.log(`Wrote ${sorted.length} item(s) to ${path.relative(repoRoot, outputFile)}`);
  if (invalidFiles.length > 0) {
    console.warn(`Skipped ${invalidFiles.length} file(s) with invalid naming format.`);
    console.warn('Expected format: name-price-quantity-product#[-image#].jpg');
    console.warn('Example: Walnut with Wenge and Maple Stripe-100-1-0001.jpg');
    console.warn('Example: Walnut with Wenge and Maple Stripe-100-1-0001-02.jpg');
    invalidFiles.forEach((file) => console.warn(` - ${file}`));
  }
}

generateManifest().catch((err) => {
  console.error('Failed to generate inventory manifest:', err);
  process.exitCode = 1;
});
