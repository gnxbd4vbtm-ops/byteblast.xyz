import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCredentials } from "@/lib/admin-auth";
import { consumePasskeyChallenge, getPasskeyOrigin, isSameOriginRequest, savePasskey } from "@/lib/admin-passkeys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const challenge = await consumePasskeyChallenge();
  const { response } = (await request.json()) as { response?: RegistrationResponseJSON };
  const username = getAdminCredentials().username;

  if (!challenge || challenge.purpose !== "register" || challenge.username !== username || !response) {
    return NextResponse.json({ error: "Passkey registration expired. Try again." }, { status: 400 });
  }

  try {
    const origin = getPasskeyOrigin();
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: new URL(origin).hostname,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Passkey registration could not be verified." }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    savePasskey(username, {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
    });

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: "Passkey registration could not be verified." }, { status: 400 });
  }
}