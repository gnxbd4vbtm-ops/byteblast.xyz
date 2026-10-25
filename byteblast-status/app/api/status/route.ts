import { NextResponse } from "next/server";
import { checkMonitors, monitors } from "@/lib/monitors";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await checkMonitors(monitors);
  const onlineCount = results.filter((monitor) => monitor.online).length;

  return NextResponse.json(
    { monitors: results, onlineCount, totalCount: results.length, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
