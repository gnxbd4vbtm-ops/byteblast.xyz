import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getContactMessageDb, updateSiteStatus, updateSiteContent, type SiteStatus } from "@/lib/db";
import { sendContactReply } from "@/lib/mail";
import { getPublicOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let type = "";
  let payload: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const json = await request.json();
    type = String(json.type || "");
    payload = json;
  } else {
    const formData = await request.formData();
    type = String(formData.get("type") || "");
    for (const [key, value] of formData.entries()) {
      payload[key] = String(value);
    }
  }

  if (type === "status") {
    const state = (payload.state || "operational") as SiteStatus["state"];
    const headline = (payload.headline || "Site is fully operational").trim();
    const message = (payload.message || "All systems operating normally.").trim();

    updateSiteStatus({ state, headline, message });
    revalidatePath("/");
    revalidatePath("/status");
    revalidatePath("/admin");

    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, type: "status" });
    }
    return NextResponse.redirect(new URL("/admin?saved=status", getPublicOrigin(request)));
  }

  if (type === "content") {
    const updates: Record<string, string> = {};
    if (payload.hero_headline !== undefined) updates.hero_headline = payload.hero_headline;
    if (payload.hero_description !== undefined) updates.hero_description = payload.hero_description;
    if (payload.current_focus !== undefined) updates.current_focus = payload.current_focus;
    if (payload.availability !== undefined) updates.availability = payload.availability;
    if (payload.status_notes !== undefined) updates.status_notes = payload.status_notes;

    updateSiteContent(updates);
    revalidatePath("/");
    revalidatePath("/status");
    revalidatePath("/admin");

    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, type: "content" });
    }
    return NextResponse.redirect(new URL("/admin?saved=content", getPublicOrigin(request)));
  }

  if (type === "reply") {
    const messageId = (payload.messageId || "").trim();
    const reply = (payload.reply || "").trim();
    const originalMessage = getContactMessageDb(messageId);

    if (!originalMessage || !reply) {
      return NextResponse.json({ error: "A valid message and reply are required." }, { status: 400 });
    }

    await sendContactReply({
      email: originalMessage.email,
      subject: originalMessage.subject,
      message: reply,
    });

    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, type: "reply" });
    }
    return NextResponse.redirect(new URL("/admin?sent=reply", getPublicOrigin(request)));
  }

  return NextResponse.json({ error: "Unknown update type" }, { status: 400 });
}
