import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCredentials } from "@/lib/admin-auth";
import { getPasskeys, getPasskeyOrigin, isSameOriginRequest, setPasskeyChallenge } from "@/lib/admin-passkeys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const passkeys = getPasskeys(getAdminCredentials().username);
  if (passkeys.length === 0) {
    return NextResponse.json({ error: "No passkey is registered for this account." }, { status: 404 });
  }

  const origin = getPasskeyOrigin();
  const options = await generateAuthenticationOptions({
    rpID: new URL(origin).hostname,
    allowCredentials: passkeys.map(({ id }) => ({ id })),
    userVerification: "required",
  });

  await setPasskeyChallenge(options.challenge, null, "authenticate");
  return NextResponse.json(options);
}