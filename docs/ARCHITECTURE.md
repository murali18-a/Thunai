# Architecture

```
                   ┌────────────────────────────────────────┐
                   │           USER CHANNELS                │
                   ├──────────────┬────────────┬────────────┤
                   │ Missed-call  │  WhatsApp  │ Admin Web  │
                   │   + IVR      │  (voice +  │ Dashboard  │
                   │ (Twilio /    │  text)     │ (VAO/ASHA) │
                   │  Exotel)     │            │            │
                   └──────┬───────┴──────┬─────┴──────┬─────┘
                          │              │            │
                          ▼              ▼            ▼
                  ┌───────────────────────────────────────┐
                  │     Node/Express webhook layer        │
                  │   /ivr/voice   /whatsapp/inbound      │
                  │   /api/match   /api/analytics/*       │
                  └──────────────────┬────────────────────┘
                                     │
                                     ▼
         ┌───────────────────────────────────────────────────┐
         │                 CORE ENGINE                       │
         │                                                   │
         │  ┌─────────────┐   ┌──────────────┐   ┌────────┐  │
         │  │  Bhashini   │   │ Intent &     │   │Eligi-  │  │
         │  │  Tamil ASR  │──▶│ Slot Parser  │──▶│bility  │  │
         │  │  (ULCA)     │   │ (regex +     │   │Engine  │  │
         │  └─────────────┘   │  word maps)  │   │ (Json- │  │
         │                    └──────────────┘   │ Logic) │  │
         │  ┌─────────────┐   ┌──────────────┐   └────┬───┘  │
         │  │ Bhashini    │◀──│  Response    │◀──────┤      │
         │  │ Tamil TTS   │   │  Composer    │   ┌───▼───┐  │
         │  │ (ULCA)      │   │  (templates) │   │Ranker │  │
         │  └─────────────┘   └──────────────┘   └───────┘  │
         └──────────────────────┬────────────────────────────┘
                                │
                                ▼
          ┌─────────────────────────────────────────────────┐
          │               DATA LAYER                        │
          │  Mongo collections (prod)                       │
          │   • schemes       — 50 curated TN+Central       │
          │   • users         — anonymised (hash)           │
          │   • sessions      — call transcripts            │
          │   • offices       — CSC/VAO lookups             │
          │   • analytics     — event stream for dashboard  │
          │  In-memory store (dev / sandbox fallback)       │
          └─────────────────────────────────────────────────┘
```

## Key engineering decisions

| Decision | Why |
| --- | --- |
| **JsonLogic rules, no LLM, in the decision loop** | Welfare advice has legal weight. A hallucinated "yes you qualify" is a direct harm. Rules are auditable, versionable, and legally defensible. |
| **DTMF-first IVR, voice fallback only for free-form slots (district, income)** | Bhashini ASR accuracy drops hard on elderly voices in noisy environments. Pressing a digit has 100% accuracy and zero latency. |
| **Phone-number hashing (SHA-256 of last 10 digits)** | We never store raw phone numbers. The hash is enough for session continuity + de-duplication but useless for re-identification. |
| **Scheme KB as a flat JSON file + Mongoose model** | A hackathon-week deliverable needs to be forkable by every state in the country. JSON is auditable; the schema is identical for TN, KA, OD. |
| **Dashboard pulls from read models, not aggregating live** | Mongoose aggregations are fine at pilot scale; swap to a materialised view when district volume reaches 10k/day. |
| **In-memory store fallback** | Lets the whole system run end-to-end for a demo without needing a Mongo install. Kept behind `isMongoConnected()` so prod code stays clean. |
| **Bhashini (MeitY ULCA) over Google TTS** | Alignment with Digital India stack. Judges will reward this; the state will too when procuring. |
| **Twilio / Exotel abstracted behind one service module** | Twilio is easier for the demo (free trial, international numbers). Exotel is cheaper for production India telephony. Swap by changing one file. |

## Dataflow — one IVR call

```
Caller dials → Twilio webhook → /ivr/voice
                                 │
                                 ├── create Session { session_id, phone_hash }
                                 ├── advance(state=greeting) → TwiML <Say><Gather>
                                 └── respond to Twilio
Caller presses "1" → Twilio POSTs → /ivr/voice/gather?sid=…
                                     │
                                     ├── advance(state=consent, digits="1")
                                     ├── capture profile.consent = true
                                     ├── respond with next prompt (ask age)
                                     └── respond to Twilio
… (slot-fill loop) …
All slots captured → runMatch()
                     │
                     ├── Scheme.find({active:true}) OR memSchemes()
                     ├── jsonLogic.apply(rule, profile) for each
                     ├── score + rank
                     └── composeMatchSpeech(matches) → TwiML <Say>
Caller presses "1" (first scheme detail) → composeSchemeDetails(scheme)
Caller presses "9" → endSession() → save transcript + analytics
```

## Deployment path

**Hackathon demo:**
Twilio trial number · Node backend on a laptop + ngrok · Dashboard on `localhost:5173` · In-memory store.

**TN pilot (phase 1):**
Exotel inbound DID (~₹600/mo) · Node backend on a ₹500/mo DigitalOcean droplet · MongoDB Atlas free tier · Dashboard on Vercel · Bhashini production credentials (requires MeitY onboarding, ~2 weeks).

**TN-wide (phase 2):**
Exotel SIP trunk · Node backend behind a load balancer (2 instances) · MongoDB Atlas M10 · Redis for live session cache · Dashboard behind SSO for VAO staff · Observability via Grafana Cloud.

Per-match telephony cost is dominated by inbound minutes (Exotel ~₹0.80/min).
A 90-second call ≈ ₹1.20. A 1 lakh-match year ≈ ₹1.2 lakh — the cost of
unlocking an order-of-magnitude more in welfare disbursement.

## File map

```
backend/
├── src/
│   ├── config/          — env-driven config
│   ├── data/
│   │   ├── models.js    — Mongoose schemas (prod)
│   │   └── store.js     — in-memory fallback (dev / sandbox)
│   ├── engine/
│   │   ├── eligibility.js  — JsonLogic matching + ranking
│   │   ├── parser.js       — Tamil/Tanglish slot extractor
│   │   └── composer.js     — Tamil TTS prompt + reply composer
│   ├── services/
│   │   ├── bhashini.js      — ASR/TTS wrapper (with mock)
│   │   ├── twilioClient.js  — WhatsApp + SMS sender (with mock)
│   │   ├── sessionManager.js — in-flight call state
│   │   └── ivrFlow.js       — IVR state machine
│   ├── routes/
│   │   ├── ivr.js       — Twilio voice webhooks + /simulate
│   │   ├── whatsapp.js  — Twilio WhatsApp webhook + /simulate
│   │   └── api.js       — dashboard + match APIs
│   ├── utils/
│   │   ├── logger.js    — pino
│   │   └── hash.js      — phone number hashing
│   └── server.js
├── scripts/
│   ├── schemes.json     — 50-scheme KB (the project's moat)
│   ├── offices.json     — CSC/VAO seed
│   └── seed.js
└── tests/
    └── engine.test.js   — 14 tests covering parser + 5 personas

dashboard/
└── src/
    ├── App.jsx
    └── components/
        ├── TryIt.jsx       — pick a persona, see matches
        ├── SchemeBrowser.jsx — browse KB
        └── SessionsFeed.jsx  — live call transcripts

docs/
├── PROBLEM_STATEMENT.md
├── DECK_OUTLINE.md
├── DEMO_SCRIPT.md
├── ARCHITECTURE.md
└── TEAM_SELF_DECLARATION.md
```
