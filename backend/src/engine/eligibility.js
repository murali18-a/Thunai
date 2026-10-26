import jsonLogic from 'json-logic-js';
import { Scheme } from '../data/models.js';
import { isMongoConnected, memSchemes } from '../data/store.js';
import { logger } from '../utils/logger.js';

/**
 * Evaluate a user profile against every active scheme and return matches, ranked.
 *
 * Why deterministic rules (not an LLM): welfare advice must be auditable and legally
 * defensible. A hallucinated "yes, you qualify" is a direct harm to a vulnerable user.
 *
 * @param {object} profile  — user's captured profile (age, gender, state, etc.)
 * @param {object} opts     — { limit, minConfidence }
 * @returns {Promise<Array>} ranked matches with { scheme, score, reason }
 */
export async function matchSchemes(profile, opts = {}) {
  const { limit = 5, minConfidence = 0.5 } = opts;

  const schemes = isMongoConnected()
    ? await Scheme.find({ active: true }).lean()
    : memSchemes();
  const matches = [];

  for (const scheme of schemes) {
    try {
      const applies = jsonLogic.apply(scheme.eligibility_rule, profile);
      if (!applies) continue;

      const score = scoreScheme(scheme, profile);
      if (score < minConfidence) continue;

      matches.push({
        scheme_id: scheme.scheme_id,
        name_ta: scheme.name_ta,
        name_en: scheme.name_en,
        ministry: scheme.ministry,
        benefit: scheme.benefit,
        documents_required: scheme.documents_required,
        where_to_apply: scheme.where_to_apply,
        how_to_apply_steps: scheme.how_to_apply_steps,
        eligibility_plain_ta: scheme.eligibility_plain_ta,
        helpline: scheme.helpline,
        source_url: scheme.source_url,
        score,
        reason_ta: reasonFor(scheme, profile),
      });
    } catch (err) {
      logger.warn({ scheme_id: scheme.scheme_id, err: err.message }, 'rule evaluation failed');
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

/**
 * Score a matching scheme by: annual benefit value, ease of application, priority weight.
 * Higher score → surface earlier in the voice response (voice attention is scarce).
 */
function scoreScheme(scheme, profile) {
  let annualValue = 0;
  const b = scheme.benefit;
  if (b.kind === 'monthly') annualValue = (b.amount || 0) * 12;
  else if (b.kind === 'onetime') annualValue = b.amount || 0;
  else if (b.kind === 'insurance_cover') annualValue = (b.amount || 0) * 0.05; // treat 5% of cover as annual value proxy
  else if (b.kind === 'subsidy_pct') annualValue = 5000; // placeholder — depends on item cost
  else annualValue = 1000;

  // Normalise annual value to 0..1 against a 1 lakh benchmark
  const valueScore = Math.min(1, annualValue / 100000);

  // Priority weight (set per scheme — e.g. flagship CM schemes get a bump)
  const priorityScore = Math.min(1, (scheme.priority_weight || 1) / 10);

  // Urgency flag — elderly, widow, disabled get a priority bump
  let urgencyScore = 0;
  if (profile.age >= 60) urgencyScore += 0.3;
  if (profile.marital_status === 'widow') urgencyScore += 0.3;
  if (profile.is_disabled) urgencyScore += 0.3;
  urgencyScore = Math.min(1, urgencyScore);

  // Weighted combination
  return 0.5 * valueScore + 0.3 * priorityScore + 0.2 * urgencyScore;
}

/**
 * Produce a one-line Tamil reason explaining why this scheme matched.
 */
function reasonFor(scheme, profile) {
  const bits = [];
  if (profile.age >= 60) bits.push('வயது 60 க்கு மேல்');
  if (profile.marital_status === 'widow') bits.push('விதவை');
  if (profile.is_disabled) bits.push('மாற்றுத்திறனாளி');
  if (profile.gender === 'F' && profile.age >= 18) bits.push('பெண்');
  if (profile.occupation === 'farmer') bits.push('விவசாயி');
  if (profile.state === 'TN') bits.push('தமிழ்நாடு வசிப்பவர்');
  const reason = bits.length ? bits.join(', ') : 'பொது தகுதி';
  return `${reason} என்பதால் தகுதி உண்டு`;
}

/**
 * Validate a captured profile is complete enough to match. Returns the next slot to ask for.
 */
export function nextSlotToFill(profile) {
  const required = ['age', 'gender', 'state', 'district'];
  for (const slot of required) {
    if (profile[slot] === null || profile[slot] === undefined) return slot;
  }
  // Second-tier slots improve match quality but are not strictly required
  const secondary = ['marital_status', 'occupation', 'annual_income', 'is_disabled'];
  for (const slot of secondary) {
    if (profile[slot] === null || profile[slot] === undefined) return slot;
  }
  return null;
}
