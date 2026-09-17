import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "byteblast.xyz",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
