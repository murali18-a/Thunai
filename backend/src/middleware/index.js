import rateLimit from 'express-rate-limit';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Rate limiters for different endpoint groups.
 */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded', retry_after_sec: 60 },
});

export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded' },
});

/**
 * Global error handler — MUST be registered after all routes.
 * Express identifies error handlers by their 4-arg signature.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error';
  if (status >= 500) {
    logger.error({ err, url: req.originalUrl, method: req.method }, 'unhandled error');
  }
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Twilio webhook signature validation.
 * Skipped in dev/test or when TWILIO_AUTH_TOKEN is absent (mock mode).
 */
export function twilioSignatureCheck(req, res, next) {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') return next();
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return next();
  try {
    // Use the twilio validateRequest from the already-imported twilio module
    const twilio = await import('twilio');
    const url = `${process.env.PUBLIC_BASE_URL || ''}${req.originalUrl}`;
    const sig = req.headers['x-twilio-signature'] || '';
    const valid = twilio.validateRequest(token, sig, url, req.body || {});
    if (!valid) return res.status(403).json({ error: 'invalid_twilio_signature' });
    next();
  } catch {
    next(); // If twilio not available, allow through
  }
}

/**
 * Serve OpenAPI 3.0 spec + Swagger UI.
 */
export function setupDocs(app) {
  try {
    const specPath = join(__dirname, '..', '..', 'openapi.json');
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));
    app.get('/api/openapi.json', (_req, res) => res.json(spec));

    import('swagger-ui-express').then(swaggerUi => {
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Thunai API Docs',
      }));
    }).catch(() => {
      app.get('/api/docs', (_req, res) => res.json({
        message: 'Install swagger-ui-express for interactive docs',
        spec: '/api/openapi.json',
      }));
    });
  } catch {
    // openapi.json not yet present — skip
  }
}
