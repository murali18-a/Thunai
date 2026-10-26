import React, { useState } from 'react';

function Panel({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#334155' }}>{title}</h3>
      {children}
    </div>
  );
}

const PERSONAS = [
  { name: 'Lakshmi — 68yo widow, Namakkal', profile: { age: 68, gender: 'F', marital_status: 'widow', state: 'TN', district: 'Namakkal', annual_income: 0, is_disabled: false, occupation: 'housewife', land_hectares: 0, social_category: 'OBC' } },
  { name: 'Murugan — 45yo farmer, Dharmapuri (1.5 ha)', profile: { age: 45, gender: 'M', marital_status: 'married', state: 'TN', district: 'Dharmapuri', annual_income: 60000, is_disabled: false, occupation: 'farmer', land_hectares: 1.5, social_category: 'OBC' } },
  { name: 'Priya — 22yo SC student, Salem', profile: { age: 22, gender: 'F', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 50000, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'SC' } },
  { name: 'Raju — 35yo disabled man, Krishnagiri', profile: { age: 35, gender: 'M', marital_status: 'single', state: 'TN', district: 'Krishnagiri', annual_income: 0, is_disabled: true, occupation: 'unemployed', land_hectares: 0, social_category: 'MBC' } },
  { name: 'Divya — 24yo pregnant housewife, Madurai', profile: { age: 24, gender: 'F', marital_status: 'married', state: 'TN', district: 'Madurai', annual_income: 60000, is_disabled: false, occupation: 'housewife', land_hectares: 0, social_category: 'OBC' } },
];

export default function TryIt() {
  const [profile, setProfile] = useState(PERSONAS[0].profile);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch('/api/match', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile, limit: 10 }),
      }).then(r => r.json());
      setMatches(r.matches || []);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
      <Panel title="Simulate a user profile">
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Pick a persona or adjust the profile. This is the deterministic eligibility engine — no LLM.
        </div>
        <div style={{ marginBottom: 16 }}>
          <select
            onChange={e => setProfile({ ...PERSONAS[e.target.value].profile })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
          >
            {PERSONAS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
          </select>
        </div>
        <Field label="Age"            v={profile.age}            on={v => setProfile({ ...profile, age: Number(v) })} type="number" />
        <Field label="Gender (M/F)"   v={profile.gender}         on={v => setProfile({ ...profile, gender: v })} />
        <Field label="Marital"        v={profile.marital_status} on={v => setProfile({ ...profile, marital_status: v })} />
        <Field label="District"       v={profile.district}       on={v => setProfile({ ...profile, district: v })} />
        <Field label="Occupation"     v={profile.occupation}     on={v => setProfile({ ...profile, occupation: v })} />
        <Field label="Annual income"  v={profile.annual_income}  on={v => setProfile({ ...profile, annual_income: Number(v) })} type="number" />
        <Field label="Land (ha)"      v={profile.land_hectares}  on={v => setProfile({ ...profile, land_hectares: Number(v) })} type="number" />
        <Field label="Social cat"     v={profile.social_category} on={v => setProfile({ ...profile, social_category: v })} />
        <Field label="Disabled"       v={profile.is_disabled}    on={v => setProfile({ ...profile, is_disabled: v === 'true' })} />
        <button onClick={run} disabled={loading}
          style={{ marginTop: 12, width: '100%', padding: '12px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
          {loading ? 'Matching…' : 'Match schemes'}
        </button>
      </Panel>
      <Panel title={`Matched schemes${matches.length ? ` (${matches.length})` : ''}`}>
        {matches.length === 0 ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Click <strong>Match schemes</strong> to run the eligibility engine against this profile.</div> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
            {matches.map(m => (
              <div key={m.scheme_id} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{m.name_ta}</strong>
                  <span style={{ fontSize: 11, color: '#64748b' }}>score {m.score.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{m.name_en}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 8 }}>
                  <span>💰 {benefitLabel(m.benefit)}</span>
                  <span>🏢 {m.ministry}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                  <strong>தகுதி:</strong> {m.eligibility_plain_ta}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                  <strong>ஆவணங்கள்:</strong> {(m.documents_required || []).join(', ')}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <strong>📍</strong> {m.where_to_apply}
                  {m.helpline && <span style={{ marginLeft: 12 }}>☎️ {m.helpline}</span>}
                </div>
                <a href={m.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0ea5e9', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>Official source →</a>
              </div>
            ))}
          </div>
        }
      </Panel>
    </div>
  );
}

function Field({ label, v, on, type = 'text' }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 2 }}>{label}</label>
      <input value={v ?? ''} onChange={e => on(e.target.value)} type={type}
        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }} />
    </div>
  );
}

function benefitLabel(b) {
  if (!b) return '';
  if (b.kind === 'monthly') return `₹${b.amount}/mo`;
  if (b.kind === 'onetime') return `₹${b.amount} one-time`;
  if (b.kind === 'insurance_cover') return `₹${b.amount} cover`;
  if (b.kind === 'subsidy_pct') return `${b.amount}% subsidy`;
  if (b.kind === 'loan') return `up to ₹${b.amount} loan`;
  if (b.kind === 'inkind') return b.description_ta || 'in-kind';
  return '';
}
