import mongoose from 'mongoose';

/**
 * Scheme — the atomic unit of the Thunai knowledge base.
 * Each scheme carries a JsonLogic eligibility rule evaluated against a user profile.
 */
const SchemeSchema = new mongoose.Schema({
  scheme_id:          { type: String, required: true, unique: true, index: true },
  name_ta:            { type: String, required: true },
  name_en:            { type: String, required: true },
  ministry:           { type: String, required: true },
  level:              { type: String, enum: ['central', 'state'], required: true },
  state:              { type: String, default: null },               // 'TN' or null for central
  category:           { type: String, required: true },              // pension, insurance, subsidy, loan, grant, education, housing, maternity, employment
  benefit: {
    kind:             { type: String, enum: ['monthly', 'onetime', 'subsidy_pct', 'insurance_cover', 'loan', 'inkind'], required: true },
    amount:           { type: Number, default: 0 },
    unit:             { type: String, default: 'INR' },
    description_ta:   { type: String, default: '' },
    description_en:   { type: String, default: '' },
  },
  eligibility_rule:   { type: mongoose.Schema.Types.Mixed, required: true },  // JsonLogic
  eligibility_plain_ta: { type: String, required: true },
  documents_required: [{ type: String }],
  where_to_apply:     { type: String, required: true },
  how_to_apply_steps: [{ type: String }],
  helpline:           { type: String, default: '' },
  source_url:         { type: String, required: true },
  tags:               [{ type: String, index: true }],
  priority_weight:    { type: Number, default: 1 },
  last_verified_date: { type: Date, default: Date.now },
  active:             { type: Boolean, default: true },
}, { timestamps: true });

SchemeSchema.index({ 'eligibility_rule': 1 });
SchemeSchema.index({ category: 1, state: 1 });

export const Scheme = mongoose.model('Scheme', SchemeSchema);

/**
 * User — anonymized profile keyed by hashed phone.
 */
const UserSchema = new mongoose.Schema({
  phone_hash:         { type: String, required: true, unique: true, index: true },
  profile: {
    age:              { type: Number, default: null },
    gender:           { type: String, enum: ['M', 'F', 'O', null], default: null },
    marital_status:   { type: String, enum: ['single', 'married', 'widow', 'divorced', null], default: null },
    state:            { type: String, default: 'TN' },
    district:         { type: String, default: null },
    pincode:          { type: String, default: null },
    occupation:       { type: String, default: null },        // farmer, labourer, student, housewife, unemployed, retired
    annual_income:    { type: Number, default: null },
    land_hectares:    { type: Number, default: null },
    is_disabled:      { type: Boolean, default: false },
    social_category:  { type: String, enum: ['GEN', 'OBC', 'SC', 'ST', 'MBC', null], default: null },
    has_aadhaar:      { type: Boolean, default: null },
    has_ration_card:  { type: Boolean, default: null },
    has_bank_account: { type: Boolean, default: null },
  },
  consent_given:      { type: Boolean, default: false },
  language:           { type: String, default: 'ta' },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);

/**
 * Session — one call or WhatsApp conversation.
 */
const SessionSchema = new mongoose.Schema({
  session_id:         { type: String, required: true, unique: true, index: true },
  channel:            { type: String, enum: ['ivr', 'whatsapp', 'web'], required: true },
  phone_hash:         { type: String, index: true },
  district:           { type: String, default: null, index: true },
  transcript: [{
    role:             { type: String, enum: ['bot', 'user'] },
    text:             { type: String },
    text_ta:          { type: String, default: '' },
    at:               { type: Date, default: Date.now },
  }],
  profile_captured:   { type: mongoose.Schema.Types.Mixed, default: {} },
  schemes_matched:    [{ type: String }],
  outcome:            { type: String, enum: ['completed', 'dropped', 'handed_off', 'in_progress'], default: 'in_progress' },
  duration_sec:       { type: Number, default: 0 },
  started_at:         { type: Date, default: Date.now },
  ended_at:           { type: Date, default: null },
}, { timestamps: true });

SessionSchema.index({ started_at: -1 });

export const Session = mongoose.model('Session', SessionSchema);

/**
 * CSC / VAO location — nearest office for application pickup.
 */
const OfficeSchema = new mongoose.Schema({
  office_id:   { type: String, required: true, unique: true },
  type:        { type: String, enum: ['CSC', 'VAO', 'Taluk', 'BDO', 'Panchayat'], required: true },
  name:        { type: String, required: true },
  district:    { type: String, required: true, index: true },
  taluk:       { type: String, default: '' },
  pincode:     { type: String, default: '', index: true },
  address:     { type: String, default: '' },
  phone:       { type: String, default: '' },
  lat:         { type: Number, default: 0 },
  lng:         { type: Number, default: 0 },
});

export const Office = mongoose.model('Office', OfficeSchema);

/**
 * AnalyticsEvent — stream of events for the dashboard.
 */
const AnalyticsEventSchema = new mongoose.Schema({
  event_type:  { type: String, required: true, index: true },  // call_started, scheme_matched, scheme_selected, application_sent, dropped
  session_id:  { type: String, index: true },
  district:    { type: String, default: null, index: true },
  scheme_id:   { type: String, default: null, index: true },
  meta:        { type: mongoose.Schema.Types.Mixed, default: {} },
  at:          { type: Date, default: Date.now, index: true },
});

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
