#!/usr/bin/env node
// Stage 6: applies the user's exported review-decisions.json on top of
// curation/manifest.json.
//
// - Keeps only decision === "approved" candidates.
// - Regroups the fine-grained genre categories into a handful of named
//   collections (too many single-digit categories otherwise) per the
//   mapping below, chosen with the user after reviewing actual approved
//   counts per category.
// - Rebuilds Home/Portfolio Candidates/ to contain ONLY the approved
//   photos, organized by the new collection names (old per-genre folders
//   are removed and recreated — these are copies, never the originals in
//   Home/2023 etc., so this is safe to freely reorganize).
// - Writes curation/manifest-final.json with the approved+regrouped set.
//
// Usage: node scripts/curate-photos/apply-review.mjs

import { readFile, writeFile, mkdir, rm, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const CURATION_DIR = path.join(ROOT, 'curation');
const HOME_DIR = path.join(ROOT, 'Home');
const CANDIDATES_DIR = path.join(HOME_DIR, 'Portfolio Candidates');

// Old genre category -> new collection name.
const COLLECTION_MAP = {
  Astrophotography: 'Night Sky',
  'Night Photography': 'Night Sky',
  'Black & White': 'Black & White',
  Landscape: 'Landscapes & Architecture',
  Architecture: 'Landscapes & Architecture',
  Weather: 'Landscapes & Architecture',
  'Fine Art': 'Fine Art & Portraits',
  Documentary: 'Fine Art & Portraits',
  Portrait: 'Fine Art & Portraits',
  Minimalism: 'Fine Art & Portraits',
  Nature: 'Fine Art & Portraits',
};

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
  const manifest = JSON.parse(await readFile(path.join(CURATION_DIR, 'manifest.json'), 'utf8'));
  const decisions = JSON.parse(await readFile(path.join(CURATION_DIR, 'review-decisions.json'), 'utf8'));

  const approvedKeys = new Set(
    decisions.filter((d) => d.decision === 'approved').map((d) => `${d.filename}::${d.category}`)
  );

  const approved = manifest.candidates.filter((c) => approvedKeys.has(`${c.filename}::${c.category}`));
  const unmapped = approved.filter((c) => !COLLECTION_MAP[c.category]);
  if (unmapped.length) {
    console.warn('No collection mapping for categories:', [...new Set(unmapped.map((c) => c.category))]);
  }

  // Wipe old per-genre candidate folders and rebuild fresh with only the
  // approved photos, organized by collection.
  await rm(CANDIDATES_DIR, { recursive: true, force: true });
  await mkdir(CANDIDATES_DIR, { recursive: true });

  const finalCandidates = [];
  for (const c of approved) {
    const collection = COLLECTION_MAP[c.category] ?? c.category;
    const srcPath = path.join(HOME_DIR, c.sourcePath);
    const destDir = path.join(CANDIDATES_DIR, collection);
    const copiedAs = await copyWithoutCollision(srcPath, destDir, c.filename);
    finalCandidates.push({ ...c, collection, copiedTo: `Portfolio Candidates/${collection}/${copiedAs}` });
  }

  const byCollection = {};
  for (const c of finalCandidates) byCollection[c.collection] = (byCollection[c.collection] || 0) + 1;

  const finalManifest = {
    generatedAt: new Date().toISOString(),
    totals: { approved: finalCandidates.length, byCollection },
    candidates: finalCandidates,
  };
  await writeFile(path.join(CURATION_DIR, 'manifest-final.json'), JSON.stringify(finalManifest, null, 2));

  console.log(`Approved: ${finalCandidates.length}/${manifest.candidates.length}`);
  console.log('By collection:', byCollection);
  console.log(`-> Home/Portfolio Candidates/ rebuilt with ${finalCandidates.length} photos`);
  console.log(`-> ${path.relative(ROOT, path.join(CURATION_DIR, 'manifest-final.json'))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
