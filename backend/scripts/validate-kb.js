#!/usr/bin/env node
/**
 * validate-kb.js — Validate the Thunai scheme knowledge base.
 *
 * Checks:
 *  1. Required fields present on every scheme
 *  2. No duplicate scheme_ids
 *  3. JsonLogic rules parse and evaluate without throwing
 *  4. source_url is a real .gov.in or .nic.in domain
 *  5. Benefit kind is one of the known enum values
 *  6. Level/state consistency
 *  7. Offices have required fields and valid coordinates
 *
 * Usage:  node scripts/validate-kb.js
 * Exit 0 = clean, Exit 1 = errors found.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import jsonLogic from 'json-logic-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMES_PATH = join(__dirname, 'schemes.json');
const OFFICES_PATH = join(__dirname, 'offices.json');

const REQUIRED_FIELDS = [
  'scheme_id', 'name_ta', 'name_en', 'ministry', 'level', 'category',
  'benefit', 'eligibility_rule', 'eligibility_plain_ta',
  'documents_required', 'where_to_apply', 'how_to_apply_steps',
  'source_url',
];

const BENEFIT_KINDS = ['monthly', 'onetime', 'subsidy_pct', 'insurance_cover', 'loan', 'inkind'];
const LEVELS = ['central', 'state'];
const CATEGORIES = [
  'pension', 'insurance', 'subsidy', 'loan', 'grant', 'education',
  'housing', 'maternity', 'employment', 'agriculture', 'health',
  'livelihood', 'transport', 'food', 'startup', 'social_security',
];

const SAMPLE_PROFILE = {
  age: 50, gender: 'F', state: 'TN', annual_income: 50000,
  is_disabled: false, occupation: 'housewife', land_hectares: 0,
  marital_status: 'married', social_category: 'OBC', district: 'Salem',
};

const OFFICE_REQUIRED = ['office_id', 'type', 'name', 'district'];
const OFFICE_TYPES = ['CSC', 'VAO', 'Taluk', 'BDO', 'Panchayat'];

let errors = 0;
let warnings = 0;

function err(msg) { console.error(`  ❌ ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠️  WARN:  ${msg}`); warnings++; }

// ── Validate schemes ────────────────────────────────────────────────────────
console.log('\n═══ Thunai KB Validator ═══\n');
let schemes;
try {
  schemes = JSON.parse(readFileSync(SCHEMES_PATH, 'utf8'));
  console.log(`📄 Loaded ${schemes.length} schemes from schemes.json`);
} catch (e) {
  console.error(`FATAL: Cannot read ${SCHEMES_PATH}: ${e.message}`);
  process.exit(1);
}

// 1. Duplicate IDs
const ids = new Set();
for (const s of schemes) {
  if (ids.has(s.scheme_id)) err(`Duplicate scheme_id: ${s.scheme_id}`);
  ids.add(s.scheme_id);
}

// 2. Per-scheme checks
for (const s of schemes) {
  const tag = s.scheme_id || '(missing id)';

  // Required fields
  for (const f of REQUIRED_FIELDS) {
    if (s[f] === undefined || s[f] === null || s[f] === '') {
      err(`${tag}: missing required field "${f}"`);
    }
  }

  // Benefit kind
  if (s.benefit && !BENEFIT_KINDS.includes(s.benefit.kind)) {
    err(`${tag}: unknown benefit.kind "${s.benefit.kind}"`);
  }

  // Level
  if (!LEVELS.includes(s.level)) {
    err(`${tag}: invalid level "${s.level}"`);
  }

  // State consistency
  if (s.level === 'state' && s.state !== 'TN') {
    warn(`${tag}: level=state but state="${s.state}" (expected TN)`);
  }
  if (s.level === 'central' && s.state) {
    warn(`${tag}: level=central but state is set ("${s.state}")`);
  }

  // Category
  if (!CATEGORIES.includes(s.category)) {
    warn(`${tag}: category "${s.category}" not in known list`);
  }

  // Source URL must be .gov.in or .nic.in
  if (s.source_url) {
    try {
      const host = new URL(s.source_url).hostname;
      if (!host.endsWith('.gov.in') && !host.endsWith('.nic.in')) {
        warn(`${tag}: source_url host "${host}" is not .gov.in/.nic.in`);
      }
    } catch (_) {
      err(`${tag}: malformed source_url "${s.source_url}"`);
    }
  }

  // JsonLogic rule must not throw
  if (s.eligibility_rule) {
    try {
      jsonLogic.apply(s.eligibility_rule, SAMPLE_PROFILE);
    } catch (e) {
      err(`${tag}: JsonLogic rule throws: ${e.message}`);
    }
  }

  // Documents must be an array
  if (s.documents_required && !Array.isArray(s.documents_required)) {
    err(`${tag}: documents_required must be an array`);
  }

  // How-to-apply must be an array
  if (s.how_to_apply_steps && !Array.isArray(s.how_to_apply_steps)) {
    err(`${tag}: how_to_apply_steps must be an array`);
  }

  // Tamil name should not be empty
  if (s.name_ta && s.name_ta.length < 3) {
    warn(`${tag}: name_ta suspiciously short: "${s.name_ta}"`);
  }

  // Eligibility plain Tamil
  if (s.eligibility_plain_ta && s.eligibility_plain_ta.length < 10) {
    warn(`${tag}: eligibility_plain_ta suspiciously short`);
  }

  // last_verified_date should be a valid date string if present
  if (s.last_verified_date) {
    const d = new Date(s.last_verified_date);
    if (isNaN(d.getTime())) {
      warn(`${tag}: invalid last_verified_date "${s.last_verified_date}"`);
    }
  }
}

// ── Validate offices ────────────────────────────────────────────────────────
let offices;
try {
  offices = JSON.parse(readFileSync(OFFICES_PATH, 'utf8'));
  console.log(`📄 Loaded ${offices.length} offices from offices.json\n`);
} catch (e) {
  console.error(`FATAL: Cannot read ${OFFICES_PATH}: ${e.message}`);
  process.exit(1);
}

const officeIds = new Set();
for (const o of offices) {
  const tag = o.office_id || '(missing id)';
  if (officeIds.has(o.office_id)) err(`Duplicate office_id: ${o.office_id}`);
  officeIds.add(o.office_id);

  for (const f of OFFICE_REQUIRED) {
    if (!o[f]) err(`Office ${tag}: missing field "${f}"`);
  }
  if (o.type && !OFFICE_TYPES.includes(o.type)) {
    warn(`Office ${tag}: unknown type "${o.type}"`);
  }
  if (o.lat !== undefined && (o.lat < 8 || o.lat > 14)) {
    warn(`Office ${tag}: lat ${o.lat} outside TN range [8, 14]`);
  }
  if (o.lng !== undefined && (o.lng < 76 || o.lng > 81)) {
    warn(`Office ${tag}: lng ${o.lng} outside TN range [76, 81]`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n═══ Results ═══`);
console.log(`  Schemes: ${schemes.length}   Offices: ${offices.length}`);
console.log(`  Errors:  ${errors}   Warnings: ${warnings}`);
if (errors > 0) {
  console.error('\n🔴 Validation FAILED — fix errors above.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n🟡 Passed with warnings.\n');
} else {
  console.log('\n🟢 All clean.\n');
}
