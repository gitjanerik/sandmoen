// Normaliserer bilder for web/mobil: auto-roterer (EXIF), skalerer ned og komprimerer.
// Bruk:  node scripts/optimize-images.mjs <tomtnr> <mappe-med-raabilder> [maxPx] [kvalitet]
// Skriver src/assets/tomt<nr>-1.jpeg, -2.jpeg … sortert etter filnavn.
// Krever sharp (devDependency): npm install
import { readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const [, , nr, inDir, maxPx = '1600', quality = '80'] = process.argv;
if (!nr || !inDir) {
  console.error('Bruk: node scripts/optimize-images.mjs <tomtnr> <mappe> [maxPx] [kvalitet]');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/assets');
mkdirSync(OUT, { recursive: true });

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const files = readdirSync(inDir)
  .filter((f) => exts.has(extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'nb', { numeric: true, sensitivity: 'base' }));

if (!files.length) { console.error('Ingen bilder i', inDir); process.exit(1); }

let i = 0;
for (const f of files) {
  i++;
  const out = join(OUT, `tomt${nr}-${i}.jpeg`);
  const img = sharp(join(inDir, f)).rotate();
  const meta = await img.metadata();
  await img
    .resize({ width: +maxPx, height: +maxPx, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: +quality, mozjpeg: true })
    .toFile(out);
  const info = await sharp(out).metadata();
  console.log(`tomt${nr}-${i}.jpeg  ←  ${f}  (${meta.width}×${meta.height} → ${info.width}×${info.height})`);
}
console.log(`Ferdig: ${i} bilder → src/assets/ (maks ${maxPx}px, kvalitet ${quality})`);
