import crypto from "node:crypto";
import {
  recordSiteEventDb,
  saveContactMessageDb,
  getRecentEventsDb,
  getRecentContactMessagesDb,
  getSiteSummaryDb,
  type SiteEvent,
  type ContactMessage,
} from "./db";

export type { SiteEvent, ContactMessage };

export function getVisitorId(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() ?? "unknown";
  const userAgent = headers.get("user-agent") ?? "unknown";
  const seed = `${ip}:${userAgent}`;

  return crypto.createHash("sha256").update(seed).digest("hex").slice(0, 24);
}

export async function recordSiteEvent(input: {
  event: SiteEvent["event"];
  path: string;
  label?: string;
  referrer?: string;
  userAgent?: string;
  visitorId?: string;
}): Promise<SiteEvent> {
  const payload: SiteEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event: input.event,
    path: input.path || "/",
    label: input.label || "site",
    referrer: input.referrer || "",
    userAgent: input.userAgent || "unknown",
    visitorId: input.visitorId || "anonymous",
  };

  recordSiteEventDb(payload);
  return payload;
}

export async function saveContactMessage(input: {
  name: string;
  email: string;
  message: string;
  subject: string;
  source: string;
}): Promise<ContactMessage> {
  const payload: ContactMessage = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    name: input.name,
    email: input.email,
    message: input.message,
    subject: input.subject,
    source: input.source,
  };

  saveContactMessageDb(payload);
  return payload;
}

export async function getRecentEvents(limit = 12): Promise<SiteEvent[]> {
  return getRecentEventsDb(limit);
}

export async function getRecentContactMessages(limit = 8): Promise<ContactMessage[]> {
  return getRecentContactMessagesDb(limit);
}

export async function getSiteSummary() {
  return getSiteSummaryDb();
}
