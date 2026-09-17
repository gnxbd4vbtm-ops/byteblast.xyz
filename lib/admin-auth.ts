import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "byteblast_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "development-admin-secret-change-me";

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "byteblast-admin",
  };
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignedToken(payload: Record<string, unknown>) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [payloadBase64, signature] = token.split(".");

  if (!payloadBase64 || !signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

export async function setAdminSession(username: string) {
  const cookieStore = await cookies();
  const token = createSignedToken({
    username,
    issuedAt: Date.now(),
  });

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token || !verifySessionToken(token)) {
    return false;
  }

  const [payloadBase64] = token.split(".");
  const payload = JSON.parse(decodeBase64Url(payloadBase64));

  if (typeof payload?.username !== "string") {
    return false;
  }

  const { username } = getAdminCredentials();

  if (payload.username !== username) {
    return false;
  }

  const issuedAt = Number(payload.issuedAt);
  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  return Date.now() - issuedAt < SESSION_TTL_MS;
}
