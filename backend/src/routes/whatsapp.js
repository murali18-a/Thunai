import express from 'express';
import twilio from 'twilio';
import { startSession, getSession, updateSession, appendTranscript, endSession, logEvent } from '../services/sessionManager.js';
import { parseProfile, parseAge, parseDistrict, parseIncome } from '../engine/parser.js';
import { matchSchemes, nextSlotToFill } from '../engine/eligibility.js';
import { composeWhatsAppReply, PROMPTS } from '../engine/composer.js';
import { hashPhone } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

export const waRouter = express.Router();

const MessagingResponse = twilio.twiml.MessagingResponse;

// In-memory map of waId -> session_id (WhatsApp is turn-based, no CallSid)
const waSessions = new Map();

/**
 * Twilio WhatsApp webhook. Each inbound text drives the slot-filler to completion,
 * then returns the matched schemes.
 */
waRouter.post('/whatsapp/inbound', async (req, res) => {
  const from = req.body.From || '';                    // whatsapp:+91...
  const body = (req.body.Body || '').trim();
  const phone = from.replace('whatsapp:', '');
  const phoneHash = hashPhone(phone);

  let session_id = waSessions.get(phoneHash);
  let s = session_id ? getSession(session_id) : null;
  if (!s) {
    s = await startSession({ channel: 'whatsapp', phoneHash });
    session_id = s.session_id;
    waSessions.set(phoneHash, session_id);
  }

  appendTranscript(session_id, 'user', body);

  // 1) Try to parse the free-form message
  const extracted = parseProfile(body);
  for (const [k, v] of Object.entries(extracted)) {
    if (v !== null && v !== undefined) s.profile[k] = v;
  }

  // 2) Figure out what's still missing
  const missing = nextSlotToFill(s.profile);
  const twiml = new MessagingResponse();

  if (missing) {
    twiml.message(promptFor(missing));
    return res.type('text/xml').send(twiml.toString());
  }

  // 3) All slots filled — match & reply
  const matches = await matchSchemes(s.profile, { limit: 5 });
  s.matches = matches;
  await logEvent('schemes_matched', session_id, {
    district: s.profile.district,
    count: matches.length,
  });
  const reply = composeWhatsAppReply(matches, s.profile);
  twiml.message(reply);
  await endSession(session_id, 'completed');
  waSessions.delete(phoneHash);
  return res.type('text/xml').send(twiml.toString());
});

function promptFor(slot) {
  const map = {
    age: 'வணக்கம்! நான் *துணை*. உங்களுக்கான அரசுத் திட்டங்களை நான் கண்டுபிடிப்பேன்.\n\nமுதலில் உங்கள் வயதை எண்களில் அனுப்புங்கள் (உதா: 65).',
    gender: 'உங்கள் பாலினம்? *ஆண்* அல்லது *பெண்* என்று அனுப்புங்கள்.',
    state: 'நீங்கள் தமிழ்நாட்டில் வசிக்கிறீர்களா? *ஆம்* அல்லது *இல்லை* என்று அனுப்புங்கள்.',
    district: 'உங்கள் மாவட்டம் எது? (உதா: நாமக்கல், சேலம், சென்னை, மதுரை)',
    marital_status: 'உங்கள் திருமண நிலை? *திருமணமானவர் / திருமணம் ஆகாதவர் / விதவை / விவாகரத்து*',
    occupation: 'உங்கள் வேலை என்ன? (விவசாயி, கூலி, இல்லத்தரசி, மாணவர், வேலையில்லை...)',
    annual_income: 'உங்கள் மாத வருமானம் எவ்வளவு ரூபாய்? (வருமானம் இல்லை என்றால் 0 என்று அனுப்புங்கள்)',
    is_disabled: 'நீங்கள் மாற்றுத்திறனாளியா? *ஆம்* அல்லது *இல்லை*',
  };
  return map[slot] || 'தயவுசெய்து மேலும் தகவல்களைச் சொல்லுங்கள்.';
}

/**
 * Dev-only: simulate a WhatsApp conversation turn-by-turn.
 */
waRouter.post('/whatsapp/simulate', async (req, res) => {
  const phoneHash = hashPhone(req.body.phone || '9000000001');
  const messages = req.body.messages || [];
  const history = [];
  let session_id = null;
  let s = null;
  for (const msg of messages) {
    if (!s) {
      s = await startSession({ channel: 'whatsapp', phoneHash });
      session_id = s.session_id;
    }
    appendTranscript(session_id, 'user', msg);
    const extracted = parseProfile(msg);
    for (const [k, v] of Object.entries(extracted)) {
      if (v !== null && v !== undefined) s.profile[k] = v;
    }
    const missing = nextSlotToFill(s.profile);
    if (missing) {
      history.push({ user: msg, bot: promptFor(missing) });
    } else {
      const matches = await matchSchemes(s.profile, { limit: 5 });
      s.matches = matches;
      history.push({ user: msg, bot: composeWhatsAppReply(matches, s.profile), done: true });
      await endSession(session_id, 'completed');
      break;
    }
  }
  res.json({ session_id, profile: s?.profile, history });
});
