#!/usr/bin/env node
// Stage 2 of the curation pipeline.
//
// Reads curation/inventory.json and collapses burst sequences / near-
// duplicate exports (same capture as RAW+JPEG+edited-DNG, slight crops,
// multiple takes of the same subject seconds apart) down to one strongest
// representative per cluster. Everything else is marked rejected with a
// reason, but nothing is deleted — this only decides who advances to the
// visual review stage.
//
// Clustering requires BOTH a close perceptual hash AND (same filename stem
// OR capture timestamps within CLUSTER_TIME_WINDOW_MS). Hash-distance alone
// is unsafe here: two unrelated sky/cloud photos taken weeks apart can hash
// similarly just because they're both "horizon + sky", so we don't want
// composition-similarity alone to merge genuinely distinct photographs.
//
// Output: curation/clusters.json
//
// Usage: node scripts/curate-photos/cluster.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hammingDistance } from '../import-images/hash.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const IN_FILE = path.join(ROOT, 'curation', 'inventory.json');
const OUT_FILE = path.join(ROOT, 'curation', 'clusters.json');

const HAMMING_THRESHOLD = 8; // out of 64 bits
const CLUSTER_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BLANK_SHARPNESS_FLOOR = 0.03;
const BLANK_ENTROPY_FLOOR = 0.15;

// Strips common "same capture, different export" suffixes so e.g.
// "IMG_0415.JPG", "IMG_0415.CR2", "IMG_0415-Enhanced-NR.dng" all resolve to
// stem "IMG_0415".
function stemOf(relPath) {
  const base = path.basename(relPath, path.extname(relPath));
  return base
    .replace(/-Enhanced-NR(-\d+)?$/i, '')
    .replace(/-Enhanced(-\d+)?$/i, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/-copy(\d+)?$/i, '')
    .toLowerCase();
}

class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[ra] = rb;
  }
}

function shouldLink(a, b) {
  const sameStem = a._stem === b._stem;
  if (!sameStem && (!a.hash || !b.hash)) return false;

  if (sameStem) return true; // raw/jpg/enhanced siblings of the same capture

  const distance = hammingDistance(BigInt(a.hash), BigInt(b.hash));
  if (distance > HAMMING_THRESHOLD) return false;

  const ta = a.captureDate ? Date.parse(a.captureDate) : null;
  const tb = b.captureDate ? Date.parse(b.captureDate) : null;
  if (ta && tb) return Math.abs(ta - tb) <= CLUSTER_TIME_WINDOW_MS;

  // No timestamps on either side (edited exports often strip EXIF) — fall
  // back to same-folder as a weaker guard against merging unrelated shots.
  return a.folder === b.folder;
}

function pickRepresentative(members) {
  // Prefer entries with a real (non-embedded-preview) score, then highest
  // score, then largest pixel count as a tiebreaker.
  const scored = members.filter((m) => m.score && !m.fromEmbeddedPreview);
  const pool = scored.length > 0 ? scored : members.filter((m) => m.score);
  if (pool.length === 0) return members[0]; // all preview-missing raws; just pick first
  return pool.reduce((best, m) => (m.score.total > best.score.total ? m : best));
}

function reasonFor(rep, rejected) {
  const repIsRawSibling = rejected.some((r) => r._stem === rep._stem && r.relPath !== rep.relPath);
  if (repIsRawSibling && rejected.every((r) => r._stem === rep._stem)) {
    return 'Same capture exported in multiple formats (RAW/JPEG/edited-DNG) — kept the version with the strongest measured quality for web use.';
  }
  return 'Near-duplicate of a burst/sequence — kept the sharpest, best-composed frame from the group.';
}

async function main() {
  const inventory = JSON.parse(await readFile(IN_FILE, 'utf8'));
  const photos = inventory.photos.map((p) => ({ ...p, _stem: stemOf(p.relPath) }));

  const uf = new UnionFind(photos.length);
  // Bucket by folder first — clustering is O(n^2) within a bucket, and
  // cross-folder duplicates are out of scope (different shoots/events).
  const byFolder = new Map();
  photos.forEach((p, i) => {
    const list = byFolder.get(p.folder) ?? [];
    list.push(i);
    byFolder.set(p.folder, list);
  });

  for (const indices of byFolder.values()) {
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a];
        const j = indices[b];
        if (shouldLink(photos[i], photos[j])) uf.union(i, j);
      }
    }
  }

  const groups = new Map();
  photos.forEach((p, i) => {
    const root = uf.find(i);
    const list = groups.get(root) ?? [];
    list.push(p);
    groups.set(root, list);
  });

  const clusters = [];
  const survivors = [];
  const autoRejected = [];

  for (const members of groups.values()) {
    if (members.length === 1) {
      const m = members[0];
      const blank =
        m.score && m.score.breakdown.sharpness < BLANK_SHARPNESS_FLOOR && m.score.breakdown.entropy < BLANK_ENTROPY_FLOOR;
      if (blank) {
        autoRejected.push({ relPath: m.relPath, reason: 'Appears blank/out-of-focus (near-zero sharpness and detail) — likely an accidental capture.' });
      } else {
        survivors.push(m.relPath);
      }
      continue;
    }

    const rep = pickRepresentative(members);
    const rejected = members.filter((m) => m.relPath !== rep.relPath);
    clusters.push({
      folder: rep.folder,
      size: members.length,
      selected: rep.relPath,
      rejected: rejected.map((r) => r.relPath),
      reason: reasonFor(rep, rejected),
    });
    survivors.push(rep.relPath);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    hammingThreshold: HAMMING_THRESHOLD,
    clusterTimeWindowMs: CLUSTER_TIME_WINDOW_MS,
    totals: {
      inputPhotos: photos.length,
      clustersFound: clusters.length,
      photosCollapsedByClustering: clusters.reduce((sum, c) => sum + (c.size - 1), 0),
      autoRejectedBlank: autoRejected.length,
      survivors: survivors.length,
    },
    clusters,
    autoRejected,
    survivors,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Input: ${photos.length} photos`);
  console.log(`Clusters (2+ members): ${clusters.length}, collapsing ${output.totals.photosCollapsedByClustering} near-duplicates`);
  console.log(`Auto-rejected blank/broken: ${autoRejected.length}`);
  console.log(`Survivors advancing to visual review: ${survivors.length}`);
  console.log(`-> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
