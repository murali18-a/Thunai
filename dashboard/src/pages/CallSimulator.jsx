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

function translatePrompt(tamil) {
  if (!tamil) return '';
  for (const [key, eng] of Object.entries(TAMIL_TRANSLATIONS)) {
    if (tamil.includes(key)) return eng + '…';
  }
  if (tamil.includes('திட்டம்')) return 'Scheme information…';
  if (tamil.includes('அழுத்தவும்')) return 'Press a key to respond…';
  return '(Tamil IVR prompt)';
}

const IVR_STAGES = [
  {
    id: 'welcome',
    prompt: 'வணக்கம். நான் துணை. உங்கள் அரசுத் திட்டங்களைக் கண்டுபிடிக்க நான் உதவுவேன். தொடர 1 ஐ அழுத்தவும். தமிழில் பேசவும்.',
    translation: 'Hello. I am Thunai. I will help you find your government schemes. Press 1 to continue. Speak in Tamil.',
    inputType: 'dtmf',
    options: [{ key: '1', label: '1 - தொடர / Continue' }],
  },
  {
    id: 'age',
    prompt: 'உங்கள் வயதை எண்களில் சொல்லுங்கள்.',
    translation: 'Tell your age in numbers.',
    inputType: 'speech',
    placeholder: 'வயது / Age (e.g. 68)',
  },
  {
    id: 'gender',
    prompt: 'நீங்கள் ஆண் என்றால் 1 ஐ, பெண் என்றால் 2 ஐ அழுத்தவும்.',
    translation: 'Press 1 for male, 2 for female.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: '1 - ஆண் / Male' },
      { key: '2', label: '2 - பெண் / Female' },
    ],
  },
  {
    id: 'marital',
    prompt: 'உங்கள் திருமண நிலை? திருமணமானவர் 1, திருமணம் ஆகாதவர் 2, விதவை 3, விவாகரத்து 4.',
    translation: 'Marital status? Married 1, Single 2, Widow 3, Divorced 4.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: '1 - திருமணமானவர் / Married' },
      { key: '2', label: '2 - திருமணம் ஆகாதவர் / Single' },
      { key: '3', label: '3 - விதவை / Widow' },
      { key: '4', label: '4 - விவாகரத்து / Divorced' },
    ],
  },
  {
    id: 'district',
    prompt: 'நீங்கள் வசிக்கும் மாவட்டத்தின் பெயரைச் சொல்லுங்கள்.',
    translation: 'Tell the name of your district.',
    inputType: 'speech',
    placeholder: 'மாவட்டம் / District (e.g. Namakkal / Salem / Madurai)',
  },
  {
    id: 'occupation',
    prompt: 'உங்கள் வேலை என்ன? விவசாயி 1, கூலி 2, இல்லத்தரசி 3, மாணவர் 4, வேலையில்லை 5, மற்றவை 9.',
    translation: 'Occupation? Farmer 1, Labourer 2, Housewife 3, Student 4, Unemployed 5, Other 9.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: '1 - விவசாயி / Farmer' },
      { key: '2', label: '2 - கூலி / Labourer' },
      { key: '3', label: '3 - இல்லத்தரசி / Housewife' },
      { key: '4', label: '4 - மாணவர் / Student' },
      { key: '5', label: '5 - வேலையில்லை / Unemployed' },
      { key: '9', label: '9 - மற்றவை / Other' },
    ],
  },
  {
    id: 'income',
    prompt: 'உங்கள் மாத வருமானத்தை ரூபாயில் சொல்லுங்கள். வருமானம் இல்லை என்றால் பூஜ்ஜியம் சொல்லுங்கள்.',
    translation: 'Tell your monthly income in rupees. If no income, say zero.',
    inputType: 'speech',
    placeholder: 'மாத வருமானம் / Monthly income (e.g. 0 or 5000)',
  },
  {
    id: 'disabled',
    prompt: 'நீங்கள் மாற்றுத்திறனாளியா? ஆம் என்றால் 1, இல்லை என்றால் 2.',
    translation: 'Are you a person with disability? Yes → 1, No → 2.',
    inputType: 'dtmf',
    options: [
      { key: '1', label: '1 - ஆம் / Yes' },
      { key: '2', label: '2 - இல்லை / No' },
    ],
  },
];

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

function playDTMF(digit) {
  try {
    const freqs = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };
    const pair = freqs[digit] || [700, 1200];
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.08;
    o1.frequency.value = pair[0];
    o2.frequency.value = pair[1];
    o1.connect(g); o2.connect(g);
    g.connect(ctx.destination);
    o1.start(); o2.start();
    setTimeout(() => { o1.stop(); o2.stop(); ctx.close(); }, 150);
  } catch (e) {}
}

export default function CallSimulator({ dark = false }) {
  const bg = dark ? '#0b1120' : '#f8fafc';
  const cardBg = dark ? '#1e293b' : '#fff';
  const textColor = dark ? '#e2e8f0' : '#0f172a';
  const subText = dark ? '#94a3b8' : '#64748b';
  const borderColor = dark ? '#334155' : '#e2e8f0';

  const [mode, setMode] = useState('idle'); // idle | calling | done
  const [stageIdx, setStageIdx] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [steps, setSteps] = useState([]);
  const [matches, setMatches] = useState([]);
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Speak prompt using Web Speech API
  function speak(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const tamilVoice = voices.find(v => v.lang.startsWith('ta')) || voices.find(v => v.lang.includes('IN'));
      if (tamilVoice) utt.voice = tamilVoice;
      utt.lang = tamilVoice ? tamilVoice.lang : 'ta-IN';
      utt.rate = 0.92;
      window.speechSynthesis.speak(utt);
    } catch (e) {}
  }

  function reset() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setMode('idle');
    setStageIdx(0);
    setTranscript([]);
    setTextInput('');
    setSteps([]);
    setMatches([]);
    setApiResult(null);
    setLoading(false);
  }

  // ── Start call ──────────────────────────────────────
  function startCall() {
    reset();
    setMode('calling');
    playDTMF('1');
    const stage = IVR_STAGES[0];
    setTranscript([{
      role: 'bot',
      tamil: stage.prompt,
      english: stage.translation,
      stage: stage.id,
    }]);
    setStageIdx(0);
    speak(stage.prompt);
  }

  // ── Handle user input ────────────────────────────────────
  function handleInput(value) {
    if (!value) return;
    const stage = IVR_STAGES[stageIdx];
    if (stage.inputType === 'dtmf') {
      playDTMF(value);
    }

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
      speak(next.prompt);
    } else {
      newTranscript.push({
        role: 'bot',
        tamil: 'உங்கள் தகவல்களைப் பரிசீலிக்கிறேன்...',
        english: 'Checking your eligible schemes with the rule engine...',
        stage: 'processing',
      });
      setTranscript(newTranscript);
      speak('உங்கள் தகவல்களைப் பரிசீலிக்கிறேன்');
      runSimulateAPI(newSteps, newTranscript);
    }
    setTextInput('');
  }

  // ── Speech-to-text mic input ─────────────────────────────
  function startMic() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Microphone input is available in Chrome, Edge, and Android browsers.');
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'ta-IN';
      rec.interimResults = false;
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (e) => {
        const spoken = e.results[0][0].transcript;
        if (spoken) {
          handleInput(spoken);
        }
      };
      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  }

  // ── Call backend simulate API ──────────────────────────
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

      const updated = [...currentTranscript];
      if (updated.length && updated[updated.length - 1].stage === 'processing') {
        updated.pop();
      }

      // Add real bot final announcement
      const matchCount = (data.matches || []).length;
      const finalMsg = matchCount > 0
        ? `நன்றி! உங்கள் தகவலின் படி ${matchCount} திட்டங்களுக்கு நீங்கள் தகுதி பெறுகிறீர்கள்.`
        : 'நன்றி. உங்கள் தகவலுக்கு தற்போது பொருத்தமான திட்டங்கள் கிடைக்கவில்லை.';

      updated.push({
        role: 'bot',
        tamil: finalMsg,
        english: `Found ${matchCount} eligible government schemes for your profile.`,
        stage: 'completed',
      });

      setTranscript(updated);
      setMode('done');
      speak(finalMsg);
    } catch (err) {
      const updated = [...currentTranscript];
      if (updated.length && updated[updated.length - 1].stage === 'processing') {
        updated.pop();
      }
      updated.push({
        role: 'bot',
        tamil: 'மன்னிக்கவும், தகவல்களைப் பெறுவதில் பிழை ஏற்பட்டுள்ளது.',
        english: 'Completed simulation.',
        stage: 'error',
      });
      setTranscript(updated);
      setMode('done');
    } finally {
      setLoading(false);
    }
  }

  const currentStage = mode === 'calling' && stageIdx < IVR_STAGES.length ? IVR_STAGES[stageIdx] : null;

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: textColor }}>
            📞 துணை நேரடி குரல் அழைப்பு (Live Voice IVR)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: subText }}>
            Real-time Tamil voice navigation. Works in browser on laptop and mobile without international calling fees!
          </p>
        </div>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          style={{
            background: voiceEnabled ? '#22c55e' : (dark ? '#475569' : '#cbd5e1'),
            color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {voiceEnabled ? '🔊 Voice: ON' : '🔇 Voice: OFF'}
        </button>
      </div>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {mode === 'idle' && (
          <button onClick={startCall} style={btnStyle('#16a34a', '16px')}>
            📞 Call Thunai Now (அழைப்பைத் தொடங்கு)
          </button>
        )}
        {mode === 'calling' && (
          <button onClick={reset} style={btnStyle('#dc2626')}>
            🛑 End Call (அழைப்பை முடி)
          </button>
        )}
        {mode === 'done' && (
          <button onClick={startCall} style={btnStyle('#f97316')}>
            🔄 Call Again (மீண்டும் அழைக்க)
          </button>
        )}
      </div>

      {/* ── Live Call Screen ────────────────────────────────────────── */}
      <div style={{
        background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16,
        padding: 20, minHeight: 280, maxHeight: 460, overflowY: 'auto',
        marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        {transcript.length === 0 ? (
          <div style={{ color: subText, textAlign: 'center', padding: '60px 20px', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
            Click <strong>Call Thunai Now</strong> above to start speaking with the Tamil scheme navigator.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transcript.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{
                  background: msg.role === 'user'
                    ? '#f97316'
                    : (dark ? '#334155' : '#f1f5f9'),
                  color: msg.role === 'user' ? '#fff' : textColor,
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 15,
                  lineHeight: 1.5,
                }}>
                  {msg.role === 'bot' && (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#f97316' }}>
                        🎙️ துணை (Thunai Voice)
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{msg.tamil}</div>
                      {msg.english && (
                        <div style={{
                          fontSize: 12,
                          color: dark ? '#94a3b8' : '#64748b',
                          marginTop: 6,
                          borderTop: `1px solid ${borderColor}`,
                          paddingTop: 4,
                        }}>
                          🇬🇧 {msg.english}
                        </div>
                      )}
                    </>
                  )}
                  {msg.role === 'user' && (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 11, opacity: 0.85 }}>
                        👤 You
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{msg.text}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Interaction Area ──────────────────────────────────── */}
      {mode === 'calling' && currentStage && !loading && (
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f97316', marginBottom: 12 }}>
            {currentStage.inputType === 'dtmf' ? '🔢 Dialpad Options (பொத்தானை அழுத்தவும்):' : '🎙️ Speak or Type your response:'}
          </div>

          {currentStage.inputType === 'dtmf' && currentStage.options ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
              {currentStage.options.map(opt => (
                <button key={opt.key} onClick={() => handleInput(opt.key)} style={{
                  background: dark ? '#1e293b' : '#fff',
                  border: `2px solid ${borderColor}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  fontSize: 15,
                  color: textColor,
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 14, background: '#f97316',
                    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 10, fontSize: 14,
                  }}>{opt.key}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleInput(textInput); }}
                placeholder={currentStage.placeholder || 'பதில் உள்ளிடவும் / Type response...'}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: 10,
                  fontSize: 16,
                  background: dark ? '#0f172a' : '#fff',
                  color: textColor,
                  outline: 'none',
                }}
              />
              <button
                onClick={startMic}
                style={{
                  background: isListening ? '#dc2626' : '#0ea5e9',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px',
                  cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {isListening ? '🔴 கேட்கிறது...' : '🎙️ Mic'}
              </button>
              <button onClick={() => handleInput(textInput)} style={btnStyle('#f97316')}>
                Send →
              </button>
            </div>
          )}

          {/* DTMF Keypad */}
          <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: subText, marginBottom: 8, fontWeight: 500 }}>
              Phone Dialpad (ஆடியோ கீபேட்):
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 52px)', gap: 8,
            }}>
              {DTMF_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => { playDTMF(k); if (currentStage.inputType === 'dtmf') handleInput(k); }}
                  style={{
                    height: 44,
                    background: dark ? '#334155' : '#e2e8f0',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: textColor,
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16,
          padding: 32, textAlign: 'center', color: subText, fontSize: 16,
        }}>
          ⏳ அரசுத் திட்ட விதிகளுடன் ஒப்பிட்டுப் பார்க்கிறது... (Evaluating 150 schemes with JsonLogic engine)
        </div>
      )}

      {/* ── Matched Schemes Result ─────────────────────────────────── */}
      {mode === 'done' && (
        <div style={{ marginTop: 20 }}>
          {apiResult?.final_profile && (
            <div style={{
              background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16,
              padding: 20, marginBottom: 16,
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, color: textColor }}>
                👤 குடிமகன் விவரம் (Captured Profile)
              </h3>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 8,
              }}>
                {Object.entries(apiResult.final_profile).filter(([k]) => k !== 'consent').map(([k, v]) => (
                  <div key={k} style={{
                    background: dark ? '#0f172a' : '#f8fafc',
                    padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                  }}>
                    <div style={{ fontSize: 11, color: subText, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: textColor }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16,
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#16a34a' }}>
              🎉 உங்களுக்குப் பொருத்தமான அரசுத் திட்டங்கள் ({matches.length})
            </h3>
            {matches.length === 0 ? (
              <div style={{ color: subText, textAlign: 'center', padding: 24 }}>
                பொருத்தமான திட்டங்கள் இல்லை (No matching schemes found for this profile).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {matches.map((m, i) => (
                  <div key={m.scheme_id || i} style={{
                    padding: 18, border: `1px solid ${borderColor}`, borderRadius: 12,
                    background: dark ? '#0f172a' : '#f8fafc',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: textColor }}>{m.name_ta}</div>
                        <div style={{ fontSize: 13, color: subText }}>{m.name_en}</div>
                      </div>
                      <span style={{
                        background: '#dcfce7', color: '#16a34a', padding: '4px 10px',
                        borderRadius: 12, fontSize: 12, fontWeight: 700,
                      }}>
                        {m.level === 'state' ? 'தமிழ்நாடு' : 'மத்திய அரசு'}
                      </span>
                    </div>
                    {m.benefit && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', margin: '8px 0' }}>
                        💰 பலன்: {m.benefit.description_ta || `₹${m.benefit.amount}`}
                      </div>
                    )}
                    {m.eligibility_plain_ta && (
                      <div style={{ fontSize: 13, color: subText, marginBottom: 8, lineHeight: 1.5 }}>
                        ✅ {m.eligibility_plain_ta}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: textColor, flexWrap: 'wrap', borderTop: `1px solid ${borderColor}`, paddingTop: 8 }}>
                      {m.where_to_apply && <span>📍 எங்கு: <strong>{m.where_to_apply}</strong></span>}
                      {m.helpline && <span>☎️ உதவி எண்: <strong>{m.helpline}</strong></span>}
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

function btnStyle(bg, fontSize = '14px') {
  return {
    background: bg,
    color: '#fff',
    padding: '12px 22px',
    border: 'none',
    borderRadius: 10,
    fontSize,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  };
}
