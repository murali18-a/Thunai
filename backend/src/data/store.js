/**
 * Lightweight in-memory store used as a fallback when Mongo isn't available.
 * Lets the demo run end-to-end in a sandboxed environment with no external services.
 * In production, Mongoose models (data/models.js) back everything.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mongoose from 'mongoose';

const here = dirname(fileURLToPath(import.meta.url));

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

const _mem = {
  schemes: null,
  offices: null,
  sessions: [],
  events: [],
};

export function loadFallbackData() {
  if (_mem.schemes) return;
  _mem.schemes = JSON.parse(readFileSync(join(here, '..', '..', 'scripts', 'schemes.json'), 'utf8'));
  _mem.offices = JSON.parse(readFileSync(join(here, '..', '..', 'scripts', 'offices.json'), 'utf8'));
}

export function memSchemes() { loadFallbackData(); return _mem.schemes; }
export function memOffices() { loadFallbackData(); return _mem.offices; }
export function memAddSession(s) { _mem.sessions.push(s); }
export function memUpdateSession(id, patch) {
  const i = _mem.sessions.findIndex(x => x.session_id === id);
  if (i >= 0) Object.assign(_mem.sessions[i], patch);
}
export function memListSessions(limit = 50) {
  return [..._mem.sessions].sort((a, b) => (b.started_at || 0) - (a.started_at || 0)).slice(0, limit);
}
export function memAddEvent(e) { _mem.events.push(e); }
export function memEventsCount(filter = {}) {
  return _mem.events.filter(e => Object.entries(filter).every(([k, v]) => e[k] === v)).length;
}
export function memSummary() {
  const sessions = _mem.sessions;
  const byDistrict = {}, byChannel = {}, topSchemes = {};
  for (const s of sessions) {
    if (s.district) byDistrict[s.district] = (byDistrict[s.district] || 0) + 1;
    byChannel[s.channel] = (byChannel[s.channel] || 0) + 1;
  }
  for (const e of _mem.events.filter(e => e.event_type === 'scheme_selected')) {
    topSchemes[e.scheme_id] = (topSchemes[e.scheme_id] || 0) + 1;
  }
  return {
    sessions: {
      total: sessions.length,
      completed: sessions.filter(s => s.outcome === 'completed').length,
      avg_duration: sessions.length ? sessions.reduce((a, s) => a + (s.duration_sec || 0), 0) / sessions.length : 0,
    },
    by_district: Object.entries(byDistrict).map(([_id, count]) => ({ _id, count })).sort((a, b) => b.count - a.count),
    by_channel: Object.entries(byChannel).map(([_id, count]) => ({ _id, count })),
    top_schemes: Object.entries(topSchemes).map(([_id, count]) => ({ _id, count })).sort((a, b) => b.count - a.count),
  };
}
