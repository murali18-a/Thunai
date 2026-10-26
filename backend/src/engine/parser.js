/**
 * Deterministic Tamil + Tanglish slot extractor.
 *
 * Rural users talk in Tamil, sometimes mixed with English numerals and place names.
 * We extract: age, gender, marital_status, district, occupation, annual_income,
 * is_disabled, has_land.
 *
 * No LLM — this is predictable, fast and offline-safe. Falls back to re-prompting
 * the user when a slot can't be parsed.
 */

// Tamil + English digit map
const DIGIT_MAP = {
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
  '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
};

function normalizeDigits(text) {
  return text.split('').map(ch => DIGIT_MAP[ch] || ch).join('');
}

const DISTRICTS_TN = [
  'ariyalur', 'chengalpattu', 'chennai', 'coimbatore', 'cuddalore', 'dharmapuri',
  'dindigul', 'erode', 'kallakurichi', 'kanchipuram', 'kanyakumari', 'karur',
  'krishnagiri', 'madurai', 'nagapattinam', 'namakkal', 'nilgiris', 'perambalur',
  'pudukkottai', 'ramanathapuram', 'ranipet', 'salem', 'sivaganga', 'tenkasi',
  'thanjavur', 'theni', 'thoothukudi', 'tiruchirappalli', 'tirunelveli',
  'tirupathur', 'tiruppur', 'tiruvallur', 'tiruvannamalai', 'tiruvarur', 'vellore',
  'viluppuram', 'virudhunagar', 'mayiladuthurai', 'chengalpet',
];

// Tamil → English district name hints (phonetic)
const DISTRICT_HINTS_TA = {
  'சென்னை': 'chennai', 'கோயம்புத்தூர்': 'coimbatore', 'மதுரை': 'madurai',
  'சேலம்': 'salem', 'நாமக்கல்': 'namakkal', 'தர்மபுரி': 'dharmapuri',
  'கிருஷ்ணகிரி': 'krishnagiri', 'ஈரோடு': 'erode', 'திருச்சி': 'tiruchirappalli',
  'தஞ்சாவூர்': 'thanjavur', 'திருநெல்வேலி': 'tirunelveli', 'வேலூர்': 'vellore',
  'திருப்பூர்': 'tiruppur', 'கரூர்': 'karur', 'புதுக்கோட்டை': 'pudukkottai',
};

export function parseAge(text) {
  const t = normalizeDigits(text.toLowerCase());
  const m = t.match(/\b(\d{1,3})\s*(?:வயது|years?|year|age)?\b/);
  if (m) {
    const age = parseInt(m[1], 10);
    if (age >= 1 && age <= 120) return age;
  }
  // Spelled numbers (basic)
  const words = {
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
    'seventy': 70, 'eighty': 80, 'ninety': 90,
    'முப்பது': 30, 'நாற்பது': 40, 'ஐம்பது': 50, 'அறுபது': 60,
    'எழுபது': 70, 'எண்பது': 80, 'தொண்ணூறு': 90,
  };
  for (const [w, v] of Object.entries(words)) if (t.includes(w)) return v;
  return null;
}

// NOTE: \b (ASCII word boundary) does not fire on Tamil Unicode glyphs,
// so Tamil patterns use plain `.includes()` while English patterns keep \b.
function hasAny(text, englishWords, tamilWords) {
  const t = text.toLowerCase();
  const en = new RegExp(`\\b(${englishWords.join('|')})\\b`, 'i');
  if (englishWords.length && en.test(t)) return true;
  for (const w of tamilWords) if (text.includes(w)) return true;
  return false;
}

export function parseGender(text) {
  if (hasAny(text, ['female', 'woman', 'lady', 'widow'],
             ['பெண்', 'மகள்', 'அம்மா', 'விதவை', 'மனைவி'])) return 'F';
  if (hasAny(text, ['male', 'man', 'boy'],
             ['ஆண்', 'மகன்', 'அப்பா', 'தந்தை', 'கணவன்'])) return 'M';
  return null;
}

export function parseMaritalStatus(text) {
  if (hasAny(text, ['widow', 'widower'],
             ['விதவை', 'கணவன் இல்லை', 'கணவர் இல்லை'])) return 'widow';
  if (hasAny(text, ['divorced', 'divorcee'], ['விவாகரத்து'])) return 'divorced';
  if (hasAny(text, ['married', 'husband', 'wife'],
             ['திருமணம்', 'கணவன்', 'மனைவி'])) return 'married';
  if (hasAny(text, ['single', 'unmarried'],
             ['தனி', 'திருமணம் ஆகவில்லை'])) return 'single';
  return null;
}

export function parseDistrict(text) {
  const t = text.toLowerCase();
  for (const d of DISTRICTS_TN) {
    if (t.includes(d)) return titleCase(d);
  }
  for (const [ta, en] of Object.entries(DISTRICT_HINTS_TA)) {
    if (text.includes(ta)) return titleCase(en);
  }
  return null;
}

export function parseOccupation(text) {
  if (hasAny(text, ['farmer', 'farming', 'vivasayam', 'crop', 'paddy'],
             ['விவசாயம்', 'விவசாயி', 'நெல்'])) return 'farmer';
  if (hasAny(text, ['labour', 'labourer', 'coolie'],
             ['கூலி', 'தொழிலாளி', 'வேலையாள்'])) return 'labourer';
  if (hasAny(text, ['student'], ['மாணவன்', 'மாணவி', 'படிக்கிறேன்'])) return 'student';
  if (hasAny(text, ['housewife', 'homemaker'], ['வீட்டம்மா', 'இல்லத்தரசி'])) return 'housewife';
  if (hasAny(text, ['unemployed', 'jobless'], ['வேலையில்லை', 'வேலை கிடையாது'])) return 'unemployed';
  if (hasAny(text, ['retired'], ['ஓய்வு'])) return 'retired';
  if (hasAny(text, ['driver'], ['டிரைவர்', 'ஓட்டுனர்'])) return 'driver';
  if (hasAny(text, ['weaver'], ['நெசவாளர்'])) return 'weaver';
  if (hasAny(text, ['fisher'], ['மீனவர்'])) return 'fisher';
  return null;
}

export function parseIncome(text) {
  const t = normalizeDigits(text.toLowerCase());
  // "monthly 5000", "year 60000", "5000 ரூபாய்"
  const monthly = t.match(/(?:monthly|per month|மாதம்)\s*(?:ரூபாய்\s*)?(\d+)/);
  if (monthly) return parseInt(monthly[1], 10) * 12;
  const yearly = t.match(/(?:yearly|annual|year|வருடம்|வருடாந்திர)\s*(?:ரூபாய்\s*)?(\d+)/);
  if (yearly) return parseInt(yearly[1], 10);
  const bare = t.match(/(\d{3,7})\s*(?:ரூபாய்|rupees?|rs\.?)/);
  if (bare) return parseInt(bare[1], 10) * 12; // assume monthly if unlabelled
  if (hasAny(text, ['no income', 'poor'], ['கூலி இல்லை', 'வருமானம் இல்லை', 'ஏழை'])) return 0;
  return null;
}

export function parseDisability(text) {
  // Negation first (otherwise the positive word gets picked up inside the negation phrase)
  if (hasAny(text, ['no disability', 'not disabled', 'normal'],
             ['மாற்றுத்திறனாளி இல்லை', 'சாதாரணம்', 'மாற்றுத்திறனாளி கிடையாது'])) return false;
  if (hasAny(text, ['disabled', 'disability', 'handicap'],
             ['மாற்றுத்திறனாளி', 'ஊனமுற்றவர்', 'பார்வையற்ற', 'கேளாத'])) return true;
  return null;
}

export function parseYesNo(text) {
  if (hasAny(text, ['yes', 'yeah', 'yep'],
             ['ஆம்', 'ஆமா', 'ஆமாம்', 'இருக்கு', 'உண்டு'])) return true;
  if (hasAny(text, ['no', 'nope'], ['இல்லை', 'கிடையாது', 'இல்ல'])) return false;
  return null;
}

export function parseSocialCategory(text) {
  if (hasAny(text, ['sc', 'scheduled caste'], ['ஆதி திராவிடர்', 'தாழ்த்தப்பட்ட'])) return 'SC';
  if (hasAny(text, ['st', 'scheduled tribe'], ['பழங்குடி'])) return 'ST';
  if (hasAny(text, ['mbc', 'most backward'], ['மிகவும் பிற்படுத்தப்பட்ட'])) return 'MBC';
  if (hasAny(text, ['obc', 'backward'], ['பிற்படுத்தப்பட்ட'])) return 'OBC';
  if (hasAny(text, ['general', 'gen', 'open'], ['பொது'])) return 'GEN';
  return null;
}

/**
 * Full-utterance parser — try every slot on one input. Used for the opening free-form
 * "tell me about yourself" turn where the user often says several things at once.
 */
export function parseProfile(text) {
  return {
    age: parseAge(text),
    gender: parseGender(text),
    marital_status: parseMaritalStatus(text),
    district: parseDistrict(text),
    occupation: parseOccupation(text),
    annual_income: parseIncome(text),
    is_disabled: parseDisability(text),
    social_category: parseSocialCategory(text),
    state: (/\btamil\s*nadu\b|\btn\b/i.test(text) || text.includes('தமிழ்நாடு')) ? 'TN' : null,
  };
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
