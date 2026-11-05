import React, { useState, useRef, useEffect } from 'react';

const API = '/api';

/**
 * IVR call-flow stages and their English translations for the Tamil prompts.
 * Used to display bilingual transcript in the simulator.
 */
const TAMIL_TRANSLATIONS = {
  'வணக்கம்': 'Greetings',
  'தொடர 1 ஐ அழுத்தவும்': 'Press 1 to continue',
  'உங்கள் வயதை எண்களில் சொல்லுங்கள்': 'Tell your age in numbers',
  'நீங்கள் ஆண் என்றால் 1 ஐ, பெண் என்றால் 2 ஐ அழுத்தவும்': 'Press 1 for male, 2 for female',
  'உங்கள் திருமண நிலை': 'Your marital status',
  'நீங்கள் வசிக்கும் மாவட்டத்தின் பெயரைச் சொல்லுங்கள்': 'Tell the name of your district',
  'உங்கள் வேலை என்ன': 'What is your occupation',
  'உங்கள் மாத வருமானத்தை ரூபாயில் சொல்லுங்கள்': 'Tell your monthly income in rupees',
  'நீங்கள் மாற்றுத்திறனாளியா': 'Are you a person with disability',
  'நன்றி': 'Thank you',
  'மன்னிக்கவும்': 'Sorry',
  'திட்டங்களுக்கு நீங்கள் தகுதி': 'You are eligible for schemes',
};

/**
 * Attempt a rough English summary of a Tamil IVR prompt.
 */
function translatePrompt(tamil) {
  if (!tamil) return '';
  for (const [key, eng] of Object.entries(TAMIL_TRANSLATIONS)) {
    if (tamil.includes(key)) return eng + '…';
  }
  if (tamil.includes('திட்டம்')) return 'Scheme information…';
  if (tamil.includes('அழுத்தவும்')) return 'Press a key to respond…';
  return '(Tamil IVR prompt)';
}

/**
 * IVR flow stages — mirrors ivrFlow.js state machine.
 * Each stage: prompt (Tamil), translation (English), input type, options.
 */
const IVR_STAGES = [
  {
    id: 'welcome',
    prompt: 'வணக்கம். நான் துணை. உங்கள் அரசுத் திட்டங்களைக் கண்டுபிடிக்க நான் உதவுவேன். தொடர 1 ஐ அழுத்தவும். தமிழில் பேசவும்.',
    translation: 'Hello. I am Thunai. I will help you find your government schemes. Press 1 to continue. Speak in Tamil.',
    inputType: 'dtmf',
    options: [{ key: '1', label: 'Continue / தொடர' }],
  },
  {
    id: 'age',
    prompt: 'உங்கள் வயதை எண்களில் சொல்லுங்கள்.',
    translation: 'Tell your age in numbers.',
    inputType: 'speech',
    placeholder: 'Type your age (e.g. 45)',
  },
  {
    id: 'gender',
    prompt: 'நீங்கள் ஆண் என்றால் 1 ஐ, பெண் என்றால் 2 ஐ அழுத்தவும்.',
    translation: 'Press 1 for male, 2 for female.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: 'ஆண் / Male' },
      { key: '2', label: 'பெண் / Female' },
    ],
  },
  {
    id: 'marital',
    prompt: 'உங்கள் திருமண நிலை? திருமணமானவர் 1, திருமணம் ஆகாதவர் 2, விதவை 3, விவாகரத்து 4.',
    translation: 'Marital status? Married 1, Single 2, Widow 3, Divorced 4.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: 'திருமணமானவர் / Married' },
      { key: '2', label: 'திருமணம் ஆகாதவர் / Single' },
      { key: '3', label: 'விதவை / Widow' },
      { key: '4', label: 'விவாகரத்து / Divorced' },
    ],
  },
  {
    id: 'district',
    prompt: 'நீங்கள் வசிக்கும் மாவட்டத்தின் பெயரைச் சொல்லுங்கள்.',
    translation: 'Tell the name of your district.',
    inputType: 'speech',
    placeholder: 'Type district name (e.g. Salem)',
  },
  {
    id: 'occupation',
    prompt: 'உங்கள் வேலை என்ன? விவசாயி 1, கூலி 2, இல்லத்தரசி 3, மாணவர் 4, வேலையில்லை 5, மற்றவை 9.',
    translation: 'Occupation? Farmer 1, Labourer 2, Housewife 3, Student 4, Unemployed 5, Other 9.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: 'விவசாயி / Farmer' },
      { key: '2', label: 'கூலி / Labourer' },
      { key: '3', label: 'இல்லத்தரசி / Housewife' },
      { key: '4', label: 'மாணவர் / Student' },
      { key: '5', label: 'வேலையில்லை / Unemployed' },
      { key: '9', label: 'மற்றவை / Other' },
    ],
  },
  {
    id: 'income',
    prompt: 'உங்கள் மாத வருமானத்தை ரூபாயில் சொல்லுங்கள். வருமானம் இல்லை என்றால் பூஜ்ஜியம் சொல்லுங்கள்.',
    translation: 'Tell your monthly income in rupees. If no income, say zero.',
    inputType: 'speech',
    placeholder: 'Monthly income in ₹ (e.g. 5000)',
  },
  {
    id: 'disabled',
    prompt: 'நீங்கள் மாற்றுத்திறனாளியா? ஆம் என்றால் 1, இல்லை என்றால் 2.',
    translation: 'Are you a person with disability? Yes → 1, No → 2.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: 'ஆம் / Yes' },
      { key: '2', label: 'இல்லை / No' },
    ],
  },
];

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export default function CallSimulator({ dark = false }) {
  const bg = dark ? '#0b1120' : '#f8fafc';
  const cardBg = dark ? '#1e293b' : '#fff';
  const textColor = dark ? '#e2e8f0' : '#0f172a';
  const subText = dark ? '#94a3b8' : '#64748b';
  const borderColor = dark ? '#334155' : '#e2e8f0';

  const [mode, setMode] = useState('idle'); // idle | local | api | done
  const [stageIdx, setStageIdx] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [steps, setSteps] = useState([]);
  const [matches, setMatches] = useState([]);
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  function reset() {
    setMode('idle');
    setStageIdx(0);
    setTranscript([]);
    setTextInput('');
    setSteps([]);
    setMatches([]);
    setApiResult(null);
    setLoading(false);
  }

  // ── Start call (local simulation) ──────────────────────────────────────
  function startLocal() {
    reset();
    setMode('local');
    const stage = IVR_STAGES[0];
    setTranscript([{
      role: 'bot',
      tamil: stage.prompt,
      english: stage.translation,
      stage: stage.id,
    }]);
    setStageIdx(0);
  }

  // ── Handle user input in local mode ────────────────────────────────────
  function handleLocalInput(value) {
    if (!value) return;
    const stage = IVR_STAGES[stageIdx];

    // Add user message
    const newTranscript = [...transcript, {
      role: 'user',
      text: value,
      stage: stage.id,
    }];

    const newSteps = [...steps, {
      digits: stage.inputType === 'dtmf' ? value : undefined,
      speech: stage.inputType === 'speech' ? value : undefined,
    }];
    setSteps(newSteps);

    const nextIdx = stageIdx + 1;
    if (nextIdx < IVR_STAGES.length) {
      const next = IVR_STAGES[nextIdx];
      newTranscript.push({
        role: 'bot',
        tamil: next.prompt,
        english: next.translation,
        stage: next.id,
      });
      setStageIdx(nextIdx);
      setTranscript(newTranscript);
    } else {
      // All stages done → call the simulate API
      newTranscript.push({
        role: 'bot',
        tamil: 'உங்கள் தகவல்களைப் பரிசோதிக்கிறேன்...',
        english: 'Processing your information...',
        stage: 'processing',
      });
      setTranscript(newTranscript);
      runSimulateAPI(newSteps, newTranscript);
    }
    setTextInput('');
  }

  // ── Call backend simulate API ──────────────────────────────────────────
  async function runSimulateAPI(allSteps, currentTranscript) {
    setLoading(true);
    try {
      const res = await fetch('/ivr/voice/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: allSteps }),
      });
      const data = await res.json();
      setApiResult(data);
      setMatches(data.matches || []);

      // Add API response history to transcript
      const updated = [...currentTranscript];
      // Remove the "processing" message
      if (updated.length && updated[updated.length - 1].stage === 'processing') {
        updated.pop();
      }
      // Add real bot responses from the API
      for (const h of (data.history || [])) {
        if (h.bot) {
          updated.push({
            role: 'bot',
            tamil: h.bot,
            english: translatePrompt(h.bot),
            stage: 'api_response',
          });
        }
      }
      setTranscript(updated);
      setMode('done');
    } catch (err) {
      // If API fails, show results based on local steps
      const updated = [...currentTranscript];
      if (updated.length && updated[updated.length - 1].stage === 'processing') {
        updated.pop();
      }
      updated.push({
        role: 'bot',
        tamil: 'மன்னிக்கவும், சேவையகத்துடன் தொடர்பு கொள்ள இயலவில்லை.',
        english: 'Sorry, could not connect to the server. Showing local simulation only.',
        stage: 'error',
      });
      setTranscript(updated);
      setMode('done');
    } finally {
      setLoading(false);
    }
  }

  const currentStage = mode === 'local' && stageIdx < IVR_STAGES.length ? IVR_STAGES[stageIdx] : null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: textColor }}>
          📞 IVR Call Simulator
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: subText }}>
          Experience the Thunai IVR call flow turn-by-turn in your browser. Press DTMF keys or type responses.
        </p>
      </div>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {mode === 'idle' && (
          <button onClick={startLocal} style={btnStyle('#f97316')}>
            📞 Start Call
          </button>
        )}
        {(mode === 'done' || mode === 'local') && (
          <button onClick={reset} style={btnStyle(dark ? '#475569' : '#64748b')}>
            🔄 New Call
          </button>
        )}
      </div>

      {/* ── Transcript ──────────────────────────────────────────────── */}
      <div style={{
        background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12,
        padding: 20, minHeight: 300, maxHeight: 500, overflowY: 'auto',
        marginBottom: 20,
      }}>
        {transcript.length === 0 ? (
          <div style={{ color: subText, textAlign: 'center', padding: 40, fontSize: 14 }}>
            Click <strong>Start Call</strong> to begin the IVR simulation.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transcript.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}>
                <div style={{
                  background: msg.role === 'user'
                    ? '#f97316'
                    : (dark ? '#334155' : '#f1f5f9'),
                  color: msg.role === 'user' ? '#fff' : textColor,
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}>
                  {msg.role === 'bot' && (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, opacity: 0.7 }}>
                        🤖 துணை Bot
                      </div>
                      <div>{msg.tamil}</div>
                      <div style={{
                        fontSize: 12,
                        color: dark ? '#94a3b8' : '#64748b',
                        marginTop: 4,
                        fontStyle: 'italic',
                        borderTop: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.2)' : borderColor}`,
                        paddingTop: 4,
                      }}>
                        🇬🇧 {msg.english}
                      </div>
                    </>
                  )}
                  {msg.role === 'user' && (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12, opacity: 0.8 }}>
                        👤 You
                      </div>
                      <div>{msg.text}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Area ──────────────────────────────────────────────── */}
      {mode === 'local' && currentStage && !loading && (
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 13, color: subText, marginBottom: 12 }}>
            {currentStage.inputType === 'dtmf' ? '🔢 Press a button to respond:' : '⌨️ Type your response:'}
          </div>

          {currentStage.inputType === 'dtmf' && currentStage.options ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {currentStage.options.map(opt => (
                <button key={opt.key} onClick={() => handleLocalInput(opt.key)} style={{
                  background: dark ? '#334155' : '#f1f5f9',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: textColor,
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}>
                  <span style={{ fontWeight: 700, color: '#f97316', marginRight: 6 }}>{opt.key}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLocalInput(textInput); }}
                placeholder={currentStage.placeholder || 'Type your response...'}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: dark ? '#0f172a' : '#fff',
                  color: textColor,
                  outline: 'none',
                }}
              />
              <button onClick={() => handleLocalInput(textInput)} style={btnStyle('#f97316')}>
                Send
              </button>
            </div>
          )}

          {/* DTMF keypad */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: subText, marginBottom: 8 }}>DTMF Keypad:</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 48px)',
              gap: 6,
            }}>
              {DTMF_KEYS.map(k => (
                <button key={k} onClick={() => handleLocalInput(k)} style={{
                  width: 48, height: 40,
                  background: dark ? '#1e293b' : '#e2e8f0',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: textColor,
                }}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12,
          padding: 32, textAlign: 'center', color: subText,
        }}>
          ⏳ Processing your call with the Thunai engine…
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────── */}
      {mode === 'done' && (
        <div style={{ marginTop: 20 }}>
          {/* Profile summary */}
          {apiResult?.final_profile && (
            <div style={{
              background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12,
              padding: 20, marginBottom: 16,
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, color: textColor }}>
                👤 Collected Profile
              </h3>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 8,
              }}>
                {Object.entries(apiResult.final_profile).filter(([k]) => k !== 'consent').map(([k, v]) => (
                  <div key={k} style={{
                    background: dark ? '#0f172a' : '#f8fafc',
                    padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                  }}>
                    <div style={{ fontSize: 11, color: subText, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched schemes */}
          <div style={{
            background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12,
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, color: textColor }}>
              ✅ Matched Schemes ({matches.length})
            </h3>
            {matches.length === 0 ? (
              <div style={{ color: subText, textAlign: 'center', padding: 24 }}>
                No matching schemes found for this profile.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matches.map((m, i) => (
                  <div key={m.scheme_id || i} style={{
                    padding: 16, border: `1px solid ${borderColor}`, borderRadius: 10,
                    background: dark ? '#0f172a' : '#f8fafc',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <strong style={{ fontSize: 15, color: textColor }}>{m.name_ta}</strong>
                      {m.score != null && (
                        <span style={{ fontSize: 11, color: subText }}>score {m.score.toFixed(2)}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: subText, marginBottom: 6 }}>{m.name_en}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: textColor, flexWrap: 'wrap' }}>
                      {m.benefit && <span>💰 {benefitLabel(m.benefit)}</span>}
                      {m.where_to_apply && <span>📍 {m.where_to_apply}</span>}
                      {m.helpline && <span>☎️ {m.helpline}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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

function btnStyle(bg) {
  return {
    background: bg,
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
