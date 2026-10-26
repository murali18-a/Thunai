import crypto from 'crypto';
import { Session, AnalyticsEvent } from '../data/models.js';
import { isMongoConnected, memAddSession, memUpdateSession, memAddEvent } from '../data/store.js';

/**
 * Session store — one record per inbound call or WhatsApp conversation.
 * In-memory cache for live state; MongoDB for durability + dashboard.
 */

const live = new Map(); // session_id -> state

export function newSessionId() {
  return crypto.randomBytes(8).toString('hex');
}

export async function startSession({ channel, phoneHash, district = null }) {
  const session_id = newSessionId();
  const state = {
    session_id,
    channel,
    phone_hash: phoneHash,
    district,
    profile: { state: 'TN' },
    transcript: [],
    stage: 'greeting',       // greeting → consent → collect → match → details → done
    pending_slot: null,
    matches: [],
    started_at: new Date(),
  };
  live.set(session_id, state);
  const record = {
    session_id, channel, phone_hash: phoneHash, district,
    transcript: [], outcome: 'in_progress', started_at: Date.now(),
  };
  if (isMongoConnected()) await Session.create(record);
  else memAddSession(record);
  await logEvent('call_started', session_id, { channel, district });
  return state;
}

export function getSession(session_id) {
  return live.get(session_id) || null;
}

export function updateSession(session_id, patch) {
  const s = live.get(session_id);
  if (!s) return null;
  Object.assign(s, patch);
  return s;
}

export function appendTranscript(session_id, role, text) {
  const s = live.get(session_id);
  if (!s) return;
  s.transcript.push({ role, text, at: new Date() });
}

export async function endSession(session_id, outcome = 'completed') {
  const s = live.get(session_id);
  if (!s) return;
  const ended_at = new Date();
  const duration_sec = Math.round((ended_at - s.started_at) / 1000);
  const patch = {
    transcript: s.transcript,
    profile_captured: s.profile,
    schemes_matched: s.matches.map(m => m.scheme_id),
    outcome,
    duration_sec,
    ended_at,
    district: s.profile.district || s.district,
  };
  if (isMongoConnected()) await Session.updateOne({ session_id }, { $set: patch });
  else memUpdateSession(session_id, patch);
  await logEvent('call_ended', session_id, { outcome, duration_sec });
  live.delete(session_id);
}

export async function logEvent(event_type, session_id, meta = {}) {
  const record = {
    event_type,
    session_id,
    district: meta.district || null,
    scheme_id: meta.scheme_id || null,
    meta,
    at: new Date(),
  };
  try {
    if (isMongoConnected()) await AnalyticsEvent.create(record);
    else memAddEvent(record);
  } catch (_) { /* non-fatal */ }
}

export function liveStats() {
  return {
    live_sessions: live.size,
    by_channel: Array.from(live.values()).reduce((acc, s) => {
      acc[s.channel] = (acc[s.channel] || 0) + 1;
      return acc;
    }, {}),
  };
}
