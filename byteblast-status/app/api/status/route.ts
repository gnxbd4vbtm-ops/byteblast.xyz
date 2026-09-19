import { NextResponse } from "next/server";
import { checkMonitor, monitors } from "@/lib/monitors";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await Promise.all(monitors.map(checkMonitor));
  const onlineCount = results.filter((monitor) => monitor.online).length;

  return NextResponse.json(
    { monitors: results, onlineCount, totalCount: results.length, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
