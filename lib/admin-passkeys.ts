import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { getPasskeyChallengeSecret } from "@/lib/admin-auth";
import { getPublicOrigin } from "@/lib/request-origin";

const CHALLENGE_COOKIE = "byteblast_passkey_challenge";
const CHALLENGE_TTL_SECONDS = 5 * 60;

export type Passkey = {
  id: string;
  username: string;
  publicKey: string;
  counter: number;
};

function ensurePasskeyTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_passkeys (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_passkeys_username ON admin_passkeys(username);
  `);
  return db;
}

export function getPasskeys(username: string): Passkey[] {
  return ensurePasskeyTable()
    .prepare("SELECT id, username, public_key AS publicKey, counter FROM admin_passkeys WHERE username = ?")
    .all(username) as Passkey[];
}

export function getPasskeyById(id: string): Passkey | undefined {
  return ensurePasskeyTable()
    .prepare("SELECT id, username, public_key AS publicKey, counter FROM admin_passkeys WHERE id = ?")
    .get(id) as Passkey | undefined;
}

export function savePasskey(username: string, passkey: Omit<Passkey, "username">) {
  ensurePasskeyTable().prepare(
    "INSERT INTO admin_passkeys (id, username, public_key, counter, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(passkey.id, username, passkey.publicKey, passkey.counter, new Date().toISOString());
}

export function updatePasskeyCounter(id: string, counter: number) {
  getDb().prepare("UPDATE admin_passkeys SET counter = ? WHERE id = ?").run(counter, id);
}

function sign(payload: string) {
  return createHmac("sha256", getPasskeyChallengeSecret()).update(payload).digest("base64url");
}

export async function setPasskeyChallenge(
  challenge: string,
  username: string | null,
  purpose: "register" | "authenticate",
) {
  const payload = Buffer.from(
    JSON.stringify({ challenge, username, purpose, issuedAt: Date.now(), nonce: randomBytes(16).toString("base64url") }),
  ).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/passkey",
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

export async function consumePasskeyChallenge() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE)?.value;
  cookieStore.set(CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/passkey",
    expires: new Date(0),
  });

  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      challenge: string;
      username: string | null;
      purpose: "register" | "authenticate";
      issuedAt: number;
    };
    if (Date.now() - value.issuedAt > CHALLENGE_TTL_SECONDS * 1000) return null;
    return value;
  } catch {
    return null;
  }
}

export function getPasskeyOrigin() {
  return getPublicOrigin();
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === getPasskeyOrigin();
}