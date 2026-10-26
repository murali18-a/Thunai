# துணை · Thunai

**Tamil voice-first scheme & entitlement navigator for rural Tamil Nadu.**


> Team Thunai · Sona College of Technology (Autonomous), Salem

---

## What is this

A rural TN citizen — a 68-year-old widow in Namakkal, say — gives a missed call
to one phone number. Within 90 seconds, in warm Tamil, over a feature-phone
IVR flow, Thunai figures out which central and TN state welfare schemes she is
legally entitled to, reads them aloud ranked by benefit value, and tells her
which documents to carry and which VAO office to walk into.

No app. No literacy. No smartphone. No English.

Also runs on WhatsApp (voice notes + text) and has an admin dashboard that
ASHA / VAO / CSC staff can use to look up matches on behalf of citizens who
walk in.

**Primary theme:** Digital Inclusion
**Secondary themes:** Governance & Civic Technology · Elderly Care
**UN SDGs:** 1 · 5 · 10 · 16

---

## Why it matters

Crores of eligible Indians never claim welfare they are legally entitled to.
Not because the schemes are unfunded — because they can't *reach* them.
`myscheme.gov.in` assumes literacy. TN e-Sevai assumes mobility. Smartphone
apps assume smartphones. Thunai assumes a feature phone and Tamil speech.

See [`docs/PROBLEM_STATEMENT.md`](docs/PROBLEM_STATEMENT.md) for the full
problem framing and beneficiary analysis.

---

## What's in this repo

```
thunai/
├── backend/           Node/Express + Twilio + Bhashini + JsonLogic rule engine
├── dashboard/         React + Recharts admin UI
├── docs/              Problem statement, deck, demo script, architecture, self-declaration
└── README.md          You are here
```

**50 schemes in the KB:** 26 TN state + 24 central, covering pensions, insurance,
subsidies, housing, maternity, education, employment, loans, and grants.
Every scheme carries its official government `source_url` and a Tamil
plain-language eligibility summary.

**Zero LLM in the decision loop.** Every match is a deterministic
[JsonLogic](https://jsonlogic.com) rule applied to a captured profile. This
is critical: welfare advice has legal weight, and a hallucinated "yes you
qualify" is a direct harm.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system diagram
and design decisions.

---

## Quick start

### Backend

```bash
cd backend
cp .env.example .env     # defaults are fine for dev; mock mode works without Twilio or Bhashini
npm install
npm test                 # 14 tests — parser + 5 personas + KB validation
npm run dev              # listens on :4000; in-memory store if Mongo is unavailable
```

Smoke-test the rule engine (no telephony needed):

```bash
# Lakshmi — 68yo widow, Namakkal
curl -s -X POST http://localhost:4000/api/match \
  -H "Content-Type: application/json" \
  -d '{"profile":{"age":68,"gender":"F","marital_status":"widow","state":"TN","district":"Namakkal","annual_income":0,"is_disabled":false,"occupation":"housewife","land_hectares":0,"social_category":"OBC"}}'
```

Simulate a full IVR call end-to-end (no phone needed):

```bash
curl -s -X POST http://localhost:4000/ivr/voice/simulate \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","steps":[
    {"digits":"1"},
    {"speech":"நான் 68 வயது"},
    {"digits":"2"}, {"digits":"3"},
    {"speech":"நாமக்கல்"},
    {"digits":"3"},
    {"speech":"வருமானம் இல்லை"},
    {"digits":"2"},
    {"digits":"1"},
    {"digits":"9"}
  ]}'
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev              # http://localhost:5173 — proxies /api → :4000
```

Open the **Try It** tab for a live persona picker that drives the rule engine
and shows the ranked schemes with Tamil names, benefit amounts, documents and
VAO addresses.

### Hooking up real telephony (optional for demo)

1. Create a Twilio trial account; buy a phone number.
2. Expose the backend with `ngrok http 4000`.
3. In the Twilio console, set the number's voice webhook to
   `https://<ngrok>.ngrok.io/ivr/voice` (POST).
4. Set the WhatsApp sandbox webhook to
   `https://<ngrok>.ngrok.io/whatsapp/inbound` (POST).
5. Fill the matching Twilio values in `.env`.
6. For Bhashini: register at `bhashini.gov.in`, get `BHASHINI_USER_ID` and
   `BHASHINI_API_KEY`, fill them in. Without them the system falls back to
   Twilio Polly voices (Hindi stand-in in dev) with mock ASR.

---

## The pitch, in one line

**No LLM in the decision loop. Every answer is traceable to a government
policy document — in Tamil, over a feature phone, in under 90 seconds.**

---

## License

MIT. Fork this. Replace the scheme KB with your state's schemes. Ship it.

---

## Credits

- **Team:** Murali A · B.Tech. IT · Sona College of Technology
- **Govt stack:** Bhashini (MeitY ULCA), Twilio India / Exotel for telephony
- **Scheme data:** myscheme.gov.in, cmsps.tn.gov.in, pmkisan.gov.in,
  tnpds.gov.in, pmjay.gov.in and the per-scheme `source_url` fields
- **Inspiration:** Every ASHA worker, VAO and Anganwadi staffer who has
  explained a form to someone who couldn't read it. Thunai is for them.
