#!/usr/bin/env node
// Stage 4 of the curation pipeline (final step before human approval).
//
// Combines:
//   - curation/inventory.json   (EXIF + dimensions + technical score)
//   - curation/clusters.json    (which near-duplicates were rejected in
//                                 favor of which survivor, and why)
//   - curation/decisions.json   (the visual review verdicts — category,
//                                 tags, composition/lighting/technical/
//                                 storytelling/portfolio scores, reasons —
//                                 written by hand after looking at the
//                                 contact sheets from stage 3)
//
// ...into curation/manifest.json, and COPIES (never moves/renames) every
// selected original into Home/Portfolio Candidates/<Category>/.
//
// Usage: node scripts/curate-photos/finalize.mjs

import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const HOME_DIR = path.join(ROOT, 'Home');
const CANDIDATES_DIR = path.join(HOME_DIR, 'Portfolio Candidates');
const CURATION_DIR = path.join(ROOT, 'curation');

const round = (n, d = 1) => (typeof n === 'number' ? Math.round(n * 10 ** d) / 10 ** d : n);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyWithoutCollision(srcPath, destDir, filename) {
  await mkdir(destDir, { recursive: true });
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = filename;
  let n = 2;
  while (await exists(path.join(destDir, candidate))) {
    candidate = `${base}-${n}${ext}`;
    n++;
  }
  await copyFile(srcPath, path.join(destDir, candidate));
  return candidate;
}

async function main() {
  const inventory = JSON.parse(await readFile(path.join(CURATION_DIR, 'inventory.json'), 'utf8'));
  const clusters = JSON.parse(await readFile(path.join(CURATION_DIR, 'clusters.json'), 'utf8'));
  const decisions = JSON.parse(await readFile(path.join(CURATION_DIR, 'decisions.json'), 'utf8'));

  const byPath = new Map(inventory.photos.map((p) => [p.relPath, p]));
  const rejectedByRep = new Map();
  for (const c of clusters.clusters) {
    rejectedByRep.set(c.selected, { rejected: c.rejected, reason: c.reason });
  }

  const selected = decisions.filter((d) => d.decision === 'select');
  const manifestEntries = [];

  for (const d of selected) {
    const photo = byPath.get(d.relPath);
    if (!photo) {
      console.warn(`! decisions.json references unknown photo: ${d.relPath}`);
      continue;
    }
    const srcPath = path.join(HOME_DIR, d.relPath);
    const destDir = path.join(CANDIDATES_DIR, d.category);
    const originalFilename = path.basename(d.relPath);
    const copiedAs = await copyWithoutCollision(srcPath, destDir, originalFilename);

    const dupInfo = rejectedByRep.get(d.relPath);

    manifestEntries.push({
      filename: originalFilename,
      copiedTo: `Portfolio Candidates/${d.category}/${copiedAs}`,
      sourcePath: d.relPath,
      category: d.category,
      secondaryTags: d.secondaryTags ?? [],
      scores: d.scores
        ? {
            composition: d.scores.composition,
            lighting: d.scores.lighting,
            technical: d.scores.technical,
            storytelling: d.scores.storytelling,
            portfolioValue: d.scores.portfolioValue,
            overall: d.scores.overall,
          }
        : null,
      dimensions: { width: photo.width, height: photo.height },
      captureDate: photo.captureDate,
      camera: photo.camera,
      lens: photo.lens,
      iso: photo.iso,
      aperture: photo.aperture,
      shutterSpeed: photo.shutterSpeed,
      focalLength: photo.focalLength,
      technicalScore: photo.score ? round(photo.score.total, 3) : null,
      reasonSelected: d.reasonSelected,
      reasonDuplicatesRejected: dupInfo
        ? { rejected: dupInfo.rejected, reason: dupInfo.reason }
        : null,
      improvementFlags: d.improvementFlags ?? [],
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    totals: {
      selected: manifestEntries.length,
      rejectedInDecisions: decisions.filter((d) => d.decision === 'reject').length,
    },
    candidates: manifestEntries,
  };

  await writeFile(path.join(CURATION_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Copied ${manifestEntries.length} candidate(s) into Home/Portfolio Candidates/`);
  console.log(`-> ${path.relative(ROOT, path.join(CURATION_DIR, 'manifest.json'))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
