# Problem Statement — Thunai

**Themes:** Digital Inclusion · Governance & Civic Technology · Elderly Care
**UN SDG alignment:** 1 (No Poverty) · 5 (Gender Equality) · 10 (Reduced Inequalities) · 16 (Peace, Justice & Strong Institutions)
**Author:** Murali A · Sona College of Technology, Salem, Tamil Nadu

---

## The problem

Crores of Indian citizens are *legally entitled* to welfare schemes they never claim.
The Comptroller & Auditor General, NITI Aayog, and successive socio-economic surveys
have shown that eligible beneficiaries routinely miss schemes worth lakhs of rupees
over a lifetime — not because the schemes are unfunded, but because the citizens
cannot *reach* them.

In rural Tamil Nadu, this exclusion is structural:

- **Information asymmetry.** A 68-year-old widow in a village in Namakkal has no
  practical way to learn that the Dr. Muthulakshmi Reddy Memorial Scheme exists,
  that she is eligible for CM Comprehensive Health Insurance, or that she can
  stack the TN Destitute Widow Pension on top of the Indira Gandhi National
  Widow Pension and the Old Age Pension for a combined ₹2,300+ per month.
- **Literacy barrier.** myscheme.gov.in and TN e-Sevai portals assume reading
  ability. Rural literacy drops sharply above age 60, especially for women.
- **Device barrier.** ~40% of rural TN households do not have a smartphone in
  the hands of the person who needs the scheme. Shared family phones often
  belong to a working-age child in Chennai or the Gulf.
- **Mobility barrier.** The nearest Common Service Centre or Village
  Administrative Officer may be 5–15 km away. Walking that distance only to
  *ask* "do I qualify?" costs a day's wages.
- **Opacity barrier.** Even when a citizen hears a scheme's name, they rarely
  know which documents to carry, which office is the right one, or what the
  application looks like once they get there.

The result is a vicious cycle: the people who most need the welfare state are the
ones least able to reach it.

## Target beneficiary

- **Primary:** Rural TN residents without smartphones or print literacy —
  widows, elderly, marginal farmers (<2 ha), labourers, PwDs, SC/ST households,
  single-women-headed households.
- **High-priority districts (initial pilot):** Dharmapuri, Krishnagiri,
  Perambalur, Ariyalur, Thiruvarur, Nagapattinam, Ramanathapuram — chosen for
  high elderly dependency ratios and documented welfare under-claim rates.
- **Secondary (phase 2):** Urban informal-sector workers; low-literacy adults
  in Tier-3 towns; migrant workers whose entitlements span state and central
  schemes.
- **Multiplier channel:** The 37,000+ Anganwadi workers, ASHAs, VAOs and
  Makkalai Thedi Maruthuvam field staff who can dial Thunai *on behalf* of a
  citizen who walks into a camp or sub-centre.

## Current gaps

| Existing option                     | What it does                       | What it misses                                             |
| ----------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `myscheme.gov.in`                   | Central scheme discovery           | English-first, web-only, requires reading & typing         |
| TN e-Sevai                          | Scheme application                 | In-person, requires knowing the scheme name in advance     |
| Random "scheme chatbots"            | Conversational search              | LLM hallucinations in a legal welfare context are harmful  |
| Field VAO / ASHA announcements      | Trusted channel                    | Low throughput, no personalised matching                   |
| Smartphone apps                     | Scheme listings                    | Fail the exact users most in need (no smartphone, no literacy) |

**No existing tool combines:** Tamil voice, phone-call (not smartphone) delivery,
personalised deterministic matching, and a replicable KB that can scale across
Indian states.

## Our solution — Thunai

A single phone number. A rural user gives a missed call. The system calls back
in warm Tamil, asks a handful of closed-ended questions over a DTMF + voice
IVR flow, matches the captured profile against a curated knowledge base of
50 central + Tamil Nadu welfare schemes using an **auditable rule engine**
(JsonLogic — not an LLM), and reads back the top matches with benefit
amounts, documents needed, nearest VAO / CSC, and the official helpline.

Three channels, one brain:
1. **Missed-call → IVR callback.** Works on any phone, even ₹800 feature phones.
2. **WhatsApp bot with voice-note support.** Reaches the ~60% of rural users
   with smartphones; forwarded summaries let urban family members act on
   behalf of the entitled person.
3. **Admin dashboard.** Lets VAOs, ASHAs, and CSC operators look up matches
   on behalf of citizens who walk in — turns Thunai into a force multiplier
   for the state's own extension network.

## Why this works

- **Zero hallucination.** Every match is a deterministic JsonLogic rule applied
  to a captured profile. Every scheme card carries its official government
  source URL and `last_verified_date`. This is legally defensible — critical
  when the "advice" is "yes you qualify for ₹1,000/month."
- **Reaches the actually-excluded.** Voice + phone-call + Tamil is the only
  channel that reaches the specific users welfare schemes already fail.
- **Replicable asset.** Our scheme KB uses a schema that generalises to every
  state. TN is phase 1; the same engine, with a different KB, works for Odisha
  or Bihar on day one.
- **ASHA/VAO distribution path.** No app downloads required — the state's own
  extension workers become the distribution channel.
- **Privacy by design.** Phone numbers hashed (SHA-256, last 10 digits); no
  voice stored beyond session; consent prompt in Tamil at call start.

## Measurable impact pathway

- **Phase 1 (0–3 months, pilot):** 3 districts (Dharmapuri, Namakkal, Perambalur),
  partnered with Sona College's NSS/NCC units for VAO deployment. Target: 5,000
  successful matches, measured as applications submitted at CSC/VAO.
- **Phase 2 (3–9 months):** TN-wide rollout, Tamil news channel awareness,
  dashboard access to TN Rural Development Dept. Target: 1 lakh successful
  matches.
- **Phase 3 (9–18 months):** Replication to Karnataka, Kerala, Andhra Pradesh,
  Telangana (Dravidian-language core); scheme KB crowdsourced via college
  youth volunteer networks under the MY Bharat platform.

**North-star metric:** *Rupees of entitlement unlocked for people who would
otherwise never have claimed them.*

## Alignment with "Think Global, Hack Local"

- **Global:** The problem of welfare under-utilisation is universal. The World
  Bank estimates 2+ billion people worldwide miss social-protection
  entitlements. The voice-first, deterministic-matching, phone-channel pattern
  works in any multilingual low-literacy context.
- **Local:** The initial KB is built around Tamil Nadu's specific scheme
  landscape, with local district recognition, Tamil voice prompts calibrated
  for elderly rural users, and an architecture that plugs into TN's existing
  CSC/VAO/ASHA networks.
