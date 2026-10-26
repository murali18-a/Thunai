/**
 * IVR state machine — closed-ended DTMF-first flow with voice fallback.
 *
 * Why DTMF-first: Bhashini ASR accuracy drops hard on elderly voices in noisy rural
 * environments. Pressing a digit on a feature-phone keypad has 100% accuracy and
 * near-zero latency. We ask open-ended Tamil speech only when a digit can't capture it
 * (district name, free-form income).
 */

import { PROMPTS, composeMatchSpeech, composeSchemeDetails } from '../engine/composer.js';
import { parseProfile, parseAge, parseDistrict, parseIncome } from '../engine/parser.js';
import { matchSchemes, nextSlotToFill } from '../engine/eligibility.js';
import { getSession, updateSession, appendTranscript, logEvent, endSession } from './sessionManager.js';
import { Scheme } from '../data/models.js';

/**
 * Advance the IVR state machine given an input event. Returns the next TwiML plan.
 *
 * Input event shape:
 *   { kind: 'start' | 'digits' | 'speech', value?: string }
 *
 * Output plan shape:
 *   { say: string, gather: { kind: 'digits' | 'speech', numDigits?: number, hints?: string }, hangup?: boolean }
 */
export async function advance(session_id, event) {
  const s = getSession(session_id);
  if (!s) return { say: PROMPTS.reprompt, hangup: true };

  // Record every user utterance in the transcript
  if (event.kind !== 'start' && event.value) {
    appendTranscript(session_id, 'user', event.value);
  }

  switch (s.stage) {
    case 'greeting':
      updateSession(session_id, { stage: 'consent' });
      return speak(PROMPTS.welcome, { kind: 'digits', numDigits: 1 });

    case 'consent':
      if (event.value === '1') {
        s.profile.consent = true;
        updateSession(session_id, { stage: 'collect_age' });
        return speak(PROMPTS.askAge, { kind: 'speech', hints: 'vayasu, years, age, 20, 30, 40, 50, 60, 70, 80' });
      }
      return speak(PROMPTS.thankyou, null, { hangup: true });

    case 'collect_age': {
      const age = parseAge(event.value || '');
      if (age === null) return speak(PROMPTS.reprompt + ' ' + PROMPTS.askAge, { kind: 'speech' });
      s.profile.age = age;
      updateSession(session_id, { stage: 'collect_gender' });
      return speak(PROMPTS.askGender, { kind: 'digits', numDigits: 1 });
    }

    case 'collect_gender':
      s.profile.gender = event.value === '1' ? 'M' : (event.value === '2' ? 'F' : null);
      if (!s.profile.gender) return speak(PROMPTS.reprompt + ' ' + PROMPTS.askGender, { kind: 'digits', numDigits: 1 });
      updateSession(session_id, { stage: 'collect_marital' });
      return speak(PROMPTS.askMarital, { kind: 'digits', numDigits: 1 });

    case 'collect_marital': {
      const map = { '1': 'married', '2': 'single', '3': 'widow', '4': 'divorced' };
      s.profile.marital_status = map[event.value] || null;
      updateSession(session_id, { stage: 'collect_district' });
      return speak(PROMPTS.askDistrict, { kind: 'speech', hints: 'Namakkal Salem Chennai Madurai Dharmapuri Krishnagiri Erode Coimbatore' });
    }

    case 'collect_district': {
      const district = parseDistrict(event.value || '');
      if (!district) return speak(PROMPTS.reprompt + ' ' + PROMPTS.askDistrict, { kind: 'speech' });
      s.profile.district = district;
      updateSession(session_id, { stage: 'collect_occupation' });
      return speak(PROMPTS.askOccupation, { kind: 'digits', numDigits: 1 });
    }

    case 'collect_occupation': {
      const map = { '1': 'farmer', '2': 'labourer', '3': 'housewife', '4': 'student', '5': 'unemployed', '9': 'other' };
      s.profile.occupation = map[event.value] || null;
      updateSession(session_id, { stage: 'collect_income' });
      return speak(PROMPTS.askIncome, { kind: 'speech', hints: '0, 1000, 5000, 10000, 20000 rupees' });
    }

    case 'collect_income': {
      const income = parseIncome(event.value || '');
      s.profile.annual_income = income ?? 0;
      updateSession(session_id, { stage: 'collect_disabled' });
      return speak(PROMPTS.askDisabled, { kind: 'digits', numDigits: 1 });
    }

    case 'collect_disabled': {
      s.profile.is_disabled = event.value === '1';
      updateSession(session_id, { stage: 'match' });
      // Fall through to matching
      return runMatch(session_id);
    }

    case 'match':
      return runMatch(session_id);

    case 'present_matches': {
      if (event.value === '9') {
        await endSession(session_id, 'completed');
        return speak(PROMPTS.thankyou, null, { hangup: true });
      }
      const idx = parseInt(event.value || '0', 10) - 1;
      if (idx < 0 || idx >= s.matches.length) {
        return speak(PROMPTS.reprompt, { kind: 'digits', numDigits: 1 });
      }
      s.selected_idx = idx;
      await logEvent('scheme_selected', session_id, { scheme_id: s.matches[idx].scheme_id, district: s.profile.district });
      updateSession(session_id, { stage: 'details' });
      return speak(composeSchemeDetails(s.matches[idx]), { kind: 'digits', numDigits: 1 });
    }

    case 'details':
      if (event.value === '0') {
        updateSession(session_id, { stage: 'present_matches' });
        return speak(composeMatchSpeech(s.matches, s.profile), { kind: 'digits', numDigits: 1 });
      }
      await endSession(session_id, 'completed');
      return speak(PROMPTS.thankyou, null, { hangup: true });

    default:
      await endSession(session_id, 'dropped');
      return speak(PROMPTS.thankyou, null, { hangup: true });
  }
}

async function runMatch(session_id) {
  const s = getSession(session_id);
  const matches = await matchSchemes(s.profile, { limit: 5 });
  s.matches = matches;
  await logEvent('schemes_matched', session_id, {
    district: s.profile.district,
    count: matches.length,
    scheme_ids: matches.map(m => m.scheme_id).join(','),
  });
  updateSession(session_id, { stage: 'present_matches' });
  const speech = composeMatchSpeech(matches, s.profile);
  appendTranscript(session_id, 'bot', speech);
  if (!matches.length) {
    await endSession(session_id, 'completed');
    return speak(speech, null, { hangup: true });
  }
  return speak(speech, { kind: 'digits', numDigits: 1 });
}

function speak(text, gather = null, opts = {}) {
  return { say: text, gather, hangup: !!opts.hangup };
}
