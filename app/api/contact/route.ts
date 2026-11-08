import { NextResponse } from "next/server";
import { saveContactMessage } from "@/lib/monitoring";
import { sendContactNotification } from "@/lib/mail";
import { getPublicOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    source: "contact-page",
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    return NextResponse.json({ error: "All contact fields are required." }, { status: 400 });
  }

  await saveContactMessage(payload);

  let redirectPath = "/contact?success=1";
  try {
    await sendContactNotification(payload);
  } catch (error) {
    console.error("Failed to send contact notification:", error);
    redirectPath = "/contact?error=send_failed";
  }

  return NextResponse.redirect(new URL(redirectPath, getPublicOrigin()), { status: 303 });
}
