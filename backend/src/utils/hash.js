import crypto from 'crypto';

// Hash a phone number for privacy — the raw number is never stored.
export function hashPhone(phone) {
  if (!phone) return null;
  const normalized = String(phone).replace(/\D/g, '').slice(-10);
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}
