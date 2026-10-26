import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { ivrRouter } from './routes/ivr.js';
import { waRouter } from './routes/whatsapp.js';
import { apiRouter } from './routes/api.js';
import { apiLimiter, webhookLimiter, errorHandler, setupDocs } from './middleware/index.js';

async function connectDb() {
  try {
    await mongoose.connect(config.mongo.uri, { serverSelectionTimeoutMS: 2000 });
    logger.info({ uri: config.mongo.uri }, 'mongodb connected — seeding from scripts/schemes.json');
    const { Scheme, Office } = await import('./data/models.js');
    const n = await Scheme.estimatedDocumentCount();
    if (n === 0) {
      const { readFileSync } = await import('node:fs');
      const { fileURLToPath } = await import('node:url');
      const { dirname, join } = await import('node:path');
      const here = dirname(fileURLToPath(import.meta.url));
      const schemes = JSON.parse(readFileSync(join(here, '..', 'scripts', 'schemes.json'), 'utf8'));
      const offices = JSON.parse(readFileSync(join(here, '..', 'scripts', 'offices.json'), 'utf8'));
      await Scheme.insertMany(schemes);
      await Office.insertMany(offices);
      logger.info({ schemes: schemes.length, offices: offices.length }, 'seeded on first start');
    }
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, 'mongodb unavailable — running on in-memory store (demo / sandbox mode)');
    const { loadFallbackData } = await import('./data/store.js');
    loadFallbackData();
    return false;
  }
}

async function start() {
  const app = express();

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(cors({ origin: config.dashboardOrigin, credentials: true }));

  // ── Body parsers ────────────────────────────────────────────────────────────
  app.use(express.urlencoded({ extended: false })); // Twilio webhooks are form-encoded
  app.use(express.json({ limit: '2mb' }));

  // ── Rate limiters ───────────────────────────────────────────────────────────
  app.use('/api', apiLimiter);
  app.use('/ivr', webhookLimiter);
  app.use('/whatsapp', webhookLimiter);

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/ivr', ivrRouter);
  app.use('/', waRouter);
  app.use('/api', apiRouter);

  // ── OpenAPI spec + Swagger UI ───────────────────────────────────────────────
  setupDocs(app);

  // ── Root — identity ─────────────────────────────────────────────────────────
  app.get('/', (_req, res) => res.json({
    service: 'Thunai',
    version: '2.0.0',
    description: 'Tamil voice-first scheme navigator for rural TN',
    endpoints: {
      health: 'GET /api/health',
      schemes: 'GET /api/schemes',
      match: 'POST /api/match',
      eligibility_explain: 'POST /api/eligibility/explain',
      application_draft: 'POST /api/application/draft',
      sms_summary: 'POST /api/sms/send-summary',
      nearest_office: 'GET /api/nearest-office',
      public_stats: 'GET /api/stats/public',
      ivr_voice: '/ivr/voice',
      ivr_simulate: 'POST /ivr/voice/simulate',
      whatsapp_inbound: '/whatsapp/inbound',
      whatsapp_simulate: 'POST /whatsapp/simulate',
      openapi: 'GET /api/openapi.json',
      docs: 'GET /api/docs',
    },
  }));

  // ── Global error handler (MUST be last) ─────────────────────────────────────
  app.use(errorHandler);

  await connectDb();
  app.listen(config.port, () => {
    logger.info(`Thunai backend v2.0 listening on :${config.port}`);
  });
}

start().catch(err => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
