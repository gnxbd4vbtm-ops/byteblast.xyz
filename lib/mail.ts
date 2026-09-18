import nodemailer from "nodemailer";

const contactAddress = process.env.PUBLIC_EMAIL || "contact@byteblast.xyz";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured to send email.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
}

function getFromAddress() {
  return process.env.SMTP_FROM || contactAddress;
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: contactAddress,
    replyTo: input.email,
    subject: `[byteblast contact] ${input.subject}`,
    text: `Name: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
  });
}

export async function sendContactReply(input: {
  email: string;
  subject: string;
  message: string;
}) {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: input.email,
    subject: input.subject.startsWith("Re:") ? input.subject : `Re: ${input.subject}`,
    text: input.message,
  });
}
