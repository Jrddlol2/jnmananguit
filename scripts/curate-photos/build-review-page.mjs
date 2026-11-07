#!/usr/bin/env node
// Stage 5: renders curation/manifest.json into a standalone, self-contained
// curation/review.html — a local review gallery, NOT part of the website
// (it lives outside src/, isn't wired into the router, and nothing here
// ships to the live site).
//
// Opens directly via file:// (double-click), no dev server needed. Lets you
// approve/reject each candidate; "Export decisions" downloads a JSON file
// recording your final calls, which is what actually gates website
// integration (a separate, later step — never automatic).
//
// Usage: node scripts/curate-photos/build-review-page.mjs

import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const CURATION_DIR = path.join(ROOT, 'curation');

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtShutter(s) {
  if (!s) return '—';
  return s >= 1 ? `${s}s` : `1/${Math.round(1 / s)}s`;
}

function cardHtml(c, i) {
  const imgSrc = `../Home/${c.copiedTo}`.split(' ').join('%20');
  const tags = (c.secondaryTags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const flags = (c.improvementFlags || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('');
  const overall = c.scores?.overall != null ? c.scores.overall : '—';
  return `
  <div class="card" data-index="${i}" data-decision="approved">
    <div class="thumb-wrap" data-full-src="${escapeHtml(imgSrc)}" data-filename="${escapeHtml(c.filename)}">
      <img src="${imgSrc}" loading="lazy" alt="${escapeHtml(c.filename)}" />
      <div class="score-badge">${overall}/100</div>
      <div class="status-badge">✓ Approved</div>
      <div class="expand-hint">🔍 View full image</div>
    </div>
    <div class="body">
      <div class="row top">
        <strong class="filename">${escapeHtml(c.filename)}</strong>
        <span class="category">${escapeHtml(c.category)}</span>
      </div>
      <div class="tags">${tags}</div>
      ${c.scores ? `
      <div class="scorebars">
        <div>Composition <b>${c.scores.composition ?? '—'}</b></div>
        <div>Lighting <b>${c.scores.lighting ?? '—'}</b></div>
        <div>Technical <b>${c.scores.technical ?? '—'}</b></div>
        <div>Storytelling <b>${c.scores.storytelling ?? '—'}</b></div>
        <div>Portfolio Value <b>${c.scores.portfolioValue ?? '—'}</b></div>
      </div>` : ''}
      <p class="reason"><b>Why selected:</b> ${escapeHtml(c.reasonSelected || '—')}</p>
      ${c.reasonDuplicatesRejected ? `<p class="reason muted"><b>Rejected instead:</b> ${escapeHtml(c.reasonDuplicatesRejected.rejected.join(', '))} — ${escapeHtml(c.reasonDuplicatesRejected.reason)}</p>` : ''}
      ${flags ? `<p class="reason"><b>Suggested improvements:</b></p><ul class="flags">${flags}</ul>` : ''}
      <div class="meta">
        <span>${c.camera || 'Unknown camera'}</span>
        <span>${c.lens || ''}</span>
        <span>${c.dimensions?.width || '?'}×${c.dimensions?.height || '?'}</span>
        <span>ISO ${c.iso ?? '—'}</span>
        <span>f/${c.aperture ?? '—'}</span>
        <span>${fmtShutter(c.shutterSpeed)}</span>
        <span>${c.focalLength ? c.focalLength + 'mm' : '—'}</span>
        <span>${c.captureDate ? new Date(c.captureDate).toLocaleDateString() : 'Unknown date'}</span>
      </div>
      <div class="actions">
        <button class="approve-btn" onclick="setDecision(${i}, 'approved')">Approve</button>
        <button class="reject-btn" onclick="setDecision(${i}, 'rejected')">Reject</button>
      </div>
    </div>
  </div>`;
}

async function main() {
  // Prefer manifest-final.json (approved-only, regrouped into named
  // collections after a review pass) when present; fall back to the full
  // pre-review manifest.json otherwise.
  const finalPath = path.join(CURATION_DIR, 'manifest-final.json');
  const usingFinal = await access(finalPath).then(() => true, () => false);
  const manifest = JSON.parse(await readFile(usingFinal ? finalPath : path.join(CURATION_DIR, 'manifest.json'), 'utf8'));

  const byCategory = new Map();
  manifest.candidates.forEach((c, i) => {
    const key = c.collection || c.category;
    const list = byCategory.get(key) ?? [];
    list.push({ ...c, _index: i });
    byCategory.set(key, list);
  });

  const sections = [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(
      ([category, items]) => `
    <section>
      <h2>${escapeHtml(category)} <span class="count">${items.length}</span></h2>
      <div class="grid">
        ${items.map((c) => cardHtml(c, c._index)).join('\n')}
      </div>
    </section>`
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Portfolio Candidate Review</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px 32px 80px; background: #0f0f10; color: #eee; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .sub { color: #999; margin-bottom: 24px; font-size: 14px; }
  h2 { font-size: 17px; margin: 32px 0 12px; border-bottom: 1px solid #333; padding-bottom: 8px; }
  .count { color: #888; font-size: 13px; font-weight: normal; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .card { background: #1a1a1c; border: 2px solid #2a7a44; border-radius: 8px; overflow: hidden; transition: opacity .15s, border-color .15s; }
  .card[data-decision="rejected"] { opacity: 0.4; border-color: #7a2a2a; }
  .thumb-wrap { position: relative; aspect-ratio: 4/3; background: #000; cursor: zoom-in; }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card[data-decision="rejected"] .thumb-wrap img { filter: grayscale(0.6); }
  .expand-hint { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,.7); padding: 3px 9px; border-radius: 4px; font-size: 11px; opacity: 0; transition: opacity .15s; }
  .thumb-wrap:hover .expand-hint { opacity: 1; }
  #lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: none; align-items: center; justify-content: center; flex-direction: column; z-index: 1000; cursor: zoom-out; }
  #lightbox.open { display: flex; }
  #lightbox img { max-width: 94vw; max-height: 86vh; object-fit: contain; cursor: default; }
  #lightbox .lightbox-caption { color: #ccc; font-size: 13px; margin-top: 10px; }
  #lightbox .lightbox-close { position: absolute; top: 18px; right: 24px; color: #eee; font-size: 28px; background: none; border: none; cursor: pointer; line-height: 1; }
  .score-badge { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.7); padding: 2px 8px; border-radius: 4px; font-size: 12px; }
  .status-badge { position: absolute; top: 8px; left: 8px; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #1f5c33; color: #baf5cd; }
  .card[data-decision="rejected"] .status-badge { background: #5c1f1f; color: #f5bcbc; }
  .body { padding: 12px 14px; }
  .row.top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .filename { font-size: 13px; word-break: break-all; }
  .category { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #9ab; white-space: nowrap; }
  .tags { margin: 6px 0; display: flex; gap: 6px; flex-wrap: wrap; }
  .tag { font-size: 11px; background: #262629; padding: 2px 8px; border-radius: 10px; color: #bbb; }
  .scorebars { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; font-size: 12px; color: #aaa; margin: 8px 0; }
  .reason { font-size: 12.5px; color: #ccc; line-height: 1.4; margin: 6px 0; }
  .reason.muted { color: #888; }
  .flags { margin: 0 0 6px 18px; font-size: 12px; color: #cba; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #888; margin: 8px 0; }
  .actions { display: flex; gap: 8px; margin-top: 10px; }
  .actions button { flex: 1; padding: 6px 0; border-radius: 5px; border: 1px solid #333; background: #222; color: #eee; cursor: pointer; font-size: 12.5px; }
  .card[data-decision="approved"] .approve-btn { background: #1f5c33; border-color: #2a7a44; }
  .card[data-decision="rejected"] .reject-btn { background: #5c1f1f; border-color: #7a2a2a; }
  #toolbar { position: fixed; bottom: 0; left: 0; right: 0; background: #151516; border-top: 1px solid #2a2a2c; padding: 12px 32px; display: flex; justify-content: space-between; align-items: center; }
  #toolbar button { background: #3a6ea5; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  #summary { font-size: 13px; color: #aaa; }
</style>
</head>
<body>
  <h1>Portfolio Candidate Review</h1>
  <p class="sub">Generated ${escapeHtml(manifest.generatedAt)} — ${
    usingFinal
      ? `${manifest.totals.approved} approved candidate(s), organized into ${Object.keys(manifest.totals.byCollection).length} collections`
      : `${manifest.totals.selected} candidate(s) curated from 2,471 original photos (after collapsing near-duplicate bursts and culling for quality)`
  }. Nothing here is on the live site yet. Approve/reject below, then export your decisions.</p>
  ${sections}
  <div id="toolbar">
    <span id="summary"></span>
    <button onclick="exportDecisions()">Export decisions.json</button>
  </div>
  <div id="lightbox">
    <button class="lightbox-close" onclick="closeLightbox()">✕</button>
    <img id="lightbox-img" src="" alt="" />
    <div class="lightbox-caption" id="lightbox-caption"></div>
  </div>
<script>
  const manifest = ${JSON.stringify(manifest)};
  function setDecision(i, decision) {
    const card = document.querySelector('.card[data-index="' + i + '"]');
    card.dataset.decision = decision;
    card.querySelector('.status-badge').textContent = decision === 'approved' ? '✓ Approved' : '✕ Rejected';
    updateSummary();
  }
  function updateSummary() {
    const cards = [...document.querySelectorAll('.card')];
    const approved = cards.filter(c => c.dataset.decision === 'approved').length;
    document.getElementById('summary').textContent = approved + ' approved / ' + cards.length + ' total';
  }
  function exportDecisions() {
    const cards = [...document.querySelectorAll('.card')];
    const out = cards.map(c => {
      const i = Number(c.dataset.index);
      return { filename: manifest.candidates[i].filename, category: manifest.candidates[i].category, decision: c.dataset.decision };
    });
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'review-decisions.json';
    a.click();
  }
  updateSummary();

  function openLightbox(fullSrc, filename) {
    document.getElementById('lightbox-img').src = fullSrc;
    document.getElementById('lightbox-caption').textContent = filename;
    document.getElementById('lightbox').classList.add('open');
  }
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.getElementById('lightbox-img').src = '';
  }
  document.querySelectorAll('.thumb-wrap').forEach((el) => {
    el.addEventListener('click', () => openLightbox(el.dataset.fullSrc, el.dataset.filename));
  });
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
</script>
</body>
</html>`;

  await writeFile(path.join(CURATION_DIR, 'review.html'), html);
  console.log(`-> ${path.relative(ROOT, path.join(CURATION_DIR, 'review.html'))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
