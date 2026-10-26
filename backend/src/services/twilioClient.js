import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let client = null;
if (config.twilio.accountSid && config.twilio.accountSid.startsWith('AC') && config.twilio.authToken) {
  try {
    client = twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info('twilio client initialised');
  } catch (err) {
    logger.warn({ err: err.message }, 'twilio client init failed — WhatsApp sending will be mocked');
  }
}

export async function sendWhatsApp(toPhone, body) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  if (!client) {
    logger.warn({ to, body: body.slice(0, 80) }, '[mock] WhatsApp send');
    return { sid: 'MOCK', mocked: true };
  }
  const msg = await client.messages.create({
    from: config.twilio.whatsappFrom,
    to,
    body,
  });
  return { sid: msg.sid, mocked: false };
}

export async function sendSMS(toPhone, body) {
  if (!client) {
    logger.warn({ to: toPhone, body: body.slice(0, 80) }, '[mock] SMS send');
    return { sid: 'MOCK', mocked: true };
  }
  const msg = await client.messages.create({
    from: config.twilio.phoneNumber,
    to: toPhone,
    body,
  });
  return { sid: msg.sid, mocked: false };
}

export { client as twilioClient };
