import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCredentials } from "@/lib/admin-auth";
import { getPasskeys, getPasskeyOrigin, isSameOriginRequest, setPasskeyChallenge } from "@/lib/admin-passkeys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const { username, password } = (await request.json()) as { username?: string; password?: string };
  const credentials = getAdminCredentials();
  const normalizedUsername = username?.trim() ?? "";

  if (normalizedUsername !== credentials.username || password !== credentials.password) {
    return NextResponse.json({ error: "Enter the correct admin username and password to register a passkey." }, { status: 401 });
  }

  const origin = getPasskeyOrigin();
  const options = await generateRegistrationOptions({
    rpName: "byteblast",
    rpID: new URL(origin).hostname,
    userName: normalizedUsername,
    userID: Buffer.from(normalizedUsername),
    userDisplayName: "byteblast admin",
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
    excludeCredentials: getPasskeys(normalizedUsername).map(({ id }) => ({ id })),
  });

  await setPasskeyChallenge(options.challenge, normalizedUsername, "register");
  return NextResponse.json(options);
}