import { NextResponse } from 'next/server';
import { SETTINGS_COOKIE_NAME } from '@/lib/security';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SETTINGS_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
