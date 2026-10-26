# Thunai — 7-Slide Pitch Deck Outline

**Audience:** State-level HSC jury → IIT Bombay national screen → VBYLD 2027 showcase
**Rule:** every slide earns its place by changing a jury member's mind.

---

## Slide 1 — The hook

**Visual:** Portrait photo (stock) of a rural TN elderly woman at her doorstep.
**Headline:** "Lakshmi, 68, Namakkal."
**Sub-headline:** "She was legally entitled to ₹2,300 every month for the last 11 years. She never claimed one rupee of it."
**Footer tag:** Thunai · Tamil voice-first scheme navigator

**Speaker note (30s):** We spent a year talking to rural TN welfare workers.
The pattern is the same everywhere: the schemes exist, the money is budgeted,
the gap is the last-mile delivery of *knowing* and *reaching*.

---

## Slide 2 — Why the gap persists

**Visual:** 4-quadrant diagram.
- Top-left: "Information — doesn't know scheme exists"
- Top-right: "Literacy — can't read a form"
- Bottom-left: "Device — no smartphone"
- Bottom-right: "Mobility — can't travel to ask"
**Caption:** 40–60% of rural TN eligible beneficiaries fail *at least two* of these barriers simultaneously.
**Below:** Existing solutions (myscheme.gov.in, apps, chatbots) require literacy, smartphones, and English — the exact things these users don't have.

**Speaker note (30s):** This isn't a funding problem or a scheme-design problem.
It's a delivery-channel problem. And it needs a delivery channel that works
for feature-phones, in Tamil, by voice.

---

## Slide 3 — Thunai in 20 seconds

**Visual:** A split screen —
- Left: A feature phone showing an incoming call with "துணை" caller-ID.
- Right: A WhatsApp bubble in Tamil with a scheme list.
**Headline:** "One phone number. 50 schemes. 10 seconds to a match."

**Three bullets:**
- 📞 Missed-call → warm Tamil callback → 90-second IVR → ranked schemes read aloud
- 💬 WhatsApp bot with Tamil voice-note support
- 🖥 Admin dashboard — VAO/ASHA can dial on behalf of walk-in citizens

**Speaker note (30s):** The missed-call model is critical. Even the poorest
feature-phone user can give a missed call for free. We call them back on
our dime.

---

## Slide 4 — Live demo screenshots + architecture

**Visual:** Four phone screens stitched horizontally — welcome, slot-fill,
match result, scheme detail. Underneath, a thin architecture bar:
`Phone → Twilio/Exotel → Bhashini ASR → Rule Engine → Bhashini TTS → Phone`

**Caption:** "Rules-based matching — zero LLM hallucination. Every answer is
traceable to the government's own policy document."

**Speaker note (45s):** The design decision we're proudest of: no LLM in the
decision loop. Welfare advice has legal weight. A hallucinated 'yes you
qualify' is a direct harm. Our matching engine is 100% auditable JsonLogic
rules — the kind the state can sign off on.

---

## Slide 5 — Tech & why it scales

**Three columns:**
- **Govt-stack first.** Bhashini for Tamil ASR/TTS (MeitY's own language stack). Shows alignment with Digital India, not vendor lock-in.
- **KB as reusable asset.** 50 schemes today, 500 in 6 months. Our scheme schema is state-agnostic — Odisha, Bihar, UP can plug in their own KB on day one.
- **Zero-install distribution.** No app in Play Store. The user calls. The ASHA calls on their behalf. The state's existing extension network *is* the distribution channel.

**Metric row:** 50 schemes · 32 TN districts recognised · ~90s target call length · < ₹2 per completed match (telephony cost)

**Speaker note (30s):** We built this to be cloneable. If TN Rural Dev adopts
Thunai, Karnataka Rural Dev can replicate it in a month. That's the hack —
we're not building a product, we're building a template.

---

## Slide 6 — Impact pathway

**Visual:** 3-stage timeline.
- **0-3 mo (Pilot):** 3 TN districts (Dharmapuri, Namakkal, Perambalur), 5,000 matches, deployed via Sona College NSS/NCC.
- **3-9 mo (TN rollout):** 1 lakh matches, dashboard access handed to TN Rural Dev + TN Social Welfare.
- **9-18 mo (Multi-state):** KA, KL, AP, TG. Crowd-sourced KB via MY Bharat volunteers.

**North-star metric:** Rupees of entitlement unlocked. Target year-1: **₹10 crore of welfare that would otherwise never have been claimed.**

**Speaker note (30s):** We can measure success. A successful match is a scheme
suggestion that becomes an application that becomes a disbursement. Every
step is instrumented in the dashboard.

---

## Slide 7 — Team + ask

**Team row:** Three photos + roles.
- **Murali A** — Team Lead · Full-stack · Rule engine
- **[Teammate 2]** — Scheme KB curation · Admin dashboard
- **[Teammate 3]** — WhatsApp bot · Tamil content review

**Institution:** Sona College of Technology (Autonomous), Salem · B.E. Information Technology · Anna University

**Live demo offer:** "Dial this number right now and try it in Tamil → [phone number]"
**Code:** `github.com/<org>/thunai`

**The ask:** 15 minutes with TN Rural Development, access to the Makkalai Thedi Maruthuvam field roster, and a 1,000-household pilot in Namakkal district.

**Speaker note (30s):** We're not asking for prize money. We're asking for a
pilot slot. If this works for 1,000 households in Namakkal, we have a
template the state can own.

---

## Delivery notes

- **Total pitch time:** 4-5 minutes of speaking + 1-2 minutes of live demo
- **Who presents what:** Team Lead opens (slides 1-3), tech member handles slide 4-5, third member handles slides 6-7
- **The one thing to rehearse to perfection:** the live phone call on slide 4. If the demo fails, you lose the room. Record a video backup and have it queued on a second laptop.
- **The one line to memorise:** "No LLM in the decision loop. Every answer is traceable to a government policy document."
