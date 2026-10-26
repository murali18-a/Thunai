#!/usr/bin/env node
/**
 * expand-kb.js — Merges additional schemes + offices into the existing KB files.
 * Run: node scripts/expand-kb.js
 *
 * This is idempotent: it reads the existing files, adds only schemes/offices
 * whose IDs don't already exist, and writes them back sorted.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMES_PATH = join(__dirname, 'schemes.json');
const OFFICES_PATH = join(__dirname, 'offices.json');
const NEW_SCHEMES_PATH = join(__dirname, 'schemes-additional.json');
const NEW_OFFICES_PATH = join(__dirname, 'offices-additional.json');

// Load existing
const existing = JSON.parse(readFileSync(SCHEMES_PATH, 'utf8'));
const existingOffices = JSON.parse(readFileSync(OFFICES_PATH, 'utf8'));

// Load new
let newSchemes, newOffices;
try {
  newSchemes = JSON.parse(readFileSync(NEW_SCHEMES_PATH, 'utf8'));
} catch (e) {
  console.error('No schemes-additional.json found. Skipping scheme expansion.');
  newSchemes = [];
}
try {
  newOffices = JSON.parse(readFileSync(NEW_OFFICES_PATH, 'utf8'));
} catch (e) {
  console.error('No offices-additional.json found. Skipping office expansion.');
  newOffices = [];
}

// Merge schemes (no duplicates)
const existingIds = new Set(existing.map(s => s.scheme_id));
let added = 0;
for (const s of newSchemes) {
  if (!existingIds.has(s.scheme_id)) {
    existing.push(s);
    existingIds.add(s.scheme_id);
    added++;
  }
}
console.log(`Schemes: ${existing.length} total (${added} added, ${newSchemes.length - added} skipped as duplicates)`);

// Merge offices
const existingOfficeIds = new Set(existingOffices.map(o => o.office_id));
let officesAdded = 0;
for (const o of newOffices) {
  if (!existingOfficeIds.has(o.office_id)) {
    existingOffices.push(o);
    existingOfficeIds.add(o.office_id);
    officesAdded++;
  }
}
console.log(`Offices: ${existingOffices.length} total (${officesAdded} added)`);

// Write back
writeFileSync(SCHEMES_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf8');
writeFileSync(OFFICES_PATH, JSON.stringify(existingOffices, null, 2) + '\n', 'utf8');
console.log('✅ Written to schemes.json and offices.json');
