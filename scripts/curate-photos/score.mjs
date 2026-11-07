#!/usr/bin/env node
// Stage 4a: turns curation/shortlist.jsonl (the visual-review picks, each
// with a category + one-line reason already written by hand while looking
// at the contact sheets) into curation/decisions.json — adding a 5-axis
// score (composition/25, lighting/25, technical/20, storytelling/20,
// portfolioValue/10 -> overall/100) and a couple of secondary tags per
// photo.
//
// The technical sub-score is grounded in the real per-image heuristic
// (sharpness/exposure/vibrance/entropy/aspect) from curation/inventory.json.
// That heuristic was tuned for daytime travel photography, so it
// under-scores legitimately dark genres (astro/night) — those categories
// get a floor instead of the raw number. The other four axes are derived
// from the qualitative reason recorded during review (keyword-informed,
// not re-litigated pixel-by-pixel per photo): a documented, repeatable
// starting point that the human review pass (review.html) can freely
// override.
//
// Usage: node scripts/curate-photos/score.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const CURATION_DIR = path.join(ROOT, 'curation');

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(n);

const DARK_GENRE_CATEGORIES = new Set([
  'Astrophotography',
  'Night Photography',
  'Long Exposure',
]);

function technicalScore(photo, category) {
  if (!photo?.score) return 13; // raw-with-missing-preview etc — neutral default
  const raw = photo.score.total; // 0..1 heuristic, biased against dark scenes
  const breakdown = photo.score.breakdown;
  let base = raw * 20;
  if (DARK_GENRE_CATEGORIES.has(category)) {
    // The exposure sub-score punishes low mean luminance, which is simply
    // correct for a night photo — floor it so genuinely sharp night shots
    // (already vetted visually during review) aren't penalized for being dark.
    base = Math.max(base, 13 + breakdown.sharpness * 4);
  }
  return clamp(round(base), 4, 20);
}

// Keyword -> axis nudges. Intentionally coarse: this is a starting point for
// human review, not a replacement for it.
const COMPOSITION_HINTS = [
  [/symmetr|leading.line|rule of thirds|centered|framed|frame-within|grid|geometric|graphic/i, 3],
  [/strong composition|striking|clean composition|well.composed|balanced/i, 2],
  [/busy|cluttered|awkward crop|off-center/i, -3],
];
const LIGHTING_HINTS = [
  [/dramatic|vivid|rich color|golden|glowing|saturated|striking color|backlit|silhouette/i, 3],
  [/warm light|soft light|good light|nice light|clean light/i, 2],
  [/underexposed|flat|dim|murky|harsh/i, -3],
];
const STORY_HINTS = [
  [/genuine emotional|powerful|poignant|decisive moment|climax|grief|joy|celebrat/i, 4],
  [/genuine|candid|authentic|storytelling|documentary/i, 2],
  [/mundane|plain subject/i, -3],
];
const PORTFOLIO_HINTS = [
  [/distinctive|rare|unusual|striking|best of|strongest|serious astrophotography|iconic/i, 2],
  [/redundant|common|weak/i, -2],
];

function applyHints(base, max, note, hints) {
  let v = base;
  for (const [re, delta] of hints) if (re.test(note)) v += delta;
  return clamp(round(v), 1, max);
}

// A couple of lightweight secondary tags inferred from the note text so the
// manifest has more than just the primary category to filter/browse by.
const TAG_RULES = [
  [/night|dusk|dark sky|candlelit/i, 'Night'],
  [/silhouette/i, 'Silhouette'],
  [/black and white|monochrome/i, 'Monochrome'],
  [/candid/i, 'Candid'],
  [/reflection/i, 'Reflection'],
  [/portrait/i, 'Portrait'],
  [/pet|dog|cat/i, 'Pet'],
  [/family|reunion|baptism|birthday/i, 'Family'],
  [/rain|storm|cloud|fog|mist/i, 'Weather'],
  [/\btravel\b|\btrip\b/i, 'Travel'],
  [/street|urban|market/i, 'Street'],
  [/moon|star|eclipse|nebula/i, 'Astro'],
];

function tagsFor(note) {
  const tags = [];
  for (const [re, tag] of TAG_RULES) {
    if (re.test(note) && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= 3) break;
  }
  return tags;
}

function improvementFlags(photo) {
  if (!photo?.score) return [];
  const b = photo.score.breakdown;
  const flags = [];
  if (b.sharpness < 0.15) flags.push('Check focus/sharpening before web export');
  if (b.exposure < 0.2 && b.entropy > 0.3) flags.push('Recover shadow/highlight detail');
  if (b.aspect < 0.3) flags.push('Consider a tighter crop for a more standard aspect ratio');
  return flags;
}

async function main() {
  const shortlistLines = (await readFile(path.join(CURATION_DIR, 'shortlist.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
  const inventory = JSON.parse(await readFile(path.join(CURATION_DIR, 'inventory.json'), 'utf8'));
  const byPath = new Map(inventory.photos.map((p) => [p.relPath, p]));

  const decisions = shortlistLines.map((entry) => {
    const photo = byPath.get(entry.relPath);
    const composition = applyHints(18, 25, entry.note, COMPOSITION_HINTS);
    const lighting = applyHints(18, 25, entry.note, LIGHTING_HINTS);
    const technical = technicalScore(photo, entry.category);
    const storytelling = applyHints(13, 20, entry.note, STORY_HINTS);
    const portfolioValue = applyHints(7, 10, entry.note, PORTFOLIO_HINTS);
    const overall = clamp(round(composition + lighting + technical + storytelling + portfolioValue), 1, 100);

    return {
      relPath: entry.relPath,
      decision: 'select',
      category: entry.category,
      secondaryTags: tagsFor(entry.note),
      scores: { composition, lighting, technical, storytelling, portfolioValue, overall },
      reasonSelected: entry.note,
      improvementFlags: improvementFlags(photo),
    };
  });

  await writeFile(path.join(CURATION_DIR, 'decisions.json'), JSON.stringify(decisions, null, 2));
  console.log(`Scored ${decisions.length} candidates.`);
  console.log(`-> ${path.relative(ROOT, path.join(CURATION_DIR, 'decisions.json'))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
