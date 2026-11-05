# 📞 Thunai — Real Phone Call Setup Guide

This guide will connect a **real phone number** to Thunai so anyone can dial in
and hear the Tamil IVR scheme navigator.

**Total cost:** Free (Twilio trial) or ~₹100/month (Twilio paid)
**Time needed:** ~15 minutes

---

## What you need to do (3 accounts, all free)

| Service | What it does | Sign-up link |
|---|---|---|
| **Twilio** | Gives you a phone number + handles voice calls | https://www.twilio.com/try-twilio |
| **ngrok** | Exposes your local backend to the internet | https://dashboard.ngrok.com/signup |
| **MongoDB** (already running) | Stores schemes + sessions | Already working locally |

---

## Step 1 — Create a free ngrok account (2 minutes)

1. Go to **https://dashboard.ngrok.com/signup**
2. Sign up with Google or email
3. After login, you'll see your **authtoken** on the Getting Started page
   - Or find it at: https://dashboard.ngrok.com/get-started/your-authtoken
4. Run this command in a terminal:
   ```
   ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
   ```
5. Now start the tunnel:
   ```
   ngrok http 4000
   ```
6. You'll see output like:
   ```
   Forwarding   https://a1b2-c3d4.ngrok-free.app -> http://localhost:4000
   ```
   **Copy that `https://...ngrok-free.app` URL** — you'll need it in Step 3.

---

## Step 2 — Create a free Twilio account (5 minutes)

1. Go to **https://www.twilio.com/try-twilio**
2. Sign up with email + password
3. **Verify your personal phone number** (Twilio will send an OTP)
4. When asked "What do you want to do?", pick **"Make and receive phone calls"**
5. Twilio will give you a **free trial phone number** (e.g., `+18559xxxxxx`)
6. Go to your **Twilio Console**: https://console.twilio.com
7. On the dashboard, note down:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click the eye icon to reveal)
   - **Your Twilio phone number** (the trial number assigned to you)

### ⚠️ Important: Trial account limitations
- You can only **receive calls from your verified personal number**
- Twilio plays a "trial account" message before your IVR starts
- To remove these limits: upgrade your account (~$20 minimum top-up)
- Calls cost ~$0.013/min (incoming) + $1/month for the number

---

## Step 3 — Configure Thunai (3 minutes)

### 3a. Create `backend/.env`

```bash
cd c:\Users\murul\Downloads\thunai\backend
```

Create (or edit) the file `backend/.env` with:
```env
PORT=4000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+18559xxxxxx
PUBLIC_BASE_URL=https://a1b2-c3d4.ngrok-free.app
NODE_ENV=development
```

Replace the values with your actual Twilio credentials and ngrok URL.

### 3b. Set the Twilio voice webhook

1. Go to **https://console.twilio.com/develop/phone-numbers/manage/active**
2. Click on your phone number
3. Scroll to **"Voice Configuration"**
4. Under **"A call comes in"**:
   - Select: **Webhook**
   - URL: `https://YOUR-NGROK-URL.ngrok-free.app/ivr/voice`
   - HTTP Method: **POST**
5. Click **Save configuration**

---

## Step 4 — Start Thunai and call! (2 minutes)

Open **3 terminals**:

### Terminal 1 — ngrok (keep running)
```bash
ngrok http 4000
```

### Terminal 2 — Backend
```bash
cd c:\Users\murul\Downloads\thunai\backend
node src/server.js
```
You should see:
```
Thunai backend v2.0 listening on :4000
```

### Terminal 3 — Dashboard (optional)
```bash
cd c:\Users\murul\Downloads\thunai\dashboard
npm run dev
```

### Now call!
**Pick up your phone and dial your Twilio number.**

You'll hear:
> *"வணக்கம். நான் துணை. உங்கள் அரசுத் திட்டங்களைக் கண்டுபிடிக்க நான் உதவுவேன்.
> தொடர 1 ஐ அழுத்தவும்."*

Press **1** → tell your age → press **2** for female → etc. → get your matched schemes!

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "This ngrok session is not authenticated" | Run `ngrok config add-authtoken YOUR_TOKEN` first |
| Twilio plays "trial account" message | Normal for free trial. Upgrade to remove it |
| Call goes to voicemail | Make sure ngrok + backend are both running |
| "Application error" on call | Check Terminal 2 for error logs |
| ngrok URL changed after restart | Update the webhook URL in Twilio Console |
| Can only call from one number | Trial limitation. Upgrade Twilio or verify more numbers |

---

## Architecture (what happens when you call)

```
Your Phone
    │
    ▼ (dial Twilio number)
Twilio Cloud
    │
    ▼ (POST webhook)
ngrok tunnel (https://xxx.ngrok-free.app)
    │
    ▼ (forward to localhost:4000)
Thunai Backend (/ivr/voice)
    │
    ├── Creates session
    ├── Returns TwiML <Say> (Tamil greeting) + <Gather> (wait for keypress)
    │
    ▼ (user presses 1)
Twilio POSTs to /ivr/voice/gather
    │
    ├── IVR state machine advances
    ├── Collects: age, gender, marital status, district, occupation, income
    ├── Runs JsonLogic eligibility rules against 150 schemes
    ├── Returns matched schemes as Tamil speech
    │
    ▼
User hears their eligible schemes over the phone! 🎉
```
