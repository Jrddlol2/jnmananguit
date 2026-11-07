#!/usr/bin/env node
// Helper used during the manual visual-review pass: appends shortlisted
// photos to curation/shortlist.jsonl.
// Usage: node note.mjs '[{"relPath":"...","category":"...","note":"..."}, ...]'
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const OUT = path.join(ROOT, 'curation', 'shortlist.jsonl');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node note.mjs \'[{"relPath":"...","category":"...","note":"..."}]\'');
  process.exit(1);
}
const entries = JSON.parse(arg);
await mkdir(path.dirname(OUT), { recursive: true });
await appendFile(OUT, entries.map((e) => JSON.stringify(e)).join('\n') + '\n');
console.log(`noted ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`);
