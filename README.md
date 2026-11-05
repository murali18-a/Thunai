# துணை · Thunai

**Tamil voice-first scheme & entitlement navigator for rural Tamil Nadu.**

> Built by [Murali A](https://github.com/murali18-a) · B.Tech IT · Sona College of Technology, Salem

---

## What is this

A rural TN citizen — a 68-year-old widow in Namakkal, say — gives a missed call
to one phone number. Within 90 seconds, in warm Tamil, over a feature-phone
IVR flow, Thunai figures out which central and TN state welfare schemes she is
legally entitled to, reads them aloud ranked by benefit value, and tells her
which documents to carry and which VAO office to walk into.

No app. No literacy. No smartphone. No English.

Also runs on WhatsApp (voice notes + text) and has an admin dashboard for
ASHA / VAO / CSC staff to look up matches on behalf of citizens who walk in.

**Themes:** Digital Inclusion · Governance & Civic Technology · Elderly Care  
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
│   ├── src/           Server, routes (IVR, WhatsApp, REST API), eligibility engine
│   ├── scripts/       150-scheme KB + 60 offices + validator + expander
│   └── tests/         46+ tests (parser, personas, KB validation, composer, utils)
├── dashboard/         React + Recharts + Leaflet admin UI + public landing page
├── docs/              Problem statement, architecture, demo script
├── .github/workflows/ CI pipeline (Node 18/20/22)
├── docker-compose.yml Full-stack deployment (backend + dashboard + MongoDB)
├── render.yaml        Render.com deployment blueprint
└── README.md          You are here
```

### Key numbers

| Metric | Count |
|--------|-------|
| Welfare schemes in KB | **150** (90+ TN state + 50+ central) |
| Categories covered | pension, insurance, education, housing, agriculture, maternity, employment, loans, grants, food, health, transport |
| Service offices | **60** across all 38 TN districts |
| Automated tests | **46+** passing |
| API endpoints | **13** (match, explain, draft, SMS, nearest office, stats, …) |

### Design principles

- **Zero LLM in the decision loop.** Every match is a deterministic [JsonLogic](https://jsonlogic.com) rule. Welfare advice has legal weight — a hallucinated "yes you qualify" is a direct harm.
- **Tamil-first.** All prompts are natural rural TN Tamil, not Google-Translate Tamil.
- **Privacy-first.** Phone numbers are SHA-256 hashed before storage. Consent prompt at call start.
- **Mock mode.** Works with no API keys — Bhashini and Twilio have built-in mock fallbacks.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system diagram
and design decisions.

---

## Quick start

### Backend

```bash
cd backend
cp .env.example .env     # defaults are fine for dev; mock mode works without Twilio or Bhashini
npm install
npm test                 # 46+ tests — parser, 12 personas, KB validation, composer
npm run dev              # listens on :4000; in-memory store if Mongo is unavailable
```

Smoke-test the rule engine (no telephony needed):

```bash
curl -s -X POST http://localhost:4000/api/match \
  -H "Content-Type: application/json" \
  -d '{"profile":{"age":68,"gender":"F","marital_status":"widow","state":"TN","district":"Namakkal","annual_income":0,"is_disabled":false,"occupation":"housewife","land_hectares":0,"social_category":"OBC"}}'
```

Try the eligibility explainer:

```bash
curl -s -X POST http://localhost:4000/api/eligibility/explain \
  -H "Content-Type: application/json" \
  -d '{"profile":{"age":68,"gender":"F","state":"TN"},"scheme_id":"TN_WIDOW_PENSION"}'
```

Find nearest offices:

```bash
curl -s "http://localhost:4000/api/nearest-office?lat=11.22&lng=78.17&limit=3"
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev              # http://localhost:5173 — proxies /api → :4000
```

Features:
- **Landing page** with animated counters, dial-in CTA, "How it works" section
- **Overview** dashboard with KPI cards, bar/pie charts, live session count
- **District map** (Leaflet) with demand heatmap and office markers
- **Scheme browser** with search, category/level filters, and drill-down detail page
- **Eligibility checker** per scheme with per-condition breakdown
- **Try It** tab — persona picker driving the rule engine live
- **Sessions feed** with transcript viewer
- **Dark mode** toggle

### API Documentation

Interactive Swagger UI at `http://localhost:4000/api/docs`  
Raw OpenAPI spec at `http://localhost:4000/api/openapi.json`

### Docker deployment

```bash
docker-compose up --build   # starts backend, dashboard, MongoDB
```

Or deploy to Render.com using the included `render.yaml` blueprint.

### Hooking up real telephony (optional)

1. Create a Twilio trial account; buy a phone number.
2. Expose the backend with `ngrok http 4000`.
3. Set the number's voice webhook to `https://<ngrok>.ngrok.io/ivr/voice` (POST).
4. Set the WhatsApp sandbox webhook to `https://<ngrok>.ngrok.io/whatsapp/inbound` (POST).
5. Fill Twilio values in `.env`.
6. For Bhashini: register at `bhashini.gov.in`, get credentials, fill `.env`.

---

## Core idea

**No LLM in the decision loop. Every answer is traceable to a government
policy document — in Tamil, over a feature phone, in under 90 seconds.**

---

## License

MIT. Fork this. Replace the scheme KB with your state's schemes. Ship it.

---

## Credits

- **Author:** Murali A · B.Tech IT · Sona College of Technology
- **Govt stack:** Bhashini (MeitY ULCA), Twilio India / Exotel for telephony
- **Scheme data:** myscheme.gov.in, cmsps.tn.gov.in, pmkisan.gov.in,
  tnpds.gov.in, pmjay.gov.in and the per-scheme `source_url` fields
- **Inspiration:** Every ASHA worker, VAO and Anganwadi staffer who has
  explained a form to someone who couldn't read it. Thunai is for them.
