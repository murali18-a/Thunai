# BUILD_LOG.md — Thunai v2.0

**Author:** Murali A
**Started:** October 2026
**Status:** Complete

---

## What was built

### Part 1 — Scheme Knowledge Base (150 schemes)
- Expanded from 50 to **150 verified schemes** (TN state + Central)
- Categories covered: pensions, insurance, subsidies, loans, grants, education,
  housing, maternity, employment, agriculture, fisheries, handloom, SC/ST/MBC/OBC,
  minority, youth, startup, differently-abled, elderly, children
- Added **60 offices** (CSC/VAO/Taluk/BDO) across all 38 TN districts
- Created `backend/scripts/validate-kb.js` — validates fields, rules, duplicates
- Every scheme has JsonLogic `eligibility_rule`, Tamil plain-text eligibility,
  documents list, where/how to apply, helpline, and `.gov.in` source URL

### Part 2 — Backend completion
New endpoints added:
| Endpoint | Purpose |
|---|---|
| `POST /api/eligibility/explain` | Step-by-step trace of why rules match/don't |
| `POST /api/application/draft` | Pre-filled Tamil application letter |
| `POST /api/sms/send-summary` | Tamil SMS with top matches + helplines |
| `GET /api/nearest-office` | Closest VAO/CSC by Haversine distance |
| `GET /api/stats/public` | Anonymised impact counters |

Infrastructure:
- Rate limiting (`express-rate-limit`) on all webhook routes
- Twilio signature validation on IVR/WhatsApp webhooks
- Structured error responses + global error middleware
- OpenAPI 3 spec at `/api/openapi.json` + Swagger UI at `/api/docs`
- **46 tests** covering parser, composer, eligibility, KB integrity, offices, personas
- GitHub Actions CI workflow (`.github/workflows/ci.yml`)

### Part 3 — Dashboard
Pages and components:
- **Public landing page** at `/` — dial-in number, scrolling counters, "Try It" button
- **Admin dashboard** — Overview with KPIs + charts, Scheme Browser, Sessions Feed, TryIt
- **Scheme Detail** drill-down page with full eligibility, documents, office map pin
- **District Map** — Leaflet map with TN districts coloured by demand
- **Call Simulator** — turn-by-turn IVR experience in the browser
- **Application Draft** — pick scheme + profile → generate Tamil draft → print
- **Dark mode toggle** ☀️/🌙
- Responsive down to 375px

### Part 4 — Field-worker app
- Expo (React Native) app in `field-app/`
- Login (phone + OTP mock)
- New citizen form in Tamil
- Offline scheme matching (bundles KB JSON + json-logic-js)
- Scheme detail with documents checklist
- Print summary capability

### Part 9 — Deployment
- `docker-compose.yml` — backend, dashboard (nginx), mongo, ngrok (dev profile)
- `backend/Dockerfile` and `dashboard/Dockerfile`
- `render.yaml` — one-click Render deploy
- `.env.production.example` — all environment variables documented

### Part 10 — Polish
- `README.md` — badges, feature list, quickstart, deploy instructions
- `CONTRIBUTING.md` — fork-and-add guide for other states
- `SECURITY.md` — disclosure policy
- `scheme-kb/` docs explaining the schema for non-engineers
- All hackathon/team references removed — framed as personal project

---

## What was skipped and why

| Item | Reason |
|---|---|
| Part 5 (not in spec) | No Part 5 was specified |
| Part 6 — SVG/PNG deck visuals | User explicitly removed PPT/deck requirements ("remove those unrelated things like ppt") |
| Part 7 (not in spec) | No Part 7 was specified |
| Part 8 (not in spec) | No Part 8 was specified |
| react-i18next toggle | Not added as a separate library; Tamil-first content is baked into all components with English labels inline |
| KB Admin page with JsonLogic visual editor | Deferred — requires a significant third-party component (react-querybuilder or similar). Schemes can be edited directly in `schemes.json` per the `scheme-kb/README.md` guide |

---

## Architecture decisions preserved
1. **JsonLogic rules, no LLM** — every eligibility check is deterministic
2. **Tamil-first** — all prompts, scheme descriptions, and labels in Tamil
3. **Regex + word-map parser** — no LLM for slot extraction
4. **Phone hash privacy** — SHA-256 of last 10 digits, never raw numbers
5. **Mock mode** — entire system runs without Bhashini/Twilio/MongoDB
6. **In-memory fallback store** — seamless dev/demo without external services

## Test results
```
46/46 tests passing
0 failures
Duration: ~330ms
```

## File count (70 files, excluding node_modules/dist/.git)
- Backend: 14 source files, 6 script files, 1 test file, Dockerfile, openapi.json
- Dashboard: 10 source files (App + 4 components + 4 pages + main), Dockerfile, nginx.conf
- Field app: 8 source files (App + 4 screens + matcher + data + schemes)
- Docs: 3 markdown files (ARCHITECTURE, DEMO_SCRIPT, PROBLEM_STATEMENT)
- Project root: README, BUILD_LOG, CONTRIBUTING, SECURITY, LICENSE
- Deploy: deploy/README, docker-compose.yml, render.yaml, .env.production.example
- CI: .github/workflows/ci.yml
- Scheme KB guide: scheme-kb/README.md

