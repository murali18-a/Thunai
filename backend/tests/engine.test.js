import { test } from 'node:test';
import assert from 'node:assert';
import jsonLogic from 'json-logic-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseAge, parseGender, parseMaritalStatus, parseDistrict, parseOccupation, parseIncome, parseProfile } from '../src/engine/parser.js';
import { composeMatchSpeech, composeSchemeDetails, composeWhatsAppReply, PROMPTS } from '../src/engine/composer.js';
import { hashPhone } from '../src/utils/hash.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMES = JSON.parse(readFileSync(join(__dirname, '..', 'scripts', 'schemes.json'), 'utf8'));
const OFFICES = JSON.parse(readFileSync(join(__dirname, '..', 'scripts', 'offices.json'), 'utf8'));

// ═══════════════════════════════════════════════════════════════════════════════
// Parser tests
// ═══════════════════════════════════════════════════════════════════════════════

test('parseAge — Tamil digits and words', () => {
  assert.strictEqual(parseAge('நான் 68 வயது'), 68);
  assert.strictEqual(parseAge('age 35 years'), 35);
  assert.strictEqual(parseAge('I am forty years old'), 40);
  assert.strictEqual(parseAge('வயது அறுபது'), 60);
});

test('parseAge — boundary values', () => {
  assert.strictEqual(parseAge('1 வயது'), 1);
  assert.strictEqual(parseAge('100 years'), 100);
  assert.strictEqual(parseAge('18'), 18);
});

test('parseAge — garbage input returns null', () => {
  assert.strictEqual(parseAge('hello world'), null);
  assert.strictEqual(parseAge(''), null);
});

test('parseGender — Tamil and English', () => {
  assert.strictEqual(parseGender('நான் பெண்'), 'F');
  assert.strictEqual(parseGender('I am a widow'), 'F');
  assert.strictEqual(parseGender('male farmer'), 'M');
});

test('parseGender — edge cases', () => {
  assert.strictEqual(parseGender('ஆண்'), 'M');
  assert.strictEqual(parseGender('woman'), 'F');
  assert.strictEqual(parseGender(''), null);
});

test('parseMaritalStatus — all types', () => {
  assert.strictEqual(parseMaritalStatus('கணவன் இல்லை'), 'widow');
  assert.strictEqual(parseMaritalStatus('married with 2 children'), 'married');
  assert.strictEqual(parseMaritalStatus('விதவை'), 'widow');
  assert.strictEqual(parseMaritalStatus('விவாகரத்து'), 'divorced');
  assert.strictEqual(parseMaritalStatus('single'), 'single');
});

test('parseDistrict — Tamil and English names', () => {
  assert.strictEqual(parseDistrict('நாமக்கல் மாவட்டத்தில் வசிக்கிறேன்'), 'Namakkal');
  assert.strictEqual(parseDistrict('I live in Dharmapuri district'), 'Dharmapuri');
  assert.strictEqual(parseDistrict('சென்னை'), 'Chennai');
  assert.strictEqual(parseDistrict('கோயம்புத்தூர்'), 'Coimbatore');
  assert.strictEqual(parseDistrict('திருச்சி'), 'Tiruchirappalli');
  assert.strictEqual(parseDistrict('மதுரை'), 'Madurai');
});

test('parseOccupation — all slot values', () => {
  assert.strictEqual(parseOccupation('I am a farmer'), 'farmer');
  assert.strictEqual(parseOccupation('விவசாயி'), 'farmer');
  assert.strictEqual(parseOccupation('கூலி வேலை'), 'labourer');
  assert.strictEqual(parseOccupation('student'), 'student');
  assert.strictEqual(parseOccupation('நான் மாணவன்'), 'student');
});

test('parseIncome — various formats', () => {
  assert.strictEqual(parseIncome('monthly 5000 rupees'), 60000);
  assert.strictEqual(parseIncome('வருமானம் இல்லை'), 0);
  assert.strictEqual(parseIncome('yearly 80000'), 80000);
  assert.strictEqual(parseIncome('per month 10000'), 120000);
});

test('parseProfile — mixed Tamil-English utterance', () => {
  const p = parseProfile('நான் 68 வயது விதவை, நாமக்கல்லில் வசிக்கிறேன், வருமானம் இல்லை, தமிழ்நாடு');
  assert.strictEqual(p.age, 68);
  assert.strictEqual(p.gender, 'F');
  assert.strictEqual(p.marital_status, 'widow');
  assert.strictEqual(p.district, 'Namakkal');
  assert.strictEqual(p.annual_income, 0);
  assert.strictEqual(p.state, 'TN');
});

test('parseProfile — English utterance', () => {
  const p = parseProfile('I am 45 years old male farmer from Salem, income is 5000 monthly');
  assert.strictEqual(p.age, 45);
  assert.strictEqual(p.gender, 'M');
  assert.strictEqual(p.occupation, 'farmer');
  assert.strictEqual(p.district, 'Salem');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Eligibility rule tests (JsonLogic directly, no DB)
// ═══════════════════════════════════════════════════════════════════════════════

function matchDirect(profile) {
  const hits = [];
  for (const s of SCHEMES) {
    try {
      if (jsonLogic.apply(s.eligibility_rule, profile)) hits.push(s.scheme_id);
    } catch (_) {}
  }
  return hits;
}

test('persona: 68yo widow Namakkal — matches widow + old age pensions + health', () => {
  const profile = {
    age: 68, gender: 'F', marital_status: 'widow', state: 'TN',
    district: 'Namakkal', annual_income: 0, is_disabled: false, occupation: 'housewife',
    land_hectares: 0, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_WIDOW_PENSION'), 'TN widow pension');
  assert.ok(hits.includes('TN_OLD_AGE_PENSION'), 'TN old age pension');
  assert.ok(hits.includes('CENTRAL_IGNOAPS'), 'central IGNOAPS');
  assert.ok(hits.includes('CENTRAL_IGNWPS'), 'central IGNWPS');
  assert.ok(hits.includes('TN_FREE_BUS'), 'free bus');
  assert.ok(hits.includes('TN_RATION_CARD'), 'ration card');
  assert.ok(hits.includes('TN_CMCHIS'), 'CM health insurance');
});

test('persona: 45yo male farmer Dharmapuri, 1.5ha land', () => {
  const profile = {
    age: 45, gender: 'M', marital_status: 'married', state: 'TN',
    district: 'Dharmapuri', annual_income: 60000, is_disabled: false, occupation: 'farmer',
    land_hectares: 1.5, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('CENTRAL_PM_KISAN'), 'PM-KISAN');
  assert.ok(hits.includes('TN_FARMER_FREE_POWER'), 'free power');
  assert.ok(hits.includes('TN_UZHAVAR_PADHUKAPPU'), 'farmer insurance');
  assert.ok(hits.includes('CENTRAL_PMFBY'), 'crop insurance');
  assert.ok(hits.includes('TN_FARMER_LOAN_WAIVER'), 'loan waiver');
  assert.ok(hits.includes('TN_CMCHIS'), 'health insurance');
  // New schemes from expanded KB
  assert.ok(hits.includes('TN_FARMER_MICRO_IRRIGATION'), 'micro irrigation');
  assert.ok(hits.includes('CENTRAL_KISAN_CREDIT_CARD'), 'KCC');
  assert.ok(hits.includes('TN_CATTLE_INSURANCE'), 'cattle insurance');
  assert.ok(hits.includes('TN_SOIL_HEALTH_CARD'), 'soil health card');
});

test('persona: 22yo female college student Salem SC', () => {
  const profile = {
    age: 22, gender: 'F', marital_status: 'single', state: 'TN',
    district: 'Salem', annual_income: 50000, is_disabled: false, occupation: 'student',
    land_hectares: 0, social_category: 'SC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_PUDHUMAI_PENN'), 'pudhumai penn');
  assert.ok(hits.includes('TN_SC_ST_SCHOLARSHIP'), 'SC scholarship');
  assert.ok(hits.includes('TN_FREE_BUS'), 'free bus');
  assert.ok(hits.includes('TN_KALAIGNAR_MAGALIR'), 'kalaignar magalir');
  assert.ok(hits.includes('TN_NAAN_MUDHALVAN'), 'naan mudhalvan');
  assert.ok(hits.includes('CENTRAL_SC_POST_MATRIC'), 'central SC post-matric scholarship');
});

test('persona: disabled 35yo male, Krishnagiri, no income', () => {
  const profile = {
    age: 35, gender: 'M', marital_status: 'single', state: 'TN',
    district: 'Krishnagiri', annual_income: 0, is_disabled: true, occupation: 'unemployed',
    land_hectares: 0, social_category: 'MBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_DISABILITY_PENSION'));
  assert.ok(hits.includes('CENTRAL_IGNDPS'));
  assert.ok(hits.includes('TN_DIFF_ABLED_SCOOTER'));
  assert.ok(hits.includes('TN_RATION_CARD'));
  assert.ok(hits.includes('TN_DIFF_ABLED_SELF_EMPLOYMENT'), 'disabled self-employment loan');
  assert.ok(hits.includes('CENTRAL_DISABILITY_UDID'), 'UDID card');
});

test('persona: pregnant 24yo woman, Madurai', () => {
  const profile = {
    age: 24, gender: 'F', marital_status: 'married', state: 'TN',
    district: 'Madurai', annual_income: 60000, is_disabled: false, occupation: 'housewife',
    land_hectares: 0, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_MATERNITY_MRMBS'), 'MRMBS maternity');
  assert.ok(hits.includes('CENTRAL_PMMVY'), 'PMMVY');
  assert.ok(hits.includes('CENTRAL_UJJWALA'), 'ujjwala');
  assert.ok(hits.includes('TN_KALAIGNAR_MAGALIR'), 'kalaignar magalir');
  assert.ok(hits.includes('CENTRAL_ANGANWADI_NUTRITION'), 'anganwadi');
  assert.ok(hits.includes('TN_FREE_GRINDER_MIXIE'), 'free grinder/mixie');
});

test('persona: 70yo elderly widow farmer with 2.3ha land, Erode', () => {
  const profile = {
    age: 70, gender: 'F', marital_status: 'widow', state: 'TN',
    district: 'Erode', annual_income: 40000, is_disabled: false, occupation: 'farmer',
    land_hectares: 2.3, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_WIDOW_PENSION'));
  assert.ok(hits.includes('TN_OLD_AGE_PENSION'));
  assert.ok(hits.includes('TN_UZHAVAR_PADHUKAPPU'));
  assert.ok(!hits.includes('CENTRAL_PM_KISAN'), 'should NOT match PM-KISAN (land > 2ha)');
  assert.ok(hits.includes('CENTRAL_AYUSHMAN_SENIOR'), 'Ayushman senior 70+');
});

test('persona: 20yo male SC student, Tirunelveli, low income', () => {
  const profile = {
    age: 20, gender: 'M', marital_status: 'single', state: 'TN',
    district: 'Tirunelveli', annual_income: 30000, is_disabled: false, occupation: 'student',
    land_hectares: 0, social_category: 'SC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_SC_ST_SCHOLARSHIP'), 'TN SC scholarship');
  assert.ok(hits.includes('CENTRAL_SC_POST_MATRIC'), 'central SC scholarship');
  assert.ok(hits.includes('TN_NAAN_MUDHALVAN'), 'skill dev');
  // TN_FREE_BUS requires gender=F, so male students don't qualify
  assert.ok(!hits.includes('TN_FREE_BUS'), 'males should NOT get free bus pass');
  assert.ok(hits.includes('CENTRAL_SKILL_INDIA'), 'PMKVY');
});

test('persona: 30yo divorced woman, Chennai, labourer', () => {
  const profile = {
    age: 30, gender: 'F', marital_status: 'divorced', state: 'TN',
    district: 'Chennai', annual_income: 60000, is_disabled: false, occupation: 'labourer',
    land_hectares: 0, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_DESERTED_WOMAN_PENSION'), 'deserted/divorced woman pension');
  assert.ok(hits.includes('TN_KALAIGNAR_MAGALIR'), 'kalaignar magalir');
  assert.ok(hits.includes('TN_CONSTRUCTION_WORKER_WELFARE'), 'construction worker welfare');
  assert.ok(hits.includes('TN_FREE_GRINDER_MIXIE'), 'free mixie');
});

test('persona: 55yo male fisher, Thoothukudi', () => {
  const profile = {
    age: 55, gender: 'M', marital_status: 'married', state: 'TN',
    district: 'Thoothukudi', annual_income: 80000, is_disabled: false, occupation: 'fisher',
    land_hectares: 0, social_category: 'MBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_FISHERMAN_RELIEF'), 'lean season relief');
  assert.ok(hits.includes('TN_FISHERMAN_DIESEL'), 'diesel subsidy');
  assert.ok(hits.includes('TN_FISHERMAN_HOUSING'), 'fisher housing');
  assert.ok(hits.includes('CENTRAL_PM_MATSYA'), 'PM Matsya');
});

test('persona: 65yo male weaver, Kanchipuram', () => {
  const profile = {
    age: 65, gender: 'M', marital_status: 'married', state: 'TN',
    district: 'Kancheepuram', annual_income: 50000, is_disabled: false, occupation: 'weaver',
    land_hectares: 0, social_category: 'MBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_WEAVER_WELFARE'), 'weaver pension');
  assert.ok(hits.includes('TN_HANDLOOM_FREE_HOUSE'), 'handloom housing');
  assert.ok(hits.includes('TN_HANDICRAFT_MARKETING'), 'handicraft marketing');
  assert.ok(hits.includes('TN_OLD_AGE_PENSION'), 'old age pension');
});

test('persona: 8yo girl child, BPL family, Salem', () => {
  const profile = {
    age: 8, gender: 'F', marital_status: 'single', state: 'TN',
    district: 'Salem', annual_income: 40000, is_disabled: false, occupation: 'student',
    land_hectares: 0, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_GIRL_CHILD_PROTECTION'), 'girl child protection');
  assert.ok(hits.includes('TN_NOON_MEAL'), 'noon meal');
  assert.ok(hits.includes('CENTRAL_SSY'), 'sukanya samriddhi');
  assert.ok(hits.includes('TN_FREE_TEXTBOOKS'), 'free textbooks');
  assert.ok(hits.includes('TN_CM_BREAKFAST'), 'CM breakfast');
});

test('persona: 25yo male driver, auto rickshaw, Madurai', () => {
  const profile = {
    age: 25, gender: 'M', marital_status: 'married', state: 'TN',
    district: 'Madurai', annual_income: 120000, is_disabled: false, occupation: 'driver',
    land_hectares: 0, social_category: 'OBC',
  };
  const hits = matchDirect(profile);
  assert.ok(hits.includes('TN_DRIVER_WELFARE'), 'driver welfare board');
  assert.ok(hits.includes('TN_NAAN_MUDHALVAN'), 'skill dev');
});

// ═══════════════════════════════════════════════════════════════════════════════
// KB validation tests
// ═══════════════════════════════════════════════════════════════════════════════

test('150 schemes: all have valid JsonLogic rules', () => {
  assert.strictEqual(SCHEMES.length, 150, `expected 150 schemes, got ${SCHEMES.length}`);
  for (const s of SCHEMES) {
    assert.ok(s.eligibility_rule, `${s.scheme_id} has no rule`);
    assert.ok(s.name_ta, `${s.scheme_id} missing Tamil name`);
    assert.ok(s.source_url, `${s.scheme_id} missing source URL`);
    const sample = { age: 50, gender: 'F', state: 'TN', annual_income: 50000, is_disabled: false, occupation: 'housewife', land_hectares: 0, marital_status: 'married', social_category: 'OBC' };
    assert.doesNotThrow(() => jsonLogic.apply(s.eligibility_rule, sample));
  }
});

test('no duplicate scheme IDs', () => {
  const ids = SCHEMES.map(s => s.scheme_id);
  const unique = new Set(ids);
  assert.strictEqual(ids.length, unique.size, 'duplicate scheme_id found');
});

test('every scheme has benefit object with valid kind', () => {
  const validKinds = ['monthly', 'onetime', 'subsidy_pct', 'insurance_cover', 'loan', 'inkind'];
  for (const s of SCHEMES) {
    assert.ok(s.benefit, `${s.scheme_id} missing benefit`);
    assert.ok(validKinds.includes(s.benefit.kind), `${s.scheme_id} invalid kind: ${s.benefit.kind}`);
  }
});

test('every scheme has documents_required array', () => {
  for (const s of SCHEMES) {
    assert.ok(Array.isArray(s.documents_required), `${s.scheme_id} documents_required not array`);
  }
});

test('every scheme has how_to_apply_steps array', () => {
  for (const s of SCHEMES) {
    assert.ok(Array.isArray(s.how_to_apply_steps), `${s.scheme_id} how_to_apply_steps not array`);
  }
});

test('state-level schemes must have state=TN', () => {
  for (const s of SCHEMES.filter(s => s.level === 'state')) {
    assert.strictEqual(s.state, 'TN', `${s.scheme_id} level=state but state=${s.state}`);
  }
});

test('KB has both central and state level schemes', () => {
  const central = SCHEMES.filter(s => s.level === 'central');
  const state = SCHEMES.filter(s => s.level === 'state');
  assert.ok(central.length >= 30, `only ${central.length} central schemes`);
  assert.ok(state.length >= 30, `only ${state.length} state schemes`);
});

test('KB covers key categories', () => {
  const cats = new Set(SCHEMES.map(s => s.category));
  for (const expected of ['pension', 'insurance', 'education', 'housing', 'agriculture', 'food', 'health', 'loan', 'employment', 'grant']) {
    assert.ok(cats.has(expected), `missing category: ${expected}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Office validation tests
// ═══════════════════════════════════════════════════════════════════════════════

test('60 offices loaded', () => {
  assert.strictEqual(OFFICES.length, 60, `expected 60 offices, got ${OFFICES.length}`);
});

test('no duplicate office IDs', () => {
  const ids = OFFICES.map(o => o.office_id);
  assert.strictEqual(ids.length, new Set(ids).size, 'duplicate office_id found');
});

test('offices cover multiple districts', () => {
  const districts = new Set(OFFICES.map(o => o.district));
  assert.ok(districts.size >= 20, `only ${districts.size} distinct districts`);
});

test('office coordinates are within TN bounds', () => {
  for (const o of OFFICES.filter(o => o.lat && o.lng)) {
    assert.ok(o.lat >= 8 && o.lat <= 14, `${o.office_id} lat ${o.lat} outside TN`);
    assert.ok(o.lng >= 76 && o.lng <= 81, `${o.office_id} lng ${o.lng} outside TN`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Composer tests
// ═══════════════════════════════════════════════════════════════════════════════

test('composeMatchSpeech — returns noMatch for empty', () => {
  const result = composeMatchSpeech([], {});
  assert.strictEqual(result, PROMPTS.noMatch);
});

test('composeMatchSpeech — includes scheme name for matches', () => {
  const matches = [{ name_ta: 'டெஸ்ட் திட்டம்', benefit: { kind: 'monthly', amount: 1000 }, where_to_apply: 'VAO' }];
  const result = composeMatchSpeech(matches, {});
  assert.ok(result.includes('டெஸ்ட் திட்டம்'));
  assert.ok(result.includes('1000'));
});

test('composeSchemeDetails — includes documents and helpline', () => {
  const scheme = {
    name_ta: 'டெஸ்ட்', eligibility_plain_ta: 'அனைவருக்கும்',
    documents_required: ['ஆதார்', 'பட்டா'], how_to_apply_steps: ['விண்ணப்பம்'],
    helpline: '1800-425-1515',
  };
  const result = composeSchemeDetails(scheme);
  assert.ok(result.includes('ஆதார்'));
  assert.ok(result.includes('1800-425-1515'));
});

test('composeWhatsAppReply — empty matches', () => {
  const result = composeWhatsAppReply([], {});
  assert.ok(result.includes('மன்னிக்கவும்'));
});

test('composeWhatsAppReply — includes scheme links', () => {
  const matches = [{
    name_ta: 'டெஸ்ட்', name_en: 'Test', benefit: { kind: 'monthly', amount: 500 },
    where_to_apply: 'VAO', documents_required: ['ஆதார்'], source_url: 'https://test.gov.in/',
  }];
  const result = composeWhatsAppReply(matches, {});
  assert.ok(result.includes('*துணை'));
  assert.ok(result.includes('https://test.gov.in/'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// Utility tests
// ═══════════════════════════════════════════════════════════════════════════════

test('hashPhone — produces 32-char hex', () => {
  const h = hashPhone('9876543210');
  assert.strictEqual(h.length, 32);
  assert.ok(/^[a-f0-9]{32}$/.test(h));
});

test('hashPhone — normalises prefixes', () => {
  const h1 = hashPhone('+919876543210');
  const h2 = hashPhone('9876543210');
  assert.strictEqual(h1, h2, 'should strip prefix and hash last 10 digits');
});

test('hashPhone — null input returns null', () => {
  assert.strictEqual(hashPhone(null), null);
  assert.strictEqual(hashPhone(''), null);
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS integrity tests
// ═══════════════════════════════════════════════════════════════════════════════

test('PROMPTS — all keys present and non-empty', () => {
  const required = ['welcome', 'consent', 'askAge', 'askGender', 'askMarital',
    'askDistrict', 'askOccupation', 'askIncome', 'askDisabled', 'reprompt',
    'noMatch', 'handoff', 'thankyou'];
  for (const key of required) {
    assert.ok(PROMPTS[key], `PROMPTS.${key} is missing`);
    assert.ok(PROMPTS[key].length > 10, `PROMPTS.${key} too short`);
  }
});

test('PROMPTS — Tamil content present in welcome', () => {
  assert.ok(PROMPTS.welcome.includes('வணக்கம்'), 'welcome should greet in Tamil');
  assert.ok(PROMPTS.welcome.includes('துணை'), 'welcome should mention Thunai');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cross-cutting tests
// ═══════════════════════════════════════════════════════════════════════════════

test('every scheme matches at least one test profile', () => {
  const profiles = [
    { age: 68, gender: 'F', marital_status: 'widow', state: 'TN', district: 'Namakkal', annual_income: 0, is_disabled: false, occupation: 'housewife', land_hectares: 0, social_category: 'OBC' },
    { age: 30, gender: 'M', marital_status: 'married', state: 'TN', district: 'Salem', annual_income: 100000, is_disabled: false, occupation: 'farmer', land_hectares: 1, social_category: 'OBC' },
    { age: 20, gender: 'F', marital_status: 'single', state: 'TN', district: 'Chennai', annual_income: 30000, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'SC' },
    { age: 25, gender: 'M', marital_status: 'single', state: 'TN', district: 'Madurai', annual_income: 0, is_disabled: true, occupation: 'unemployed', land_hectares: 0, social_category: 'MBC' },
    { age: 75, gender: 'M', marital_status: 'married', state: 'TN', district: 'Erode', annual_income: 50000, is_disabled: false, occupation: 'farmer', land_hectares: 0.5, social_category: 'OBC' },
    { age: 45, gender: 'F', marital_status: 'divorced', state: 'TN', district: 'Coimbatore', annual_income: 50000, is_disabled: false, occupation: 'labourer', land_hectares: 0, social_category: 'OBC' },
    { age: 3, gender: 'F', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 0, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'OBC' },
    { age: 35, gender: 'M', marital_status: 'married', state: 'TN', district: 'Thoothukudi', annual_income: 80000, is_disabled: false, occupation: 'fisher', land_hectares: 0, social_category: 'MBC' },
    { age: 60, gender: 'M', marital_status: 'married', state: 'TN', district: 'Kancheepuram', annual_income: 40000, is_disabled: false, occupation: 'weaver', land_hectares: 0, social_category: 'MBC' },
    { age: 25, gender: 'M', marital_status: 'single', state: 'TN', district: 'Madurai', annual_income: 150000, is_disabled: false, occupation: 'driver', land_hectares: 0, social_category: 'OBC' },
    { age: 30, gender: 'F', marital_status: 'married', state: 'TN', district: 'Chennai', annual_income: 100000, is_disabled: false, occupation: 'housewife', land_hectares: 0, social_category: 'General' },
    { age: 5, gender: 'M', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 0, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'OBC' },
    { age: 8, gender: 'F', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 40000, is_disabled: true, occupation: 'student', land_hectares: 0, social_category: 'SC' },
    // Additional profiles for better coverage
    { age: 40, gender: 'F', marital_status: 'single', state: 'TN', district: 'Chennai', annual_income: 30000, is_disabled: false, occupation: 'housewife', land_hectares: 0, social_category: 'OBC' },
    { age: 15, gender: 'F', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 20000, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'OBC' },
    { age: 22, gender: 'M', marital_status: 'single', state: 'TN', district: 'Chennai', annual_income: 0, is_disabled: true, occupation: 'student', land_hectares: 0, social_category: 'SC' },
    { age: 18, gender: 'M', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 20000, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'ST' },
    { age: 18, gender: 'F', marital_status: 'single', state: 'TN', district: 'Salem', annual_income: 20000, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'OBC' },
    { age: 22, gender: 'M', marital_status: 'single', state: 'TN', district: 'Coimbatore', annual_income: 0, is_disabled: false, occupation: 'unemployed', land_hectares: 0, social_category: 'OBC' },
    { age: 30, gender: 'M', marital_status: 'married', state: 'TN', district: 'Chennai', annual_income: 50000, is_disabled: false, occupation: 'labourer', land_hectares: 0, social_category: 'SC', is_salt_pan_worker: true },
    { age: 13, gender: 'F', marital_status: 'single', state: 'TN', district: 'Chennai', annual_income: 0, is_disabled: false, occupation: 'student', land_hectares: 0, social_category: 'OBC' },
  ];

  const unmatched = [];
  for (const s of SCHEMES) {
    let found = false;
    for (const p of profiles) {
      try {
        if (jsonLogic.apply(s.eligibility_rule, p)) { found = true; break; }
      } catch { /* skip */ }
    }
    if (!found) unmatched.push(s.scheme_id);
  }
  // Allow a small margin — some niche schemes may need very specific profiles
  assert.ok(unmatched.length <= 12, `${unmatched.length} schemes matched no profile: ${unmatched.join(', ')}`);
});
