#!/usr/bin/env node
// Automatic photo import pipeline.
//
// Reads every raw-photos/<country>/ folder, picks the strongest photo as
// cover.jpg, renames the rest to 001.jpg, 002.jpg, ... and writes them into
// public/images/<country>/, and records original -> new filename mappings
// (plus scores and duplicate warnings) to raw-photos/<country>/metadata.json.
//
// Usage: npm run import-images

import sharp from 'sharp';
import { readdir, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreImage } from './scoring.mjs';
import { computeDHash, hammingDistance } from './hash.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const RAW_DIR = path.join(ROOT, 'raw-photos');
const PUBLIC_IMAGES_DIR = path.join(ROOT, 'public', 'images');

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const NUMBERED_FILE = /^\d{3}(-thumb)?\.(jpe?g|png|webp)$/i;
const DUPLICATE_HAMMING_THRESHOLD = 6; // out of 64 bits — lower is stricter

const JPEG_QUALITY_COVER = 90;
const JPEG_QUALITY_GALLERY = 88;
const JPEG_QUALITY_THUMB = 82;
const MAX_DIMENSION_COVER = 2600;
const MAX_DIMENSION_GALLERY = 2400;
// Masonry grid cells never render wider than ~1/3 of the viewport, so a
// full 2400px image is far more than the thumbnail grid needs. This
// smaller variant is used via srcset; the full-size file is still what
// opens in the lightbox.
const MAX_DIMENSION_THUMB = 900;

const round = (n) => Math.round(n * 1000) / 1000;
const roundBreakdown = (breakdown) =>
  Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, round(value)]));

const naturalCompare = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

async function listCountryFolders() {
  const entries = await readdir(RAW_DIR, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort(naturalCompare);
}

async function analyzeImage(file, fullPath) {
  const [metadata, stats] = await Promise.all([
    sharp(fullPath).rotate().metadata(),
    sharp(fullPath).rotate().stats(),
  ]);
  const score = scoreImage({ width: metadata.width, height: metadata.height, stats });
  const hash = await computeDHash(sharp, fullPath);
  return { file, fullPath, metadata, score, hash };
}

function findDuplicates(analyzed) {
  const warnings = [];
  for (let i = 0; i < analyzed.length; i++) {
    for (let j = i + 1; j < analyzed.length; j++) {
      const distance = hammingDistance(analyzed[i].hash, analyzed[j].hash);
      if (distance <= DUPLICATE_HAMMING_THRESHOLD) {
        warnings.push({ a: analyzed[i].file, b: analyzed[j].file, distance });
      }
    }
  }
  return warnings;
}

async function resolveOverride(rawDir, analyzed, overrideFile) {
  const overridePath = path.join(rawDir, overrideFile);
  const requestedName = await readFile(overridePath, 'utf8')
    .then((s) => s.trim())
    .catch(() => null);

  if (!requestedName) return { entry: null, requestedName: null };

  const entry = analyzed.find((a) => a.file.toLowerCase() === requestedName.toLowerCase());
  return { entry, requestedName };
}

async function clearPreviousOutput(outDir) {
  const existing = await readdir(outDir).catch(() => []);
  await Promise.all(
    existing
      .filter((f) => NUMBERED_FILE.test(f) || ['cover.jpg', 'card.jpg'].includes(f.toLowerCase()))
      .map((f) => rm(path.join(outDir, f)))
  );
}

async function writeProcessedImage(sourcePath, destPath, { maxDimension, quality }) {
  await sharp(sourcePath)
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(destPath);
}

async function processCountry(country) {
  const rawDir = path.join(RAW_DIR, country);
  const outDir = path.join(PUBLIC_IMAGES_DIR, country);

  const files = (await readdir(rawDir)).filter((f) => ACCEPTED_EXTENSIONS.test(f));
  if (files.length === 0) {
    console.log(`\n=== ${country} === (no images in raw-photos/${country}, skipped)`);
    return;
  }

  console.log(`\n=== ${country} (${files.length} photos) ===`);

  const analyzed = [];
  for (const file of files) {
    analyzed.push(await analyzeImage(file, path.join(rawDir, file)));
  }

  const duplicateWarnings = findDuplicates(analyzed);
  if (duplicateWarnings.length > 0) {
    console.warn(`  ! ${duplicateWarnings.length} possible duplicate pair(s):`);
    for (const w of duplicateWarnings) {
      console.warn(`    - ${w.a}  ~  ${w.b}  (hamming distance ${w.distance}/64)`);
    }
  }

  const { entry: overrideEntry, requestedName } = await resolveOverride(rawDir, analyzed, 'COVER.txt');
  let coverEntry = overrideEntry;
  if (requestedName && !overrideEntry) {
    console.warn(`  ! COVER.txt requests "${requestedName}" but no matching file was found — falling back to automatic selection.`);
  }

  const ranked = [...analyzed].sort((a, b) => b.score.total - a.score.total);
  if (!coverEntry) {
    coverEntry = ranked[0];
    console.log(`  Cover (auto-selected): ${coverEntry.file}  score=${round(coverEntry.score.total)}`);
  } else {
    console.log(`  Cover (COVER.txt override): ${coverEntry.file}  score=${round(coverEntry.score.total)}`);
  }
  console.log(
    `  Top scores: ${ranked
      .slice(0, 3)
      .map((a) => `${a.file} (${round(a.score.total)})`)
      .join(', ')}`
  );

  const gallery = analyzed
    .filter((a) => a !== coverEntry)
    .sort((a, b) => naturalCompare(a.file, b.file));

  await mkdir(outDir, { recursive: true });
  await clearPreviousOutput(outDir);

  await writeProcessedImage(coverEntry.fullPath, path.join(outDir, 'cover.jpg'), {
    maxDimension: MAX_DIMENSION_COVER,
    quality: JPEG_QUALITY_COVER,
  });

  // Optional separate image for the portrait destination cards, so a wide
  // shot can stay the banner/hero cover while a vertical one fronts the card.
  // It stays in the gallery too, since it isn't the cover.
  const { entry: cardEntry, requestedName: requestedCard } = await resolveOverride(rawDir, analyzed, 'CARD.txt');
  if (requestedCard && !cardEntry) {
    console.warn(`  ! CARD.txt requests "${requestedCard}" but no matching file was found — cards will use cover.jpg.`);
  }
  if (cardEntry) {
    await writeProcessedImage(cardEntry.fullPath, path.join(outDir, 'card.jpg'), {
      maxDimension: MAX_DIMENSION_COVER,
      quality: JPEG_QUALITY_COVER,
    });
    console.log(`  Card (CARD.txt): ${cardEntry.file}`);
  }

  const galleryMetadata = [];
  let index = 1;
  for (const entry of gallery) {
    const padded = String(index).padStart(3, '0');
    const newName = `${padded}.jpg`;
    const thumbName = `${padded}-thumb.jpg`;
    await writeProcessedImage(entry.fullPath, path.join(outDir, newName), {
      maxDimension: MAX_DIMENSION_GALLERY,
      quality: JPEG_QUALITY_GALLERY,
    });
    await writeProcessedImage(entry.fullPath, path.join(outDir, thumbName), {
      maxDimension: MAX_DIMENSION_THUMB,
      quality: JPEG_QUALITY_THUMB,
    });
    galleryMetadata.push({ original: entry.file, new: newName, score: round(entry.score.total) });
    index++;
  }

  const metadata = {
    country,
    generatedAt: new Date().toISOString(),
    cover: {
      original: coverEntry.file,
      new: 'cover.jpg',
      score: round(coverEntry.score.total),
      breakdown: roundBreakdown(coverEntry.score.breakdown),
      overridden: Boolean(overrideEntry),
    },
    card: cardEntry ? { original: cardEntry.file, new: 'card.jpg' } : null,
    gallery: galleryMetadata,
    duplicateWarnings,
  };
  await writeFile(path.join(rawDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  // Lets the site fetch one small JSON file to know how many gallery photos
  // exist instead of probing for each one individually.
  await writeFile(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ count: gallery.length, generatedAt: new Date().toISOString() })
  );

  console.log(`  -> public/images/${country}/cover.jpg + ${gallery.length} gallery photo(s)`);
  console.log(`  -> raw-photos/${country}/metadata.json`);
}

async function main() {
  // Optional: `npm run import-images -- japan bali` processes only those
  // folders instead of everything under raw-photos/.
  const requested = process.argv.slice(2);
  let countries = await listCountryFolders();

  if (countries.length === 0) {
    console.log(
      `No folders found in raw-photos/.\nCreate raw-photos/<country>/ (e.g. raw-photos/japan/), drop your camera photos in, and re-run.`
    );
    return;
  }

  if (requested.length > 0) {
    const unknown = requested.filter((name) => !countries.includes(name));
    if (unknown.length > 0) {
      console.log(`No such raw-photos/ folder: ${unknown.join(', ')}`);
    }
    countries = countries.filter((name) => requested.includes(name));
    if (countries.length === 0) return;
  }

  console.log(`Processing ${countries.length} folder(s): ${countries.join(', ')}`);
  for (const country of countries) {
    await processCountry(country);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
