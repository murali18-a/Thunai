# Contributing to Thunai

நன்றி! Thanks for your interest in contributing to Thunai.

Maintained by [Murali A](https://github.com/murali18-a).

## Quick Start

```bash
git clone https://github.com/murali18-a/Thunai.git
cd Thunai
npm install            # workspace install
cd backend && npm test # run 46+ tests
cd ../dashboard && npm run dev # start dashboard
```

## Architecture Rules

1. **No LLM in the decision loop.** All eligibility matching uses deterministic JsonLogic rules. This is a deliberate design decision — welfare advice must be auditable and legally defensible.

2. **Tamil-first.** All user-facing text should be natural rural TN Tamil, not Google-Translate Tamil. If you're not confident in Tamil, flag it for review.

3. **Privacy-first.** Phone numbers are hashed with SHA-256 before storage. Never store raw PII.

4. **Mock mode.** All external services (Bhashini, Twilio) have mock fallbacks. The app must work with no API keys.

## Adding Schemes

1. Add your scheme to `backend/scripts/schemes-additional.json`
2. Every scheme must have:
   - A valid JsonLogic `eligibility_rule`
   - A `.gov.in` or `.nic.in` `source_url`
   - Tamil name (`name_ta`) and eligibility text (`eligibility_plain_ta`)
3. Run `node scripts/expand-kb.js` then `node scripts/validate-kb.js`
4. Add a test persona in `tests/engine.test.js` that exercises your scheme

## Code Style

- ESM (`import`/`export`), no CommonJS
- Node.js built-in test runner (no Jest/Mocha)
- Pino for logging
- Never fake tests — if a test fails, fix the code, not the assertion

## Pull Request Checklist

- [ ] `node --test tests/engine.test.js` passes (46+ tests)
- [ ] `node scripts/validate-kb.js` shows 0 errors
- [ ] New schemes have real `.gov.in` source URLs
- [ ] Tamil copy reviewed by a Tamil speaker
- [ ] No raw phone numbers in logs or responses
