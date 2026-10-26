import express from 'express';
import twilio from 'twilio';
import { startSession, getSession, appendTranscript } from '../services/sessionManager.js';
import { advance } from '../services/ivrFlow.js';
import { hashPhone } from '../utils/hash.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export const ivrRouter = express.Router();

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Twilio Voice webhook — inbound call lands here.
 * We identify the caller by hashed phone, start a session, and emit TwiML
 * that <Say>s the first prompt and <Gather>s the first input.
 */
ivrRouter.post('/voice', async (req, res) => {
  const callerPhone = req.body.From || '';
  const callSid = req.body.CallSid || '';
  const phoneHash = hashPhone(callerPhone);
  const session = await startSession({ channel: 'ivr', phoneHash });
  logger.info({ callSid, session_id: session.session_id }, 'IVR call started');
  const plan = await advance(session.session_id, { kind: 'start' });
  return res.type('text/xml').send(twimlFor(session.session_id, plan));
});

/**
 * Twilio <Gather> callback — fires with DTMF digits or speech result.
 */
ivrRouter.post('/voice/gather', async (req, res) => {
  const session_id = req.query.sid;
  const digits = req.body.Digits || '';
  const speech = req.body.SpeechResult || '';
  const value = digits || speech;
  const kind = digits ? 'digits' : 'speech';
  logger.debug({ session_id, kind, value: value.slice(0, 80) }, 'IVR gather');
  const plan = await advance(session_id, { kind, value });
  return res.type('text/xml').send(twimlFor(session_id, plan));
});

/**
 * Build TwiML from a plan returned by the state machine.
 * Uses Twilio's built-in Polly Tamil voice (Aditi) in dev; swap to Bhashini-TTS
 * returned as a <Play> URL for a production-grade voice.
 */
function twimlFor(session_id, plan) {
  const twiml = new VoiceResponse();
  const sayOpts = { voice: 'Polly.Aditi', language: 'hi-IN' }; // Polly has no Tamil; Hindi voice is a workable stand-in in dev
  if (plan.say) twiml.say(sayOpts, plan.say);
  if (plan.hangup) {
    twiml.hangup();
    return twiml.toString();
  }
  if (plan.gather) {
    const g = twiml.gather({
      action: `${config.publicBaseUrl}/ivr/voice/gather?sid=${session_id}`,
      method: 'POST',
      input: plan.gather.kind === 'digits' ? 'dtmf' : 'speech dtmf',
      numDigits: plan.gather.numDigits || 1,
      timeout: 6,
      speechTimeout: 'auto',
      language: 'ta-IN',
      hints: plan.gather.hints || '',
    });
    // Nothing nested — the parent <Say> is already spoken before <Gather> opens.
  } else {
    twiml.hangup();
  }
  return twiml.toString();
}

/**
 * Dev-only: simulate a full IVR conversation over HTTP for testing without a phone.
 * Body: { steps: [{ digits?, speech? }, ...] }
 */
ivrRouter.post('/voice/simulate', async (req, res) => {
  const phoneHash = hashPhone(req.body.phone || '9000000000');
  const session = await startSession({ channel: 'ivr', phoneHash });
  const steps = req.body.steps || [];
  const history = [];
  let plan = await advance(session.session_id, { kind: 'start' });
  history.push({ step: 0, bot: plan.say });
  // Capture state before any possible hangup erases it
  let finalProfile = null;
  let finalMatches = [];
  for (let i = 0; i < steps.length; i++) {
    const { digits, speech } = steps[i];
    const value = digits || speech || '';
    const kind = digits ? 'digits' : 'speech';
    const live = getSession(session.session_id);
    if (live) {
      finalProfile = { ...live.profile };
      finalMatches = (live.matches || []).slice();
    }
    plan = await advance(session.session_id, { kind, value });
    const after = getSession(session.session_id);
    if (after) {
      finalProfile = { ...after.profile };
      finalMatches = (after.matches || []).slice();
    }
    history.push({ step: i + 1, user: value, bot: plan.say, hangup: plan.hangup });
    if (plan.hangup) break;
  }
  res.json({ session_id: session.session_id, final_profile: finalProfile, matches: finalMatches, history });
});
