import { NextResponse } from "next/server";
import { getAdminCredentials, setAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const credentials = getAdminCredentials();

  if (username !== credentials.username || password !== credentials.password) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  }

  await setAdminSession(username);

  return NextResponse.redirect(new URL("/admin", request.url));
}
