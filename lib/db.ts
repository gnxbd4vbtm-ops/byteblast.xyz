import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "byteblast.db");
const EVENTS_JSONL = path.join(DATA_DIR, "site-events.jsonl");
const CONTACT_JSONL = path.join(DATA_DIR, "contact-messages.jsonl");

export type SiteEvent = {
  id: string;
  timestamp: string;
  event: "view" | "click";
  path: string;
  label: string;
  referrer: string;
  userAgent: string;
  visitorId: string;
};

export type ContactMessage = {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  message: string;
  subject: string;
  source: string;
};

export type SiteStatus = {
  id: string;
  state: "operational" | "degraded" | "maintenance" | "outage";
  headline: string;
  message: string;
  updatedAt: string;
};

export type SiteContent = {
  hero_headline: string;
  hero_description: string;
  current_focus: string;
  availability: string;
  status_notes: string;
};

export type SystemProbe = {
  id: string;
  timestamp: string;
  probeType: string;
  statusCode: number;
  latencyMs: number;
  errorCode: string | null;
  message: string | null;
  metadata?: string | null;
};

const DEFAULT_CONTENT: SiteContent = {
  hero_headline: "Building systems that feel clean, fast, and dependable.",
  hero_description:
    "I design and ship software that connects product thinking with real infrastructure discipline — from polished frontends to secure, self-hosted operations.",
  current_focus: "Secure product delivery + operational transparency.",
  availability: "Open for select engagements",
  status_notes:
    "byteblast.xyz is hosted on a hardened self-hosted Linux node behind Cloudflare Tunnel. Direct health checks measure latency and uptime locally.",
};

const globalForDb = globalThis as unknown as { __byteblastDb?: DatabaseSync };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__byteblastDb) {
    ensureDataDir();
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA foreign_keys = ON;");

    initSchema(db);
    migrateJsonlData(db);

    globalForDb.__byteblastDb = db;
  }
  return globalForDb.__byteblastDb;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      event TEXT NOT NULL,
      path TEXT NOT NULL,
      label TEXT NOT NULL,
      referrer TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      visitor_id TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_site_events_timestamp ON site_events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_site_events_visitor ON site_events(visitor_id);

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_contact_timestamp ON contact_messages(timestamp DESC);

    CREATE TABLE IF NOT EXISTS site_status (
      id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      headline TEXT NOT NULL,
      message TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_probes (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      probe_type TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      latency_ms REAL NOT NULL,
      error_code TEXT,
      message TEXT,
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_probes_timestamp ON system_probes(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_probes_error ON system_probes(error_code);
  `);

  // Initialize site_status default if not set
  const currentStatus = db
    .prepare("SELECT id FROM site_status WHERE id = ?")
    .get("site");

  if (!currentStatus) {
    db.prepare(
      "INSERT INTO site_status (id, state, headline, message, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).run(
      "site",
      "operational",
      "Site is fully operational",
      "The public website and all associated services are serving traffic normally.",
      new Date().toISOString()
    );
  }

  // Initialize site_content defaults if not set
  const insertContent = db.prepare(
    "INSERT OR IGNORE INTO site_content (key, value, updated_at) VALUES (?, ?, ?)"
  );
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
    insertContent.run(key, value, now);
  }
}

function migrateJsonlData(db: DatabaseSync) {
  // Migrate site events
  try {
    const eventCountRow = db
      .prepare("SELECT COUNT(*) as count FROM site_events")
      .get() as { count: number | bigint };
    const count = Number(eventCountRow?.count ?? 0);

    if (count === 0 && fs.existsSync(EVENTS_JSONL)) {
      const raw = fs.readFileSync(EVENTS_JSONL, "utf8");
      const lines = raw.split("\n").filter(Boolean);
      const insert = db.prepare(`
        INSERT OR IGNORE INTO site_events 
        (id, timestamp, event, path, label, referrer, user_agent, visitor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item?.id && item?.timestamp) {
            insert.run(
              String(item.id),
              String(item.timestamp),
              String(item.event || "view"),
              String(item.path || "/"),
              String(item.label || "site"),
              String(item.referrer || ""),
              String(item.userAgent || "unknown"),
              String(item.visitorId || "anonymous")
            );
          }
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch (err) {
    console.error("Error migrating site-events.jsonl:", err);
  }

  // Migrate contact messages
  try {
    const contactCountRow = db
      .prepare("SELECT COUNT(*) as count FROM contact_messages")
      .get() as { count: number | bigint };
    const count = Number(contactCountRow?.count ?? 0);

    if (count === 0 && fs.existsSync(CONTACT_JSONL)) {
      const raw = fs.readFileSync(CONTACT_JSONL, "utf8");
      const lines = raw.split("\n").filter(Boolean);
      const insert = db.prepare(`
        INSERT OR IGNORE INTO contact_messages
        (id, timestamp, name, email, subject, message, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item?.id && item?.email) {
            insert.run(
              String(item.id),
              String(item.timestamp || new Date().toISOString()),
              String(item.name || "Unknown"),
              String(item.email || ""),
              String(item.subject || "No subject"),
              String(item.message || ""),
              String(item.source || "contact-page")
            );
          }
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch (err) {
    console.error("Error migrating contact-messages.jsonl:", err);
  }
}

// ---------------- Site Status API ----------------

export function getSiteStatus(): SiteStatus {
  const db = getDb();
  const row = db
    .prepare("SELECT id, state, headline, message, updated_at as updatedAt FROM site_status WHERE id = ?")
    .get("site") as SiteStatus | undefined;

  if (row) {
    return row;
  }

  return {
    id: "site",
    state: "operational",
    headline: "Site is fully operational",
    message: "The public website and all associated services are serving traffic normally.",
    updatedAt: new Date().toISOString(),
  };
}

export function updateSiteStatus(input: {
  state: "operational" | "degraded" | "maintenance" | "outage";
  headline: string;
  message: string;
}): SiteStatus {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO site_status (id, state, headline, message, updated_at)
    VALUES ('site', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      state = excluded.state,
      headline = excluded.headline,
      message = excluded.message,
      updated_at = excluded.updated_at
  `).run(input.state, input.headline.trim(), input.message.trim(), now);

  logSystemProbe({
    probeType: "status_update",
    statusCode: 200,
    latencyMs: 0,
    errorCode: null,
    message: `Site status changed to ${input.state}: ${input.headline.trim()}`,
  });

  return getSiteStatus();
}

// ---------------- Site Content API ----------------

export function getSiteContent(): SiteContent {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_content").all() as Array<{
    key: string;
    value: string;
  }>;

  const content: Record<string, string> = { ...DEFAULT_CONTENT };
  for (const row of rows) {
    content[row.key] = row.value;
  }

  return content as unknown as SiteContent;
}

export function updateSiteContent(updates: Partial<SiteContent>): SiteContent {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO site_content (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === "string") {
      stmt.run(key, value.trim(), now);
    }
  }

  return getSiteContent();
}

// ---------------- Event & Contact Message Tracking ----------------

export function recordSiteEventDb(event: SiteEvent): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO site_events (id, timestamp, event, path, label, referrer, user_agent, visitor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.timestamp,
    event.event,
    event.path,
    event.label,
    event.referrer,
    event.userAgent,
    event.visitorId
  );
}

export function saveContactMessageDb(message: ContactMessage): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO contact_messages (id, timestamp, name, email, subject, message, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    message.id,
    message.timestamp,
    message.name,
    message.email,
    message.subject,
    message.message,
    message.source
  );
}

export function getRecentEventsDb(limit = 12): SiteEvent[] {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, timestamp, event, path, label, referrer, user_agent as userAgent, visitor_id as visitorId
      FROM site_events
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    .all(limit) as SiteEvent[];

  return rows;
}

export function getRecentContactMessagesDb(limit = 8): ContactMessage[] {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, timestamp, name, email, subject, message, source
      FROM contact_messages
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    .all(limit) as ContactMessage[];

  return rows;
}

export function getContactMessageDb(id: string): ContactMessage | undefined {
  const db = getDb();
  return db
    .prepare(`
      SELECT id, timestamp, name, email, subject, message, source
      FROM contact_messages
      WHERE id = ?
    `)
    .get(id) as ContactMessage | undefined;
}

export function getSiteSummaryDb() {
  const db = getDb();

  const totalEventsRow = db
    .prepare("SELECT COUNT(*) as count FROM site_events")
    .get() as { count: number | bigint };
  const trafficEvents = Number(totalEventsRow?.count ?? 0);

  const visitorsRow = db
    .prepare("SELECT COUNT(DISTINCT visitor_id) as count FROM site_events")
    .get() as { count: number | bigint };
  const uniqueVisitors = Number(visitorsRow?.count ?? 0);

  const viewsRow = db
    .prepare("SELECT COUNT(*) as count FROM site_events WHERE event = 'view'")
    .get() as { count: number | bigint };
  const pageViews = Number(viewsRow?.count ?? 0);

  const clicksRow = db
    .prepare("SELECT COUNT(*) as count FROM site_events WHERE event = 'click'")
    .get() as { count: number | bigint };
  const clicks = Number(clicksRow?.count ?? 0);

  const messagesRow = db
    .prepare("SELECT COUNT(*) as count FROM contact_messages")
    .get() as { count: number | bigint };
  const messages = Number(messagesRow?.count ?? 0);

  return {
    trafficEvents,
    uniqueVisitors,
    pageViews,
    clicks,
    messages,
  };
}

// ---------------- Diagnostic Probes & Error Logging ----------------

export function logSystemProbe(input: {
  probeType: string;
  statusCode: number;
  latencyMs: number;
  errorCode?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}): SystemProbe {
  const db = getDb();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const errorCode = input.errorCode || null;
  const message = input.message || null;
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

  db.prepare(`
    INSERT INTO system_probes (id, timestamp, probe_type, status_code, latency_ms, error_code, message, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    timestamp,
    input.probeType,
    input.statusCode,
    input.latencyMs,
    errorCode,
    message,
    metadata
  );

  return {
    id,
    timestamp,
    probeType: input.probeType,
    statusCode: input.statusCode,
    latencyMs: input.latencyMs,
    errorCode,
    message,
    metadata,
  };
}

export function getRecentSystemProbes(limit = 10): SystemProbe[] {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, timestamp, probe_type as probeType, status_code as statusCode,
             latency_ms as latencyMs, error_code as errorCode, message, metadata
      FROM system_probes
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    .all(limit) as SystemProbe[];

  return rows;
}

export function getRecentErrors(limit = 10): SystemProbe[] {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, timestamp, probe_type as probeType, status_code as statusCode,
             latency_ms as latencyMs, error_code as errorCode, message, metadata
      FROM system_probes
      WHERE status_code >= 400 OR error_code IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    .all(limit) as SystemProbe[];

  return rows;
}

export function getSystemTelemetryMetrics() {
  const db = getDb();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const totalProbesRow = db
    .prepare("SELECT COUNT(*) as count FROM system_probes WHERE timestamp >= ?")
    .get(oneDayAgo) as { count: number | bigint };
  const totalProbes24h = Number(totalProbesRow?.count ?? 0);

  const errorProbesRow = db
    .prepare("SELECT COUNT(*) as count FROM system_probes WHERE timestamp >= ? AND (status_code >= 400 OR error_code IS NOT NULL)")
    .get(oneDayAgo) as { count: number | bigint };
  const errorProbes24h = Number(errorProbesRow?.count ?? 0);

  const avgLatencyRow = db
    .prepare("SELECT AVG(latency_ms) as avg_latency FROM system_probes WHERE timestamp >= ?")
    .get(oneDayAgo) as { avg_latency: number | null };
  const avgLatency24h = Number(avgLatencyRow?.avg_latency ?? 0);

  const errorRate = totalProbes24h > 0 ? (errorProbes24h / totalProbes24h) * 100 : 0;

  return {
    totalProbes24h,
    errorProbes24h,
    errorRate: Math.round(errorRate * 10) / 10,
    avgLatencyMs: Math.round(avgLatency24h * 100) / 100,
  };
}
