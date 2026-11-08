import nodemailer from "nodemailer";
import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectDir = dirname(fileURLToPath(import.meta.url));
nextEnv.loadEnvConfig(projectDir);

const recipient = process.argv[2]?.trim();
if (!recipient || process.argv.length !== 3) {
  console.error("Usage: node test-email.mjs <recipient>");
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;

if (!host || !user || !pass) {
  throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured in .env.local.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SMTP_PORT must be a valid port number.");
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === "true" || port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log("SMTP authentication successful.");
} catch (error) {
  console.error("SMTP verification failed:", error);
  process.exit(1);
}

try {
  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.PUBLIC_EMAIL || "contact@byteblast.xyz",
    to: recipient,
    subject: "[byteblast] SMTP test",
    text: `SMTP test sent at ${new Date().toISOString()}.`,
  });
  console.log(`Test email accepted for delivery to ${recipient} (message ID: ${result.messageId}).`);
} catch (error) {
  const code = error && typeof error === "object" && "code" in error ? ` (${error.code})` : "";
  console.error(`Email test failed${code}: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
