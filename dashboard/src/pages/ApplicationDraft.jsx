import React, { useState, useEffect } from 'react';

const API = '/api';

export default function ApplicationDraft({ dark = false }) {
  const bg = dark ? '#0b1120' : '#f8fafc';
  const cardBg = dark ? '#1e293b' : '#fff';
  const textColor = dark ? '#e2e8f0' : '#0f172a';
  const subText = dark ? '#94a3b8' : '#64748b';
  const borderColor = dark ? '#334155' : '#e2e8f0';

  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState('');
  const [profile, setProfile] = useState({
    age: '',
    gender: 'F',
    district: '',
    occupation: '',
    annual_income: '',
    marital_status: 'married',
    social_category: 'OBC',
  });
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch schemes on mount
  useEffect(() => {
    fetch(`${API}/schemes`)
      .then(r => r.json())
      .then(data => {
        const list = data.schemes || [];
        setSchemes(list);
        if (list.length > 0) setSelectedScheme(list[0].scheme_id);
      })
      .catch(() => {});
  }, []);

  async function generateDraft() {
    if (!selectedScheme) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const body = {
        profile: {
          ...profile,
          age: parseInt(profile.age) || 0,
          annual_income: parseInt(profile.annual_income) || 0,
          state: 'TN',
        },
        scheme_id: selectedScheme,
      };
      const res = await fetch(`${API}/application/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }
      const data = await res.json();
      setDraft(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: textColor }}>
          📋 Application Draft Generator
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: subText }}>
          Select a scheme and fill in your profile to generate a Tamil application draft with documents checklist.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* ── Form Panel ──────────────────────────────────────────────── */}
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: textColor }}>
            📝 Applicant Details
          </h3>

          {/* Scheme selector */}
          <SelectField
            label="திட்டம் / Scheme"
            value={selectedScheme}
            onChange={v => setSelectedScheme(v)}
            options={schemes.map(s => [s.scheme_id, `${s.name_ta} (${s.name_en})`])}
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <InputField
            label="வயது / Age"
            value={profile.age}
            onChange={v => setProfile(p => ({ ...p, age: v }))}
            type="number"
            placeholder="e.g. 45"
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <SelectField
            label="பாலினம் / Gender"
            value={profile.gender}
            onChange={v => setProfile(p => ({ ...p, gender: v }))}
            options={[['M', 'ஆண் (Male)'], ['F', 'பெண் (Female)']]}
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <InputField
            label="மாவட்டம் / District"
            value={profile.district}
            onChange={v => setProfile(p => ({ ...p, district: v }))}
            placeholder="e.g. Salem"
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <SelectField
            label="தொழில் / Occupation"
            value={profile.occupation}
            onChange={v => setProfile(p => ({ ...p, occupation: v }))}
            options={[
              ['farmer', 'விவசாயி (Farmer)'],
              ['labourer', 'கூலி (Labourer)'],
              ['housewife', 'இல்லத்தரசி (Housewife)'],
              ['student', 'மாணவர் (Student)'],
              ['unemployed', 'வேலையில்லை (Unemployed)'],
              ['fisher', 'மீனவர் (Fisher)'],
              ['weaver', 'நெசவாளர் (Weaver)'],
              ['driver', 'ஓட்டுனர் (Driver)'],
            ]}
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <InputField
            label="வருட வருமானம் / Annual Income (₹)"
            value={profile.annual_income}
            onChange={v => setProfile(p => ({ ...p, annual_income: v }))}
            type="number"
            placeholder="e.g. 60000"
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <SelectField
            label="திருமண நிலை / Marital Status"
            value={profile.marital_status}
            onChange={v => setProfile(p => ({ ...p, marital_status: v }))}
            options={[
              ['married', 'திருமணமானவர் (Married)'],
              ['single', 'திருமணம் ஆகாதவர் (Single)'],
              ['widow', 'விதவை (Widow)'],
              ['divorced', 'விவாகரத்து (Divorced)'],
            ]}
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <SelectField
            label="சமூகப் பிரிவு / Social Category"
            value={profile.social_category}
            onChange={v => setProfile(p => ({ ...p, social_category: v }))}
            options={[
              ['OBC', 'OBC'],
              ['SC', 'SC'],
              ['ST', 'ST'],
              ['MBC', 'MBC'],
              ['General', 'General'],
            ]}
            dark={dark}
            borderColor={borderColor}
            textColor={textColor}
            subText={subText}
          />

          <button
            onClick={generateDraft}
            disabled={loading || !selectedScheme}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px',
              background: loading ? (dark ? '#475569' : '#94a3b8') : '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 15,
            }}
          >
            {loading ? '⏳ Generating…' : '📋 Generate Draft'}
          </button>

          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: dark ? '#451a1a' : '#fef2f2',
              border: `1px solid ${dark ? '#7f1d1d' : '#fecaca'}`,
              color: dark ? '#fca5a5' : '#dc2626',
              fontSize: 13,
            }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* ── Draft Output Panel ──────────────────────────────────────── */}
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: textColor }}>
              📄 Application Draft / விண்ணப்ப வரைவு
            </h3>
            {draft && (
              <button onClick={() => window.print()} style={{
                background: dark ? '#334155' : '#e2e8f0',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: textColor,
              }}>
                🖨️ Print
              </button>
            )}
          </div>

          {!draft ? (
            <div style={{ color: subText, textAlign: 'center', padding: 40, fontSize: 14 }}>
              Fill in the form and click <strong>Generate Draft</strong> to create an application draft.
            </div>
          ) : (
            <div id="application-draft" style={{ fontSize: 14, lineHeight: 1.7, color: textColor }}>
              {/* Header */}
              <div style={{
                background: dark ? '#0f172a' : '#f8fafc',
                borderRadius: 10, padding: 20, marginBottom: 16,
                border: `1px solid ${borderColor}`,
              }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f97316' }}>
                  {draft.title_ta}
                </h2>
                <div style={{ fontSize: 14, color: subText, marginTop: 2 }}>{draft.title_en}</div>
                <div style={{ fontSize: 12, color: subText, marginTop: 6 }}>
                  📅 Generated: {new Date(draft.generated_at).toLocaleString('ta-IN')}
                </div>
              </div>

              {/* Applicant info */}
              <DraftSection title="📝 விண்ணப்பதாரர் தகவல்கள் / Applicant Info" dark={dark} borderColor={borderColor} textColor={textColor}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8,
                }}>
                  {Object.entries(draft.applicant || {}).map(([k, v]) => (
                    <div key={k} style={{
                      background: dark ? '#0f172a' : '#f8fafc',
                      padding: '8px 12px', borderRadius: 6,
                      border: `1px solid ${borderColor}`,
                    }}>
                      <div style={{ fontSize: 11, color: subText, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </DraftSection>

              {/* Scheme info */}
              <DraftSection title="📜 திட்ட விவரங்கள் / Scheme Details" dark={dark} borderColor={borderColor} textColor={textColor}>
                <div style={{ marginBottom: 8 }}>
                  <strong>{draft.scheme?.name_ta}</strong>
                  <span style={{ color: subText, marginLeft: 8 }}>({draft.scheme?.name_en})</span>
                </div>
                {draft.scheme?.ministry && (
                  <div style={{ fontSize: 13, color: subText, marginBottom: 4 }}>🏛️ {draft.scheme.ministry}</div>
                )}
                {draft.scheme?.benefit && (
                  <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 8 }}>
                    💰 {benefitLabel(draft.scheme.benefit)}
                  </div>
                )}
                {draft.scheme?.eligibility_plain_ta && (
                  <div style={{ fontSize: 13, color: subText }}>
                    <strong>தகுதி:</strong> {draft.scheme.eligibility_plain_ta}
                  </div>
                )}
              </DraftSection>

              {/* Documents checklist */}
              <DraftSection title="📄 தேவையான ஆவணங்கள் / Documents Checklist" dark={dark} borderColor={borderColor} textColor={textColor}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(draft.checklist_ta || []).map((doc, i) => (
                    <li key={i} style={{
                      padding: '8px 0',
                      borderBottom: i < (draft.checklist_ta || []).length - 1 ? `1px solid ${borderColor}` : 'none',
                      fontSize: 14,
                      color: textColor,
                    }}>
                      {doc}
                    </li>
                  ))}
                </ul>
              </DraftSection>

              {/* How to apply */}
              {draft.how_to_apply_steps && draft.how_to_apply_steps.length > 0 && (
                <DraftSection title="📋 விண்ணப்பிக்கும் முறை / How to Apply" dark={dark} borderColor={borderColor} textColor={textColor}>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {draft.how_to_apply_steps.map((step, i) => (
                      <li key={i} style={{ padding: '6px 0', fontSize: 14, color: textColor }}>{step}</li>
                    ))}
                  </ol>
                </DraftSection>
              )}

              {/* Where to apply + helpline */}
              <DraftSection title="📍 எங்கு விண்ணப்பிப்பது / Where to Apply" dark={dark} borderColor={borderColor} textColor={textColor}>
                <div style={{ fontSize: 15, fontWeight: 600, color: textColor, marginBottom: 4 }}>
                  {draft.where_to_apply}
                </div>
                {draft.helpline && (
                  <div style={{ fontSize: 13, color: subText }}>☎️ Helpline: {draft.helpline}</div>
                )}
                {draft.source_url && (
                  <a href={draft.source_url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 13, color: '#f97316', marginTop: 4, display: 'inline-block',
                  }}>
                    🔗 Official Source →
                  </a>
                )}
              </DraftSection>

              {/* Note */}
              {draft.note_ta && (
                <div style={{
                  background: dark ? '#1a2332' : '#fffbeb',
                  border: `1px solid ${dark ? '#854d0e' : '#fde68a'}`,
                  borderRadius: 8, padding: 14, marginTop: 16,
                  fontSize: 13, color: dark ? '#fbbf24' : '#92400e',
                }}>
                  ℹ️ {draft.note_ta}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DraftSection({ title, children, dark, borderColor, textColor }) {
  return (
    <div style={{
      marginBottom: 16,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        background: dark ? '#0f172a' : '#f1f5f9',
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: 600,
        color: textColor,
        borderBottom: `1px solid ${borderColor}`,
      }}>
        {title}
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, dark, borderColor, textColor, subText }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: subText, display: 'block', marginBottom: 4 }}>{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          fontSize: 14,
          boxSizing: 'border-box',
          background: dark ? '#0f172a' : '#fff',
          color: textColor,
          outline: 'none',
        }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, dark, borderColor, textColor, subText }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: subText, display: 'block', marginBottom: 4 }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          fontSize: 14,
          boxSizing: 'border-box',
          background: dark ? '#0f172a' : '#fff',
          color: textColor,
        }}
      >
        <option value="">— Select —</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function benefitLabel(b) {
  if (!b) return '';
  if (b.kind === 'monthly') return `₹${b.amount}/month`;
  if (b.kind === 'onetime') return `₹${b.amount} one-time`;
  if (b.kind === 'insurance_cover') return `₹${b.amount} cover`;
  if (b.kind === 'subsidy_pct') return `${b.amount}% subsidy`;
  if (b.kind === 'loan') return `up to ₹${b.amount} loan`;
  if (b.kind === 'inkind') return b.description_ta || 'in-kind';
  return '';
}
