import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import TryIt from './components/TryIt.jsx';
import SchemeBrowser from './components/SchemeBrowser.jsx';
import SessionsFeed from './components/SessionsFeed.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SchemeDetail from './pages/SchemeDetail.jsx';

// Lazy load the map to avoid SSR issues
const DistrictMap = React.lazy(() => import('./components/DistrictMap.jsx'));

const API = '/api';
const COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#eab308', '#ef4444', '#14b8a6', '#64748b'];

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'admin'
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [schemeStats, setSchemeStats] = useState(null);
  const [dark, setDark] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    if (view === 'admin') {
      refresh();
      const t = setInterval(refresh, 10000);
      return () => clearInterval(t);
    }
  }, [view]);

  async function refresh() {
    try {
      const [s, k] = await Promise.all([
        fetch(`${API}/analytics/summary`).then(r => r.json()),
        fetch(`${API}/schemes-stats`).then(r => r.json()),
      ]);
      setStats(s); setSchemeStats(k);
    } catch (e) { console.warn(e); }
  }

  // Landing page
  if (view === 'landing') {
    return <LandingPage onTryIt={() => { setView('admin'); setTab('try it'); }} />;
  }

  // Scheme detail view
  if (selectedScheme) {
    return (
      <div style={{ minHeight: '100vh', background: dark ? '#0b1120' : '#f8fafc' }}>
        <SchemeDetail schemeId={selectedScheme} onBack={() => setSelectedScheme(null)} />
      </div>
    );
  }

  const bg = dark ? '#0b1120' : '#f8fafc';
  const cardBg = dark ? '#1e293b' : '#fff';
  const textColor = dark ? '#e2e8f0' : '#0f172a';
  const subText = dark ? '#94a3b8' : '#64748b';
  const borderColor = dark ? '#334155' : '#e2e8f0';

  const tabs = ['overview', 'map', 'try it', 'schemes', 'sessions'];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textColor }}>
      <header style={{
        background: dark ? 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' : 'linear-gradient(135deg, #0b1120 0%, #1e293b 100%)',
        color: '#fff', padding: '16px 32px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setView('landing')} style={{
              background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 14,
            }}>← Home</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                <span style={{ color: '#f97316' }}>துணை</span>
                <span style={{ marginLeft: 10, fontSize: 17, fontWeight: 400, opacity: 0.85 }}>Admin Dashboard</span>
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setDark(!dark)} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
            <div style={{ fontSize: 12, opacity: 0.7, textAlign: 'right' }}>
              <div>Thunai v2.0</div>
            </div>
          </div>
        </div>
      </header>

      <nav style={{
        background: cardBg, borderBottom: `1px solid ${borderColor}`,
        padding: '0 32px', display: 'flex', gap: 20, overflowX: 'auto',
      }}>
        {tabs.map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: 'none', border: 'none', padding: '14px 0',
            borderBottom: tab === k ? '3px solid #f97316' : '3px solid transparent',
            color: tab === k ? (dark ? '#fff' : '#0f172a') : subText,
            fontWeight: tab === k ? 600 : 400, cursor: 'pointer', fontSize: 14,
            whiteSpace: 'nowrap',
          }}>{k[0].toUpperCase() + k.slice(1)}</button>
        ))}
      </nav>

      <main style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'overview' && <Overview stats={stats} schemeStats={schemeStats} dark={dark} cardBg={cardBg} borderColor={borderColor} subText={subText} textColor={textColor} />}
        {tab === 'map' && (
          <React.Suspense fallback={<div style={{ color: subText }}>Loading map…</div>}>
            <DistrictMap />
          </React.Suspense>
        )}
        {tab === 'try it' && <TryIt />}
        {tab === 'schemes' && <SchemeBrowser onSelect={setSelectedScheme} />}
        {tab === 'sessions' && <SessionsFeed />}
      </main>
    </div>
  );
}

function Overview({ stats, schemeStats, dark, cardBg, borderColor, subText, textColor }) {
  if (!stats || !schemeStats) return <div style={{ color: subText }}>Loading…</div>;
  const kpis = [
    { label: 'Total calls', value: stats.calls_total || 0, icon: '📞' },
    { label: 'Completed', value: stats.sessions?.completed || 0, icon: '✅' },
    { label: 'Avg call length', value: `${Math.round(stats.sessions?.avg_duration || 0)}s`, icon: '⏱️' },
    { label: 'Live sessions', value: stats.live?.live_sessions || 0, icon: '🔴' },
    { label: 'Schemes in KB', value: schemeStats.total, icon: '📜' },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 13, color: subText, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {k.icon} {k.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, margin: '6px 0', color: textColor }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        <Panel title="Call demand by district" cardBg={cardBg} borderColor={borderColor} textColor={textColor}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.by_district || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis dataKey="_id" fontSize={11} tick={{ fill: subText }} />
              <YAxis fontSize={11} tick={{ fill: subText }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="KB by category" cardBg={cardBg} borderColor={borderColor} textColor={textColor}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={schemeStats.by_category} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id, count }) => `${_id}:${count}`}>
                {schemeStats.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top schemes requested" cardBg={cardBg} borderColor={borderColor} textColor={textColor}>
          {(stats.top_schemes || []).length === 0 ? <Empty label="No scheme selections yet." /> :
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.top_schemes.slice(0, 10).map(s => (
                <li key={s._id} style={{ padding: '10px 0', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{s._id}</span>
                  <span style={{ fontWeight: 600 }}>{s.count}</span>
                </li>
              ))}
            </ul>
          }
        </Panel>
        <Panel title="By channel" cardBg={cardBg} borderColor={borderColor} textColor={textColor}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.by_channel || []}>
              <XAxis dataKey="_id" fontSize={12} tick={{ fill: subText }} />
              <YAxis fontSize={12} tick={{ fill: subText }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, cardBg, borderColor, textColor }) {
  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: 0, marginBottom: 16, fontSize: 15, color: textColor }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ label }) {
  return <div style={{ color: '#94a3b8', padding: 24, textAlign: 'center', fontSize: 14 }}>{label}</div>;
}
