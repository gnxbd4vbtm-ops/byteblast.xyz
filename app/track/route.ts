import { NextResponse } from "next/server";
import { getVisitorId, recordSiteEvent } from "@/lib/monitoring";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const visitorId = getVisitorId(request.headers);

  await recordSiteEvent({
    event: "view",
    path: url.searchParams.get("path") || url.pathname || "/",
    label: url.searchParams.get("label") || "page",
    referrer: request.headers.get("referer") || "",
    userAgent: request.headers.get("user-agent") || "unknown",
    visitorId,
  });

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const url = new URL(request.url);
  const visitorId = getVisitorId(request.headers);

  await recordSiteEvent({
    event: "click",
    path: String(formData.get("path") || url.searchParams.get("path") || "/"),
    label: String(formData.get("label") || "click"),
    referrer: request.headers.get("referer") || "",
    userAgent: request.headers.get("user-agent") || "unknown",
    visitorId,
  });

  return NextResponse.json({ ok: true });
}
