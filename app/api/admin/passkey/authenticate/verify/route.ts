import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCredentials, setAdminSession } from "@/lib/admin-auth";
import { consumePasskeyChallenge, getPasskeyById, getPasskeyOrigin, isSameOriginRequest, updatePasskeyCounter } from "@/lib/admin-passkeys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const challenge = await consumePasskeyChallenge();
  const { response } = (await request.json()) as { response?: AuthenticationResponseJSON };

  if (!challenge || challenge.purpose !== "authenticate" || !response) {
    return NextResponse.json({ error: "Passkey sign-in expired. Try again." }, { status: 400 });
  }

  const passkey = getPasskeyById(response.id);
  if (!passkey || passkey.username !== getAdminCredentials().username) {
    return NextResponse.json({ error: "Passkey is not registered for this account." }, { status: 401 });
  }

  try {
    const origin = getPasskeyOrigin();
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: new URL(origin).hostname,
      requireUserVerification: true,
      credential: {
        id: passkey.id,
        publicKey: Buffer.from(passkey.publicKey, "base64url"),
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Passkey sign-in could not be verified." }, { status: 401 });
    }

    updatePasskeyCounter(passkey.id, verification.authenticationInfo.newCounter);
    await setAdminSession(passkey.username);
    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: "Passkey sign-in could not be verified." }, { status: 401 });
  }
}