import React, { useEffect, useState } from 'react';

const API = '/api';

export default function SchemeDetail({ schemeId, onBack }) {
  const [scheme, setScheme] = useState(null);
  const [profile, setProfile] = useState({ age: '', gender: 'F', state: 'TN', district: '', occupation: '', annual_income: '', marital_status: 'married', is_disabled: false, social_category: 'OBC' });
  const [explain, setExplain] = useState(null);

  useEffect(() => {
    fetch(`${API}/schemes/${schemeId}`).then(r => r.json()).then(setScheme).catch(() => {});
  }, [schemeId]);

  async function checkEligibility() {
    const p = {
      ...profile,
      age: parseInt(profile.age) || 0,
      annual_income: parseInt(profile.annual_income) || 0,
    };
    const res = await fetch(`${API}/eligibility/explain`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: p, scheme_id: schemeId }),
    });
    setExplain(await res.json());
  }

  if (!scheme) return <div style={{ padding: 32, color: '#64748b' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 15, marginBottom: 16,
      }}>← Back to schemes</button>

      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <span style={{
            background: scheme.level === 'central' ? '#dbeafe' : '#fef3c7',
            color: scheme.level === 'central' ? '#1d4ed8' : '#92400e',
            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>{scheme.level === 'central' ? 'Central' : 'TN State'}</span>
          <span style={{
            background: '#f1f5f9', color: '#475569', padding: '2px 10px',
            borderRadius: 20, fontSize: 12,
          }}>{scheme.category}</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0', color: '#0f172a' }}>{scheme.name_ta}</h1>
        <h2 style={{ fontSize: 16, fontWeight: 400, color: '#64748b', margin: 0 }}>{scheme.name_en}</h2>
        <p style={{ marginTop: 4, fontSize: 13, color: '#94a3b8' }}>{scheme.ministry}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
          <InfoBox icon="💰" title="பலன் (Benefit)">
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
              {scheme.benefit?.kind === 'monthly' ? `₹${scheme.benefit.amount}/month` :
               scheme.benefit?.kind === 'onetime' ? `₹${scheme.benefit.amount}` :
               scheme.benefit?.kind === 'insurance_cover' ? `₹${scheme.benefit.amount} cover` :
               scheme.benefit?.kind === 'subsidy_pct' ? `${scheme.benefit.amount}% subsidy` :
               scheme.benefit?.kind === 'loan' ? `₹${scheme.benefit.amount} loan` :
               'In-kind benefit'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{scheme.benefit?.description_ta}</div>
          </InfoBox>
          <InfoBox icon="📍" title="எங்கு விண்ணப்பிப்பது (Where)">
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{scheme.where_to_apply}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>☎️ {scheme.helpline}</div>
          </InfoBox>
        </div>

        <InfoBox icon="📝" title="தகுதி (Eligibility)" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#334155' }}>{scheme.eligibility_plain_ta}</p>
        </InfoBox>

        <InfoBox icon="📄" title="தேவையான ஆவணங்கள் (Documents)" style={{ marginTop: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {(scheme.documents_required || []).map((d, i) => (
              <li key={i} style={{ padding: '4px 0', fontSize: 14, color: '#334155' }}>☐ {d}</li>
            ))}
          </ul>
        </InfoBox>

        <InfoBox icon="📋" title="விண்ணப்பிக்கும் முறை (Steps)" style={{ marginTop: 16 }}>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {(scheme.how_to_apply_steps || []).map((s, i) => (
              <li key={i} style={{ padding: '4px 0', fontSize: 14, color: '#334155' }}>{s}</li>
            ))}
          </ol>
        </InfoBox>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" style={{
            color: '#f97316', fontSize: 14,
          }}>🔗 Official Source →</a>
        </div>
      </div>

      {/* ── Eligibility Checker ────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: 24,
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          🧪 தகுதி சரிபார்ப்பு (Check Eligibility)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="வயது (Age)" value={profile.age} onChange={v => setProfile(p => ({ ...p, age: v }))} />
          <Select label="பாலினம் (Gender)" value={profile.gender} options={[['M','ஆண்'],['F','பெண்']]} onChange={v => setProfile(p => ({ ...p, gender: v }))} />
          <Field label="மாவட்டம் (District)" value={profile.district} onChange={v => setProfile(p => ({ ...p, district: v }))} />
          <Select label="தொழில் (Occupation)" value={profile.occupation} options={[['farmer','விவசாயி'],['labourer','கூலி'],['housewife','இல்லத்தரசி'],['student','மாணவர்'],['unemployed','வேலையில்லை'],['fisher','மீனவர்'],['weaver','நெசவாளர்'],['driver','ஓட்டுனர்']]} onChange={v => setProfile(p => ({ ...p, occupation: v }))} />
          <Field label="வருட வருமானம் (Annual income)" value={profile.annual_income} onChange={v => setProfile(p => ({ ...p, annual_income: v }))} />
          <Select label="சமூகப் பிரிவு" value={profile.social_category} options={[['OBC','OBC'],['SC','SC'],['ST','ST'],['MBC','MBC'],['General','General']]} onChange={v => setProfile(p => ({ ...p, social_category: v }))} />
        </div>
        <button onClick={checkEligibility} style={{
          background: '#f97316', color: '#fff', padding: '12px 28px', border: 'none',
          borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16,
        }}>Check Eligibility</button>

        {explain && (
          <div style={{
            marginTop: 16, padding: 20, borderRadius: 12,
            background: explain.eligible ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${explain.eligible ? '#bbf7d0' : '#fecaca'}`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: explain.eligible ? '#059669' : '#dc2626' }}>
              {explain.eligible ? '✅ தகுதி உள்ளது — Eligible!' : '❌ தகுதி இல்லை — Not Eligible'}
            </div>
            <div style={{ marginTop: 12 }}>
              {explain.conditions?.map((c, i) => (
                <div key={i} style={{ padding: '4px 0', fontSize: 14, color: c.met ? '#059669' : '#dc2626' }}>
                  {c.met ? '✓' : '✗'} {JSON.stringify(c.clause)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ icon, title, children, style }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, ...style }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{icon} {title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
        fontSize: 14, boxSizing: 'border-box',
      }} />
    </label>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
        fontSize: 14, boxSizing: 'border-box', background: '#fff',
      }}>
        <option value="">— Select —</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l} ({v})</option>)}
      </select>
    </label>
  );
}
