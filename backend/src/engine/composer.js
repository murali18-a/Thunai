/**
 * Tamil response composer — short, closed-ended prompts optimised for IVR.
 * Every spoken segment aims to stay under ~20 seconds (≈ 60 Tamil syllables).
 */

export const PROMPTS = {
  welcome:
    'வணக்கம். நான் துணை. உங்கள் அரசுத் திட்டங்களைக் கண்டுபிடிக்க நான் உதவுவேன். ' +
    'தொடர 1 ஐ அழுத்தவும். தமிழில் பேசவும்.',

  consent:
    'உங்கள் தகவல்களை இந்த அழைப்பில் மட்டுமே நாங்கள் பயன்படுத்துவோம். ' +
    'தொடர 1 ஐ அழுத்தவும். இல்லை என்றால் 2 ஐ அழுத்தவும்.',

  askAge: 'உங்கள் வயதை எண்களில் சொல்லுங்கள்.',
  askGender: 'நீங்கள் ஆண் என்றால் 1 ஐ, பெண் என்றால் 2 ஐ அழுத்தவும்.',
  askMarital:
    'உங்கள் திருமண நிலை? திருமணமானவர் 1, திருமணம் ஆகாதவர் 2, ' +
    'விதவை 3, விவாகரத்து 4.',
  askDistrict: 'நீங்கள் வசிக்கும் மாவட்டத்தின் பெயரைச் சொல்லுங்கள்.',
  askOccupation:
    'உங்கள் வேலை என்ன? விவசாயி 1, கூலி 2, இல்லத்தரசி 3, ' +
    'மாணவர் 4, வேலையில்லை 5, மற்றவை 9.',
  askIncome: 'உங்கள் மாத வருமானத்தை ரூபாயில் சொல்லுங்கள். வருமானம் இல்லை என்றால் பூஜ்ஜியம் சொல்லுங்கள்.',
  askDisabled: 'நீங்கள் மாற்றுத்திறனாளியா? ஆம் என்றால் 1, இல்லை என்றால் 2.',

  reprompt: 'மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்லுங்கள்.',
  noMatch:
    'மன்னிக்கவும். தற்போது உங்களுக்குப் பொருந்தும் திட்டங்கள் ' +
    'எங்கள் தரவுத்தளத்தில் இல்லை. உங்கள் அருகிலுள்ள கிராம நிர்வாக ' +
    'அலுவலகத்தைத் தொடர்பு கொள்ளுங்கள்.',

  handoff: 'அரசு பிரதிநிதியுடன் இணைக்கிறேன். தயவுசெய்து காத்திருங்கள்.',

  thankyou:
    'துணையை அழைத்ததற்கு நன்றி. உங்களுக்கான திட்ட விவரங்கள் ' +
    'எஸ்எம்எஸ் மூலம் அனுப்பப்படும். நல்வாழ்த்துக்கள்.',
};

/**
 * Build the main match-result speech. Reads top 3 schemes with benefit + where to apply.
 */
export function composeMatchSpeech(matches, profile) {
  if (!matches || matches.length === 0) return PROMPTS.noMatch;

  const parts = [];
  parts.push(`நன்றி. உங்கள் தகவலின் படி ${matches.length} திட்டங்களுக்கு நீங்கள் தகுதி பெறுகிறீர்கள்.`);

  matches.slice(0, 3).forEach((m, i) => {
    const idx = toTamilOrdinal(i + 1);
    const benefit = describeBenefit(m.benefit);
    parts.push(
      `${idx} திட்டம்: ${m.name_ta}. ${benefit}. ` +
      `இதற்கு விண்ணப்பிக்க ${m.where_to_apply} ஐ அணுகுங்கள்.`
    );
  });

  parts.push('முதல் திட்டம் பற்றிய விரிவான தகவல்களைக் கேட்க 1 ஐ அழுத்தவும். ' +
             'இரண்டாவது திட்டம் 2. மூன்றாவது திட்டம் 3. முடிக்க 9.');

  return parts.join(' ');
}

/**
 * Compose details for a single scheme — documents, steps, helpline.
 */
export function composeSchemeDetails(scheme) {
  const parts = [];
  parts.push(`${scheme.name_ta} பற்றிய விவரங்கள்.`);
  parts.push(scheme.eligibility_plain_ta);
  if (scheme.documents_required?.length) {
    parts.push('தேவையான ஆவணங்கள்: ' + scheme.documents_required.join(', ') + '.');
  }
  if (scheme.how_to_apply_steps?.length) {
    parts.push('விண்ணப்பிக்கும் முறை: ' + scheme.how_to_apply_steps.join(' அதன் பிறகு '));
  }
  if (scheme.helpline) {
    parts.push(`உதவி எண்: ${scheme.helpline}.`);
  }
  parts.push('முந்தைய பட்டியலுக்குத் திரும்ப 0 ஐ அழுத்தவும். முடிக்க 9.');
  return parts.join(' ');
}

function describeBenefit(b) {
  if (!b) return '';
  if (b.kind === 'monthly') return `மாதம் ரூபாய் ${b.amount} பலன்`;
  if (b.kind === 'onetime') return `ஒரு முறை ரூபாய் ${b.amount} பலன்`;
  if (b.kind === 'insurance_cover') return `ரூபாய் ${b.amount} காப்பீடு`;
  if (b.kind === 'subsidy_pct') return `${b.amount} சதவீதம் மானியம்`;
  if (b.kind === 'loan') return `ரூபாய் ${b.amount} வரை கடன்`;
  if (b.kind === 'inkind') return b.description_ta || 'உதவி';
  return '';
}

function toTamilOrdinal(n) {
  const map = ['', 'முதல்', 'இரண்டாவது', 'மூன்றாவது', 'நான்காவது', 'ஐந்தாவது'];
  return map[n] || `${n}வது`;
}

/**
 * Compose WhatsApp text — longer, bulletable, with scheme links.
 */
export function composeWhatsAppReply(matches, profile) {
  if (!matches.length) {
    return '*துணை*\n\nமன்னிக்கவும் — இப்போதைய தகவலின் படி தகுதி பெறக்கூடிய திட்டங்கள் இல்லை. மேலும் தகவலுக்கு 14472 ஐ அழைக்கவும்.';
  }
  const header = `*துணை — உங்களுக்கான ${matches.length} திட்டங்கள்*\n\n`;
  const body = matches.map((m, i) => {
    const b = describeBenefit(m.benefit);
    const docs = (m.documents_required || []).slice(0, 4).join(', ');
    return `*${i + 1}. ${m.name_ta}*\n` +
           `   ${m.name_en}\n` +
           `   💰 ${b}\n` +
           `   📍 ${m.where_to_apply}\n` +
           `   📄 ஆவணங்கள்: ${docs}\n` +
           `   🔗 ${m.source_url}`;
  }).join('\n\n');
  const footer = `\n\n_உங்கள் தகவல்கள் பாதுகாப்பாக உள்ளன. மேலும் உதவிக்கு 1 என்று பதில் அனுப்பவும்._`;
  return header + body + footer;
}
