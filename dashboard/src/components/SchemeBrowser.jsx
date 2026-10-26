import React, { useEffect, useState } from 'react';

export default function SchemeBrowser({ onSelect }) {
  const [schemes, setSchemes] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [level, setLevel] = useState('');

  useEffect(() => { load(); }, [q, cat, level]);

  async function load() {
    const u = new URL('/api/schemes', location.origin);
    if (q) u.searchParams.set('q', q);
    if (cat) u.searchParams.set('category', cat);
    if (level) u.searchParams.set('level', level);
    const r = await fetch(u).then(r => r.json());
    setSchemes(r.schemes || []);
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
        📜 Knowledge Base — {schemes.length} schemes
      </h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Search Tamil / English / tag" value={q} onChange={e => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }} />
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}>
          <option value="">All categories</option>
          {['pension', 'insurance', 'subsidy', 'loan', 'grant', 'education', 'housing', 'maternity', 'employment', 'agriculture', 'food', 'health', 'transport'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}>
          <option value="">All levels</option>
          <option value="central">Central</option>
          <option value="state">TN State</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {schemes.map(s => (
          <div key={s.scheme_id}
            onClick={() => onSelect && onSelect(s.scheme_id)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: 12, padding: 16,
              cursor: onSelect ? 'pointer' : 'default',
              transition: 'all 0.15s',
              background: '#fff',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong style={{ fontSize: 15 }}>{s.name_ta}</strong>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: s.level === 'central' ? '#dbeafe' : '#fef3c7',
                color: s.level === 'central' ? '#1d4ed8' : '#92400e',
                fontWeight: 600,
              }}>{s.level === 'central' ? 'Central' : 'TN'}</span>
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{s.name_en}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.ministry}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Tag>{s.category}</Tag>
              {(s.tags || []).slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}
            </div>
            <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 8 }}>
              {s.benefit?.kind === 'monthly' ? `₹${s.benefit.amount}/month` :
               s.benefit?.kind === 'onetime' ? `₹${s.benefit.amount} one-time` :
               s.benefit?.kind === 'insurance_cover' ? `₹${s.benefit.amount} cover` :
               s.benefit?.kind === 'subsidy_pct' ? `${s.benefit.amount}% subsidy` :
               s.benefit?.kind === 'loan' ? `₹${s.benefit.amount} loan` :
               'In-kind'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 10,
      background: '#f1f5f9', color: '#475569',
    }}>{children}</span>
  );
}
