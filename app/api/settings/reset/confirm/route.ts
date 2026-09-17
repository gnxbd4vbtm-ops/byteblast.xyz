import { NextResponse } from 'next/server';
import { getSettingsAdminEmail, isAuthorizedSettingsEmail, verifyPasswordResetToken, writeSettingsPasswordHash, getSettingsPasswordHash } from '@/lib/security';

export async function POST(request: Request) {
  const { token, password } = (await request.json()) as { token?: string; password?: string };

  if (!token || !password || !password.trim()) {
    return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
  }

  const email = verifyPasswordResetToken(token);
  if (!email || !isAuthorizedSettingsEmail(email)) {
    return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 401 });
  }

  if (email !== getSettingsAdminEmail()) {
    return NextResponse.json({ error: `Only ${getSettingsAdminEmail()} can use this reset flow.` }, { status: 403 });
  }

  const wrote = writeSettingsPasswordHash(password.trim());
  if (!wrote) {
    return NextResponse.json({ error: 'Unable to update the password.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
