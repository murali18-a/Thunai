# Deployment Guide

## Option 1: Local Docker (recommended for development)

### Prerequisites
- Docker + Docker Compose installed
- No other services needed — everything runs in containers

### Steps

```bash
# Clone the repo
git clone https://github.com/murali18-a/Thunai.git
cd Thunai

# Copy environment variables
cp .env.production.example .env

# Start all services
docker compose up -d

# Services:
# Backend:    http://localhost:4000
# Dashboard:  http://localhost:8080
# Swagger UI: http://localhost:4000/api/docs
# MongoDB:    localhost:27017
```

### Dev profile (with ngrok for Twilio webhooks)

```bash
docker compose --profile dev up -d
# ngrok dashboard: http://localhost:4040
# Copy the ngrok HTTPS URL to your Twilio webhook config
```

---

## Option 2: DigitalOcean Droplet

### Prerequisites
- DigitalOcean account
- $6/mo droplet (1 vCPU, 1GB RAM is sufficient)

### Steps

1. Create an Ubuntu 22.04 droplet
2. SSH in:
```bash
ssh root@<your-droplet-ip>
```

3. Install Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

4. Clone and deploy:
```bash
git clone https://github.com/murali18-a/Thunai.git
cd Thunai
cp .env.production.example .env
# Edit .env with your actual values
nano .env
docker compose up -d
```

5. Point your domain's A record to the droplet IP

---

## Option 3: MongoDB Atlas (for production database)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your server's IP (or 0.0.0.0/0 for dev)
4. Copy the connection string
5. Set in `.env`:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thunai?retryWrites=true
```

---

## Option 4: Vercel (dashboard only)

The dashboard is a static Vite build — perfect for Vercel.

1. Fork the repo on GitHub
2. Go to [vercel.com](https://vercel.com) and import the project
3. Set:
   - **Root Directory:** `dashboard`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set environment variable:
   - `VITE_API_URL` = your backend URL (e.g., `https://api.thunai.example.com`)
5. Deploy

---

## Option 5: Render (one-click deploy)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/murali18-a/Thunai)

The `render.yaml` blueprint defines:
- **Backend** web service (Node.js)
- **Dashboard** static site (Vite build)
- **MongoDB** — use MongoDB Atlas (Render doesn't host Mongo)

### Manual Render setup

1. Create a Web Service:
   - **Repo:** `https://github.com/murali18-a/Thunai`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Environment:** Set `MONGODB_URI`, `PORT=4000`

2. Create a Static Site:
   - **Root Directory:** `dashboard`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

---

## Option 6: Exotel (production telephony)

For production IVR with Indian phone numbers:

1. Sign up at [exotel.com](https://exotel.com)
2. Get a virtual DID number (~₹600/mo)
3. Configure the webhook URL:
   - **Answer URL:** `https://your-backend.com/ivr/voice`
   - **Method:** POST
4. Set in `.env`:
```
EXOTEL_SID=<your-sid>
EXOTEL_TOKEN=<your-token>
EXOTEL_DID=<your-did-number>
```

> **Note:** The current codebase uses Twilio for dev. For Exotel, you'll need to
> adapt `backend/src/services/twilioClient.js` to use Exotel's API. The IVR
> state machine and TwiML generation work identically — only the webhook
> format differs slightly.

---

## Environment Variables Reference

See `.env.production.example` for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 4000) | Backend port |
| `MONGODB_URI` | No (uses in-memory) | MongoDB connection string |
| `TWILIO_ACCOUNT_SID` | No (uses mock) | Twilio SID |
| `TWILIO_AUTH_TOKEN` | No (uses mock) | Twilio auth token |
| `TWILIO_PHONE_FROM` | No (uses mock) | Twilio sender number |
| `BHASHINI_API_KEY` | No (uses mock) | Bhashini ULCA API key |
| `DASHBOARD_ORIGIN` | No (default: *) | CORS allowed origin |
| `PUBLIC_BASE_URL` | No | Public URL for webhook callbacks |

