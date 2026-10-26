import React, { useEffect, useState } from 'react';

const API = '/api';

/**
 * Public landing page for Thunai — this is what visitors see at "/"
 * Features: animated counters, dial-in CTA, "try it" button, scheme search, dark hero.
 */
export default function LandingPage({ onTryIt }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/stats/public`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0b1120 0%, #1e293b 50%, #0f172a 100%)',
        color: '#fff', padding: '80px 24px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
          <span style={{ color: '#f97316' }}>துணை</span>
          <span style={{ display: 'block', fontSize: '0.5em', fontWeight: 400, opacity: 0.9, marginTop: 8 }}>
            Thunai — Your Rights, Your Voice
          </span>
        </h1>
        <p style={{ maxWidth: 600, margin: '24px auto', opacity: 0.85, fontSize: 18, lineHeight: 1.6 }}>
          Tamil Nadu's first voice-first scheme navigator. Dial in from any phone, speak in Tamil,
          and discover government schemes you're eligible for — no app, no internet, no literacy required.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
          <a href="tel:+911234567890" style={{
            background: '#f97316', color: '#fff', padding: '16px 32px', borderRadius: 12,
            fontSize: 18, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(249,115,22,0.4)', transition: 'transform 0.2s',
          }}>
            📞 டயல் செய்யுங்கள்
          </a>
          <button onClick={onTryIt} style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 32px',
            borderRadius: 12, fontSize: 18, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
          }}>
            🧪 Try It Online
          </button>
        </div>
      </section>

      {/* ── Counters ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '48px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24,
          textAlign: 'center',
        }}>
          <Counter value={stats?.schemes || 0} suffix="+" label="திட்டங்கள் (Schemes)" />
          <Counter value={stats?.districts_covered || 0} label="மாவட்டங்கள் (Districts)" />
          <Counter value={stats?.offices || 0} suffix="+" label="அலுவலகங்கள் (Offices)" />
          <Counter value={stats?.beneficiaries_helped || 0} label="பயனாளிகள் (Helped)" />
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 40 }}>
          எப்படி செயல்படுகிறது?
          <span style={{ display: 'block', fontSize: 16, fontWeight: 400, color: '#64748b', marginTop: 4 }}>
            How does it work?
          </span>
        </h2>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24,
        }}>
          {[
            { icon: '📞', title_ta: 'அழைக்கவும்', title_en: 'Call the number', desc: 'Dial the Thunai number from any phone — feature phone or smart phone.' },
            { icon: '🗣️', title_ta: 'தமிழில் பேசுங்கள்', title_en: 'Speak in Tamil', desc: 'Answer simple voice questions about your age, income, and occupation.' },
            { icon: '✅', title_ta: 'திட்டங்கள் பாருங்கள்', title_en: 'Get matched schemes', desc: 'Our engine matches you to eligible schemes — no LLM, 100% deterministic.' },
            { icon: '📱', title_ta: 'SMS பெறுங்கள்', title_en: 'Receive SMS summary', desc: 'Get a summary with documents needed and where to apply, via SMS.' },
          ].map((step, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: 28, textAlign: 'center',
              border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{step.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{step.title_ta}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{step.title_en}</div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Barriers ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#0f172a', color: '#fff', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 40 }}>
          4 Barriers We Break
        </h2>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20,
        }}>
          {[
            { barrier: 'Language', icon: '🗣️', solution: 'Tamil-first, not translated. Natural rural Tamil prompts.' },
            { barrier: 'Literacy', icon: '📖', solution: 'Voice-first IVR. No reading, no typing, no app needed.' },
            { barrier: 'Connectivity', icon: '📶', solution: 'Works on any phone network. Feature phone compatible.' },
            { barrier: 'Awareness', icon: '💡', solution: '150 schemes, auto-matched. Citizens get what they deserve.' },
          ].map((b, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{b.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{b.barrier}</div>
              <p style={{ fontSize: 14, opacity: 0.85, marginTop: 8, lineHeight: 1.5 }}>{b.solution}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        background: '#0b1120', color: '#94a3b8', padding: '32px 24px', textAlign: 'center', fontSize: 13,
      }}>
        <p>Open source · MIT License</p>
        <p>Built with ❤️ by Murali A · B.Tech IT · Sona College of Technology, Salem</p>
        <p style={{ marginTop: 8, opacity: 0.6 }}>
          Zero-LLM. Deterministic. Privacy-first. Open-source.
        </p>
      </footer>
    </div>
  );
}

function Counter({ value, suffix = '', label }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#f97316' }}>{display}{suffix}</div>
      <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}
