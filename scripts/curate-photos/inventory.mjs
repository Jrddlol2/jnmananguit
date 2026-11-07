#!/usr/bin/env node
// Stage 1 of the portfolio curation pipeline.
//
// Recursively walks Home/, keeps only real photographs (jpg/jpeg/png/heic/
// heif/cr2/dng), skips Lightroom catalog internals, OS junk, videos, and
// screenshot-named files, then computes for every survivor:
//   - dimensions + capture EXIF (camera/lens/ISO/aperture/shutter/focal/date)
//   - a heuristic quality score (reusing scripts/import-images/scoring.mjs)
//   - a perceptual dHash (reusing scripts/import-images/hash.mjs) for later
//     burst/duplicate clustering
//
// Raw files (CR2/DNG) can't be decoded by sharp directly, so we score/hash
// their embedded EXIF preview JPEG instead — good enough for culling, not
// meant to be the final web asset.
//
// Output: curation/inventory.json
//
// Usage: node scripts/curate-photos/inventory.mjs

import sharp from 'sharp';
import exifr from 'exifr';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreImage } from '../import-images/scoring.mjs';
import { computeDHash } from '../import-images/hash.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const HOME_DIR = path.join(ROOT, 'Home');
const OUT_DIR = path.join(ROOT, 'curation');
const OUT_FILE = path.join(OUT_DIR, 'inventory.json');

const PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);
const RAW_EXTENSIONS = new Set(['.cr2', '.dng']);
const VIDEO_EXTENSIONS = new Set(['.mov', '.mp4']);
const SKIP_DIR_SUFFIXES = ['.lrdata', '.lrcat-data'];
const SCREENSHOT_NAME = /screen ?shot|^capture[_-]|whatsapp image|viber_image/i;
const CONCURRENCY = 6;

function isPortfolioCandidatesDir(name) {
  return name === 'Portfolio Candidates';
}

async function walk(dir, onFile) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`  ! could not read dir ${dir}: ${err.message}`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const lower = entry.name.toLowerCase();
      if (SKIP_DIR_SUFFIXES.some((suf) => lower.endsWith(suf))) continue;
      if (isPortfolioCandidatesDir(entry.name)) continue; // don't re-ingest our own output
      await walk(full, onFile);
    } else if (entry.isFile()) {
      await onFile(full, entry.name);
    }
  }
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function analyzeRaster(fullPath) {
  const [metadata, stats] = await Promise.all([
    sharp(fullPath).rotate().metadata(),
    sharp(fullPath).rotate().stats(),
  ]);
  const score = scoreImage({ width: metadata.width, height: metadata.height, stats });
  const hash = await computeDHash(sharp, fullPath);
  return { width: metadata.width, height: metadata.height, score, hash: hash.toString() };
}

async function analyzeRaw(fullPath) {
  const buf = await readFile(fullPath);
  const thumb = await exifr.thumbnail(buf).catch(() => null);
  if (!thumb) return { width: null, height: null, score: null, hash: null, previewMissing: true };
  const thumbBuf = Buffer.from(thumb);
  const [metadata, stats] = await Promise.all([
    sharp(thumbBuf).rotate().metadata(),
    sharp(thumbBuf).rotate().stats(),
  ]);
  const score = scoreImage({ width: metadata.width, height: metadata.height, stats });
  const hash = await computeDHash(sharp, thumbBuf);
  return { width: metadata.width, height: metadata.height, score, hash: hash.toString(), fromEmbeddedPreview: true };
}

async function extractExif(fullPath) {
  try {
    const meta = await exifr.parse(fullPath, {
      mergeOutput: true,
      tiff: true,
      ifd0: true,
      ifd1: true,
      exif: true,
      // Some Lightroom-processed DNGs (e.g. "Enhance Details/Denoise" output)
      // push Make/Model/Lens into XMP instead of the standard EXIF IFD.
      xmp: true,
      icc: false,
      jfif: false,
      iptc: false,
      translateValues: true,
    });
    if (!meta) return {};
    const make = meta.Make?.trim();
    const model = meta.Model?.trim();
    const camera =
      make && model
        ? model.toLowerCase().startsWith(make.toLowerCase())
          ? model
          : `${make} ${model}`
        : model || make || null;
    return {
      camera,
      lens: meta.LensModel || meta.LensInfo || null,
      iso: meta.ISO ?? null,
      aperture: meta.FNumber ?? null,
      shutterSpeed: meta.ExposureTime ?? null,
      focalLength: meta.FocalLength ?? null,
      captureDate: meta.DateTimeOriginal ? new Date(meta.DateTimeOriginal).toISOString() : null,
    };
  } catch {
    return {};
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Optional: `node inventory.mjs 2023/Sky` scopes the walk to Home/2023/Sky
  // (handy for a quick test run instead of the full library).
  const scoped = process.argv[2];
  const walkRoot = scoped ? path.join(HOME_DIR, scoped) : HOME_DIR;

  const candidates = [];
  const skippedVideos = [];
  const skippedOther = [];
  const skippedScreenshots = [];

  await walk(walkRoot, async (fullPath, name) => {
    const ext = path.extname(name).toLowerCase();
    const relForLog = path.relative(HOME_DIR, fullPath).split(path.sep).join('/');
    if (SCREENSHOT_NAME.test(name)) {
      skippedScreenshots.push(relForLog);
      return;
    }
    if (PHOTO_EXTENSIONS.has(ext) || RAW_EXTENSIONS.has(ext)) {
      candidates.push(fullPath);
    } else if (VIDEO_EXTENSIONS.has(ext)) {
      skippedVideos.push(relForLog);
    } else {
      skippedOther.push(relForLog);
    }
  });

  console.log(`Found ${candidates.length} candidate photo file(s).`);
  console.log(`Skipped: ${skippedVideos.length} video(s), ${skippedScreenshots.length} screenshot-named, ${skippedOther.length} other non-photo file(s).`);

  let done = 0;
  const errors = [];
  const results = await pool(candidates, CONCURRENCY, async (fullPath) => {
    const ext = path.extname(fullPath).toLowerCase();
    const relPath = path.relative(HOME_DIR, fullPath).split(path.sep).join('/');
    try {
      const fileStat = await stat(fullPath);
      const [visual, exif] = await Promise.all([
        RAW_EXTENSIONS.has(ext) ? analyzeRaw(fullPath) : analyzeRaster(fullPath),
        extractExif(fullPath),
      ]);
      done++;
      if (done % 200 === 0) console.log(`  ...analyzed ${done}/${candidates.length}`);
      return {
        relPath,
        ext,
        isRaw: RAW_EXTENSIONS.has(ext),
        fileSizeBytes: fileStat.size,
        folder: relPath.split('/').slice(0, -1).join('/'),
        width: visual.width,
        height: visual.height,
        score: visual.score ? { total: visual.score.total, breakdown: visual.score.breakdown } : null,
        hash: visual.hash,
        fromEmbeddedPreview: visual.fromEmbeddedPreview ?? false,
        previewMissing: visual.previewMissing ?? false,
        ...exif,
      };
    } catch (err) {
      errors.push({ relPath, error: err.message });
      done++;
      return null;
    }
  });

  const analyzed = results.filter(Boolean);

  const manifest = {
    generatedAt: new Date().toISOString(),
    homeDir: 'Home',
    totals: {
      candidatesFound: candidates.length,
      analyzed: analyzed.length,
      errors: errors.length,
      skippedVideos: skippedVideos.length,
      skippedScreenshots: skippedScreenshots.length,
      skippedOther: skippedOther.length,
    },
    errors,
    skippedVideos,
    skippedScreenshots,
    photos: analyzed,
  };

  await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Analyzed ${analyzed.length}/${candidates.length}, ${errors.length} error(s).`);
  console.log(`-> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
