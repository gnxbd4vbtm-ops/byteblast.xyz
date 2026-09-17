import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSettingsAdminEmail, isAuthorizedSettingsEmail, getSettingsResetSecret, createPasswordResetToken } from '@/lib/security';

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const normalizedEmail = (email ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  if (!isAuthorizedSettingsEmail(normalizedEmail)) {
    return NextResponse.json({ error: `Only ${getSettingsAdminEmail()} can request a reset.` }, { status: 403 });
  }

  const resetSecret = getSettingsResetSecret();
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? '465');
  const user = process.env.SMTP_USER ?? 'noreply@byteblast.xyz';
  const pass = process.env.SMTP_PASS ?? '';

  if (!host || !user || !pass || !resetSecret) {
    return NextResponse.json({ error: 'Reset email is not configured.' }, { status: 503 });
  }

  const token = createPasswordResetToken(normalizedEmail);
  if (!token) {
    return NextResponse.json({ error: 'Reset token could not be created.' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://byteblast.xyz'}/settings?reset=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@byteblast.xyz',
    to: normalizedEmail,
    subject: 'Reset your ByteBlast settings password',
    text: `Use this link to reset your settings password: ${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: `<p>Use this link to reset your settings password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
  });

  return NextResponse.json({ ok: true });
}
