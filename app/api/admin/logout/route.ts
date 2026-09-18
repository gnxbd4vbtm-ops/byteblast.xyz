import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";
import { getPublicOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", getPublicOrigin(request)));
}
