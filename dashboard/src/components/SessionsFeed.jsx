import React, { useEffect, useState } from 'react';

function Panel({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#334155' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function SessionsFeed() {
  const [sessions, setSessions] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const r = await fetch('/api/sessions/recent?limit=100').then(r => r.json());
    setSessions(r.sessions || []);
  }

  return (
    <Panel title={`Live session feed — ${sessions.length}`}>
      {sessions.length === 0 ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>No sessions yet. Run a simulated call via Try It.</div> :
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, textAlign: 'left' }}>
              <th style={{ padding: 10 }}>Channel</th>
              <th>District</th>
              <th>Outcome</th>
              <th>Duration</th>
              <th>Matches</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.session_id} onClick={() => setOpen(s)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 13 }}>
                <td style={{ padding: 10 }}>{channelPill(s.channel)}</td>
                <td>{s.district || '-'}</td>
                <td>{s.outcome}</td>
                <td>{s.duration_sec || 0}s</td>
                <td>{(s.schemes_matched || []).length}</td>
                <td>{new Date(s.started_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Session {open.session_id}</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {open.channel} · {open.district || 'unknown'} · {open.outcome}
            </div>
            <h4>Captured profile</h4>
            <pre style={{ background: '#f1f5f9', padding: 12, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(open.profile_captured, null, 2)}</pre>
            <h4>Transcript</h4>
            {(open.transcript || []).map((t, i) => (
              <div key={i} style={{ marginBottom: 6, fontSize: 13 }}>
                <strong style={{ color: t.role === 'bot' ? '#f97316' : '#0ea5e9' }}>{t.role}:</strong> {t.text}
              </div>
            ))}
            <h4>Schemes matched</h4>
            <ul>{(open.schemes_matched || []).map(sid => <li key={sid} style={{ fontSize: 13 }}>{sid}</li>)}</ul>
          </div>
        </div>
      )}
    </Panel>
  );
}

function channelPill(ch) {
  const colors = { ivr: '#fed7aa', whatsapp: '#dcfce7', web: '#dbeafe' };
  return <span style={{ padding: '2px 8px', borderRadius: 10, background: colors[ch] || '#e2e8f0', fontSize: 11 }}>{ch}</span>;
}
