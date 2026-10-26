import express from 'express';
import { Scheme, Session, Office, AnalyticsEvent } from '../data/models.js';
import { isMongoConnected, memSchemes, memOffices, memListSessions, memSummary, memEventsCount } from '../data/store.js';
import { matchSchemes } from '../engine/eligibility.js';
import { liveStats } from '../services/sessionManager.js';
import { sendSMS } from '../services/twilioClient.js';
import { composeWhatsAppReply } from '../engine/composer.js';

export const apiRouter = express.Router();

// ── Health ────────────────────────────────────────────────────────────────────
apiRouter.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime(), schemes: memSchemes().length }));

// ── Schemes CRUD ──────────────────────────────────────────────────────────────
apiRouter.get('/schemes', async (req, res) => {
  const { q, category, state, level } = req.query;
  if (isMongoConnected()) {
    const filter = { active: true };
    if (category) filter.category = category;
    if (state) filter.state = state;
    if (level) filter.level = level;
    if (q) filter.$or = [
      { name_en: new RegExp(q, 'i') }, { name_ta: new RegExp(q, 'i') }, { tags: new RegExp(q, 'i') },
    ];
    const schemes = await Scheme.find(filter).sort({ priority_weight: -1 }).lean();
    return res.json({ count: schemes.length, schemes });
  }
  let schemes = memSchemes().filter(s => s.active !== false);
  if (category) schemes = schemes.filter(s => s.category === category);
  if (state) schemes = schemes.filter(s => s.state === state);
  if (level) schemes = schemes.filter(s => s.level === level);
  if (q) {
    const re = new RegExp(q, 'i');
    schemes = schemes.filter(s => re.test(s.name_en) || re.test(s.name_ta) || (s.tags || []).some(t => re.test(t)));
  }
  schemes.sort((a, b) => (b.priority_weight || 0) - (a.priority_weight || 0));
  res.json({ count: schemes.length, schemes });
});

apiRouter.get('/schemes/:id', async (req, res) => {
  if (isMongoConnected()) {
    const s = await Scheme.findOne({ scheme_id: req.params.id }).lean();
    if (!s) return res.status(404).json({ error: 'not_found' });
    return res.json(s);
  }
  const s = memSchemes().find(x => x.scheme_id === req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json(s);
});

// ── Match engine ──────────────────────────────────────────────────────────────
apiRouter.post('/match', async (req, res) => {
  const profile = req.body.profile || {};
  const matches = await matchSchemes(profile, { limit: req.body.limit || 10 });
  res.json({ matched: matches.length, profile, matches });
});

// ── Eligibility explain — plain-Tamil reasoning for why a profile matches/doesn't
apiRouter.post('/eligibility/explain', async (req, res) => {
  const { profile, scheme_id } = req.body;
  if (!profile) return res.status(400).json({ error: 'profile_required' });
  if (!scheme_id) return res.status(400).json({ error: 'scheme_id_required' });

  const scheme = isMongoConnected()
    ? await Scheme.findOne({ scheme_id }).lean()
    : memSchemes().find(s => s.scheme_id === scheme_id);
  if (!scheme) return res.status(404).json({ error: 'scheme_not_found' });

  const jsonLogic = (await import('json-logic-js')).default;
  let eligible = false;
  try { eligible = !!jsonLogic.apply(scheme.eligibility_rule, profile); } catch { /* rule error → not eligible */ }

  // Build per-condition breakdown
  const conditions = [];
  const rule = scheme.eligibility_rule;
  const clauses = rule?.and || rule?.or || [rule];
  for (const clause of clauses) {
    try {
      const result = jsonLogic.apply(clause, profile);
      conditions.push({ clause, met: !!result });
    } catch {
      conditions.push({ clause, met: false, error: true });
    }
  }

  res.json({
    scheme_id,
    eligible,
    name_ta: scheme.name_ta,
    name_en: scheme.name_en,
    eligibility_plain_ta: scheme.eligibility_plain_ta,
    conditions,
    documents_required: scheme.documents_required,
    where_to_apply: scheme.where_to_apply,
    how_to_apply_steps: scheme.how_to_apply_steps,
    source_url: scheme.source_url,
  });
});

// ── Application draft — generates a pre-filled application summary for a citizen
apiRouter.post('/application/draft', async (req, res) => {
  const { profile, scheme_id } = req.body;
  if (!profile || !scheme_id) return res.status(400).json({ error: 'profile_and_scheme_id_required' });

  const scheme = isMongoConnected()
    ? await Scheme.findOne({ scheme_id }).lean()
    : memSchemes().find(s => s.scheme_id === scheme_id);
  if (!scheme) return res.status(404).json({ error: 'scheme_not_found' });

  const draft = {
    title_ta: `${scheme.name_ta} — விண்ணப்ப வரைவு`,
    title_en: `${scheme.name_en} — Application Draft`,
    generated_at: new Date().toISOString(),
    applicant: {
      age: profile.age,
      gender: profile.gender === 'F' ? 'பெண்' : profile.gender === 'M' ? 'ஆண்' : profile.gender,
      district: profile.district,
      occupation: profile.occupation,
      annual_income: profile.annual_income,
      marital_status: profile.marital_status,
      social_category: profile.social_category,
    },
    scheme: {
      scheme_id: scheme.scheme_id,
      name_ta: scheme.name_ta,
      name_en: scheme.name_en,
      ministry: scheme.ministry,
      benefit: scheme.benefit,
      eligibility_plain_ta: scheme.eligibility_plain_ta,
    },
    documents_required: scheme.documents_required,
    where_to_apply: scheme.where_to_apply,
    how_to_apply_steps: scheme.how_to_apply_steps,
    helpline: scheme.helpline,
    source_url: scheme.source_url,
    checklist_ta: (scheme.documents_required || []).map(doc => `☐ ${doc}`),
    note_ta: 'இந்த வரைவை கிராம நிர்வாக அலுவலகத்தில் காட்டி, விண்ணப்பப் படிவம் பெறவும்.',
  };

  res.json(draft);
});

// ── SMS summary — send scheme match results via SMS to a phone number
apiRouter.post('/sms/send-summary', async (req, res) => {
  const { phone, profile, limit } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone_required' });
  if (!profile) return res.status(400).json({ error: 'profile_required' });

  const matches = await matchSchemes(profile, { limit: limit || 5 });
  if (matches.length === 0) {
    return res.json({ sent: false, reason: 'no_matches' });
  }

  // Build a short SMS body (160 chars per segment)
  const lines = [`துணை: ${matches.length} திட்டங்கள்`];
  for (const m of matches.slice(0, 3)) {
    const benefit = m.benefit?.kind === 'monthly' ? `₹${m.benefit.amount}/மாதம்`
      : m.benefit?.kind === 'onetime' ? `₹${m.benefit.amount}`
      : m.benefit?.kind === 'insurance_cover' ? `₹${m.benefit.amount} காப்பீடு`
      : m.benefit?.description_ta || '';
    lines.push(`• ${m.name_ta} ${benefit}`);
  }
  lines.push(`📍 ${matches[0].where_to_apply}`);
  lines.push(`☎️ ${matches[0].helpline || '14472'}`);

  const body = lines.join('\n');
  const result = await sendSMS(phone, body);
  res.json({ sent: true, sid: result.sid, mocked: result.mocked, body });
});

// ── Nearest office — finds closest offices by Haversine distance
apiRouter.get('/nearest-office', async (req, res) => {
  const { lat, lng, district, limit: qLimit } = req.query;
  const maxResults = Math.min(parseInt(qLimit || '5', 10), 20);

  let offices;
  if (isMongoConnected()) {
    const filter = {};
    if (district) filter.district = new RegExp(district, 'i');
    offices = await Office.find(filter).lean();
  } else {
    offices = memOffices();
    if (district) offices = offices.filter(o => new RegExp(district, 'i').test(o.district));
  }

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    offices = offices
      .filter(o => o.lat && o.lng)
      .map(o => ({ ...o, distance_km: haversine(userLat, userLng, o.lat, o.lng) }))
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  res.json({ offices: offices.slice(0, maxResults) });
});

// ── Public stats (for landing page counter) ──────────────────────────────────
apiRouter.get('/stats/public', async (req, res) => {
  const schemeCount = isMongoConnected()
    ? await Scheme.countDocuments({ active: true })
    : memSchemes().length;

  const officeCount = isMongoConnected()
    ? await Office.countDocuments()
    : memOffices().length;

  let sessionCount = 0, beneficiariesHelped = 0;
  if (isMongoConnected()) {
    sessionCount = await Session.countDocuments();
    beneficiariesHelped = await Session.countDocuments({ outcome: 'completed' });
  } else {
    const summary = memSummary();
    sessionCount = summary.sessions?.total || 0;
    beneficiariesHelped = summary.sessions?.completed || 0;
  }

  res.json({
    schemes: schemeCount,
    offices: officeCount,
    sessions: sessionCount,
    beneficiaries_helped: beneficiariesHelped,
    districts_covered: 38,
    live: liveStats(),
  });
});

// ── Dashboard: recent sessions ───────────────────────────────────────────────
apiRouter.get('/sessions/recent', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  if (isMongoConnected()) {
    const sessions = await Session.find().sort({ started_at: -1 }).limit(limit).lean();
    return res.json({ count: sessions.length, sessions });
  }
  const sessions = memListSessions(limit);
  res.json({ count: sessions.length, sessions });
});

apiRouter.get('/analytics/summary', async (req, res) => {
  if (isMongoConnected()) {
    const [calls, sessions] = await Promise.all([
      AnalyticsEvent.countDocuments({ event_type: 'call_started' }),
      Session.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, avg_duration: { $avg: '$duration_sec' },
          completed: { $sum: { $cond: [{ $eq: ['$outcome', 'completed'] }, 1, 0] } } } },
      ]),
    ]);
    const byDistrict = await Session.aggregate([
      { $match: { district: { $ne: null } } },
      { $group: { _id: '$district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 },
    ]);
    const topSchemes = await AnalyticsEvent.aggregate([
      { $match: { event_type: 'scheme_selected' } },
      { $group: { _id: '$scheme_id', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 },
    ]);
    const byChannel = await Session.aggregate([{ $group: { _id: '$channel', count: { $sum: 1 } } }]);
    return res.json({
      calls_total: calls, sessions: sessions[0] || { total: 0, avg_duration: 0, completed: 0 },
      by_district: byDistrict, top_schemes: topSchemes, by_channel: byChannel, live: liveStats(),
    });
  }
  const summary = memSummary();
  res.json({
    calls_total: memEventsCount({ event_type: 'call_started' }),
    ...summary,
    live: liveStats(),
  });
});

apiRouter.get('/offices', async (req, res) => {
  if (isMongoConnected()) {
    const filter = {};
    if (req.query.district) filter.district = new RegExp(req.query.district, 'i');
    if (req.query.pincode) filter.pincode = req.query.pincode;
    const offices = await Office.find(filter).limit(20).lean();
    return res.json({ offices });
  }
  let offices = memOffices();
  if (req.query.district) offices = offices.filter(o => new RegExp(req.query.district, 'i').test(o.district));
  if (req.query.pincode) offices = offices.filter(o => o.pincode === req.query.pincode);
  res.json({ offices: offices.slice(0, 20) });
});

apiRouter.get('/schemes-stats', async (req, res) => {
  if (isMongoConnected()) {
    const total = await Scheme.countDocuments({ active: true });
    const byCategory = await Scheme.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
    const byLevel = await Scheme.aggregate([{ $match: { active: true } }, { $group: { _id: '$level', count: { $sum: 1 } } }]);
    return res.json({ total, by_category: byCategory, by_level: byLevel });
  }
  const schemes = memSchemes();
  const byCat = {}, byLv = {};
  for (const s of schemes) { byCat[s.category] = (byCat[s.category] || 0) + 1; byLv[s.level] = (byLv[s.level] || 0) + 1; }
  res.json({
    total: schemes.length,
    by_category: Object.entries(byCat).map(([_id, count]) => ({ _id, count })),
    by_level: Object.entries(byLv).map(([_id, count]) => ({ _id, count })),
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Haversine formula — great-circle distance between two lat/lng points in km. */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
