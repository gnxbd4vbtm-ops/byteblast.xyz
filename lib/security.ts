import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SETTINGS_COOKIE_NAME = 'byteblast_settings_session';
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

export function getSettingsAdminEmail(): string {
  return (process.env.SETTINGS_ADMIN_EMAIL ?? 'admin@byteblast.xyz').trim().toLowerCase();
}

export function isAuthorizedSettingsEmail(email: string): boolean {
  return email.trim().toLowerCase() === getSettingsAdminEmail();
}

export function getSettingsPasswordHash(): string {
  return process.env.SETTINGS_PASSWORD_HASH ?? '';
}

export function isSettingsPasswordConfigured(): boolean {
  const hash = getSettingsPasswordHash();
  return Boolean(hash) && !hash.includes('CHANGE_ME') && !hash.includes('replace-with');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64');
  const key = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64')}`;
}

export function writeSettingsPasswordHash(password: string): boolean {
  const hash = hashPassword(password);
  const envPath = path.join(process.cwd(), '.env');

  try {
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const nextLine = `SETTINGS_PASSWORD_HASH=${hash}`;
    const updated = existing.includes('SETTINGS_PASSWORD_HASH=')
      ? existing.replace(/SETTINGS_PASSWORD_HASH=.*/g, nextLine)
      : `${existing.trim() ? `${existing}\n` : ''}${nextLine}\n`;

    fs.writeFileSync(envPath, updated, 'utf8');
    process.env.SETTINGS_PASSWORD_HASH = hash;
    return true;
  } catch {
    return false;
  }
}

export function getSettingsResetSecret(): string {
  return (process.env.SETTINGS_RESET_SECRET ?? process.env.SETTINGS_SESSION_SECRET ?? '').trim();
}

export function createPasswordResetToken(email: string): string {
  const secret = getSettingsResetSecret();
  if (!secret || !email) {
    return '';
  }

  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    exp: Date.now() + RESET_TOKEN_LIFETIME_MS,
  });

  const signed = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signed}`;
}

export function verifyPasswordResetToken(token: string): string | null {
  const secret = getSettingsResetSecret();
  if (!secret || !token || token.includes('replace-with')) {
    return null;
  }

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) {
    return null;
  }

  const expected = createHmac('sha256', secret).update(Buffer.from(payloadB64, 'base64url').toString('utf8')).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    if (!payload.email || !payload.exp || typeof payload.exp !== 'number') {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

export function isSessionValidCookieValue(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return verifySessionToken(value);
}

export function verifyPassword(password: string): boolean {
  const hash = getSettingsPasswordHash();

  if (!isSettingsPasswordConfigured()) {
    return false;
  }

  const segments = hash.split('$');
  if (segments.length !== 6 || segments[0] !== 'scrypt') {
    return false;
  }

  const [, nString, rString, pString, salt, expectedEncoded] = segments;
  const N = Number(nString);
  const r = Number(rString);
  const p = Number(pString);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N <= 0 || r <= 0 || p <= 0) {
    return false;
  }

  const derived = scryptSync(password, salt, 64, { N, r, p });
  const expected = Buffer.from(expectedEncoded, 'base64');

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

export function createSessionToken(): string {
  const secret = process.env.SETTINGS_SESSION_SECRET ?? '';

  if (!secret || secret.includes('replace-with')) {
    return '';
  }

  const payload = JSON.stringify({
    id: randomBytes(18).toString('hex'),
    exp: Date.now() + SESSION_LIFETIME_MS,
  });

  const signed = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signed}`;
}

export function verifySessionToken(token: string): boolean {
  const secret = process.env.SETTINGS_SESSION_SECRET ?? '';

  if (!secret || !token || token.includes('replace-with')) {
    return false;
  }

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(Buffer.from(payloadB64, 'base64url').toString('utf8')).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== 'number') {
      return false;
    }

    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

