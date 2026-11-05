import jsonLogic from 'json-logic-js';
import schemes from '../data/schemes';

/**
 * Match a citizen profile against all schemes using JsonLogic rules.
 * Returns matched schemes sorted by priority_weight (descending).
 *
 * @param {Object} profile - Citizen profile with fields like age, gender, etc.
 * @returns {Array} Matched schemes sorted by priority_weight
 */
export function matchSchemes(profile) {
  // Build the data object that JsonLogic evaluates against.
  // Always set state to TN since this is a TN-only app.
  const data = {
    age: Number(profile.age) || 0,
    gender: profile.gender || '',
    marital_status: profile.marital_status || '',
    state: 'TN',
    district: profile.district || '',
    occupation: profile.occupation || '',
    annual_income: Number(profile.annual_income) || 0,
    social_category: profile.social_category || '',
    is_disabled: Boolean(profile.is_disabled),
    is_pregnant: Boolean(profile.is_pregnant),
    land_hectares: Number(profile.land_hectares) || 0,
  };

  const matched = schemes.filter((scheme) => {
    try {
      return jsonLogic.apply(scheme.eligibility_rule, data);
    } catch (e) {
      // If a rule fails to evaluate, skip it
      return false;
    }
  });

  // Sort by priority_weight descending (higher = more important)
  matched.sort((a, b) => (b.priority_weight || 0) - (a.priority_weight || 0));

  return matched;
}
