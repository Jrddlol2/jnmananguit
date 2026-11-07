#!/usr/bin/env node
// Stage 3 of the curation pipeline.
//
// Builds labeled grid "contact sheets" out of the survivors from
// curation/clusters.json, grouped by top-level folder (roughly one shoot/
// event per folder). Each tile is numbered so a visual review pass can
// refer back to "tile 14 on sheet 3" and have it resolve to a real file via
// curation/contact-sheets/index.json.
//
// This exists purely so a human (or a vision-capable reviewer) can scan many
// photos per glance instead of opening one image at a time — the professional
// equivalent of a photo editor's contact sheet / loupe view.
//
// Output: curation/contact-sheets/sheet-XXX.jpg + index.json
//
// Usage: node scripts/curate-photos/contact-sheets.mjs

import sharp from 'sharp';
import exifr from 'exifr';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const HOME_DIR = path.join(ROOT, 'Home');
const CLUSTERS_FILE = path.join(ROOT, 'curation', 'clusters.json');
const INVENTORY_FILE = path.join(ROOT, 'curation', 'inventory.json');
const OUT_DIR = path.join(ROOT, 'curation', 'contact-sheets');

const RAW_EXTENSIONS = new Set(['.cr2', '.dng']);
const CELL = 260; // px, square
const LABEL_HEIGHT = 28;
const COLS = 6;
const ROWS = 5;
const PER_SHEET = COLS * ROWS;
const GAP = 4;

async function loadTileBuffer(relPath) {
  const fullPath = path.join(HOME_DIR, relPath);
  const ext = path.extname(relPath).toLowerCase();
  try {
    if (RAW_EXTENSIONS.has(ext)) {
      const buf = await readFile(fullPath);
      const thumb = await exifr.thumbnail(buf).catch(() => null);
      if (!thumb) return null;
      return Buffer.from(thumb);
    }
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

function labelSvg(text, width, height) {
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="black"/><text x="4" y="${height - 8}" font-family="monospace" font-size="14" fill="white">${safe}</text></svg>`
  );
}

async function buildTile(index, relPath) {
  const raw = await loadTileBuffer(relPath);
  const cellImageHeight = CELL - LABEL_HEIGHT;
  let imageBuf;
  if (raw) {
    try {
      imageBuf = await sharp(raw)
        .rotate()
        .resize(CELL, cellImageHeight, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      imageBuf = null;
    }
  }
  if (!imageBuf) {
    imageBuf = await sharp({
      create: { width: CELL, height: cellImageHeight, channels: 3, background: { r: 40, g: 40, b: 40 } },
    })
      .jpeg()
      .toBuffer();
  }

  const label = labelSvg(`#${index}`, CELL, LABEL_HEIGHT);
  return sharp({
    create: { width: CELL, height: CELL, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([
      { input: imageBuf, top: 0, left: 0 },
      { input: label, top: cellImageHeight, left: 0 },
    ])
    .jpeg()
    .toBuffer();
}

async function buildSheet(tiles, sheetIndex) {
  const width = COLS * CELL + (COLS - 1) * GAP;
  const height = ROWS * CELL + (ROWS - 1) * GAP;
  const composites = [];
  for (let i = 0; i < tiles.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    composites.push({ input: tiles[i], top: row * (CELL + GAP), left: col * (CELL + GAP) });
  }
  const outPath = path.join(OUT_DIR, `sheet-${String(sheetIndex).padStart(3, '0')}.jpg`);
  await sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 20, b: 20 } },
  })
    .composite(composites)
    .jpeg({ quality: 85 })
    .toFile(outPath);
  return outPath;
}

async function main() {
  const clusters = JSON.parse(await readFile(CLUSTERS_FILE, 'utf8'));
  const inventory = JSON.parse(await readFile(INVENTORY_FILE, 'utf8'));
  const byPath = new Map(inventory.photos.map((p) => [p.relPath, p]));

  await mkdir(OUT_DIR, { recursive: true });
  const existing = await readdir(OUT_DIR).catch(() => []);
  await Promise.all(existing.map((f) => rm(path.join(OUT_DIR, f))));

  // Group survivors by top-level folder so each sheet stays within one
  // shoot/event instead of mixing unrelated sessions.
  const byFolder = new Map();
  for (const relPath of clusters.survivors) {
    const photo = byPath.get(relPath);
    const folder = photo?.folder ?? 'unknown';
    const list = byFolder.get(folder) ?? [];
    list.push(relPath);
    byFolder.set(folder, list);
  }

  let globalIndex = 0;
  let sheetIndex = 0;
  const index = { sheets: [] };

  for (const [folder, relPaths] of [...byFolder.entries()].sort()) {
    for (let i = 0; i < relPaths.length; i += PER_SHEET) {
      const batch = relPaths.slice(i, i + PER_SHEET);
      const tiles = [];
      const tileMeta = [];
      for (const relPath of batch) {
        globalIndex++;
        tiles.push(await buildTile(globalIndex, relPath));
        tileMeta.push({ tileNumber: globalIndex, relPath });
      }
      sheetIndex++;
      const outPath = await buildSheet(tiles, sheetIndex);
      console.log(`  sheet-${String(sheetIndex).padStart(3, '0')}.jpg  (${folder}, ${batch.length} tiles)`);
      index.sheets.push({
        sheet: path.basename(outPath),
        folder,
        tiles: tileMeta,
      });
    }
  }

  await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\n${sheetIndex} contact sheet(s) built for ${clusters.survivors.length} survivors.`);
  console.log(`-> ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
