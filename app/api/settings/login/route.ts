import { NextResponse } from 'next/server';
import {
  SETTINGS_COOKIE_NAME,
  getSettingsAdminEmail,
  isAuthorizedSettingsEmail,
  isSettingsPasswordConfigured,
  verifyPassword,
  createSessionToken,
} from '@/lib/security';

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  const normalizedEmail = (email ?? '').trim().toLowerCase();

  if (!normalizedEmail || !password || !password.trim()) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  if (!isAuthorizedSettingsEmail(normalizedEmail)) {
    return NextResponse.json({ error: `Only ${getSettingsAdminEmail()} can access this area.` }, { status: 403 });
  }

  if (!isSettingsPasswordConfigured()) {
    return NextResponse.json({ error: 'Private settings are not configured.' }, { status: 503 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }

  const token = createSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'Secure session could not be created.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SETTINGS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60,
    expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
  });

  return response;
}
