import StatusBoard from "@/components/status-board";
import { checkMonitor, monitors } from "@/lib/monitors";

async function getInitialStatus() {
  const results = await Promise.all(monitors.map(checkMonitor));

  return {
    monitors: results,
    onlineCount: results.filter((monitor) => monitor.online).length,
    totalCount: results.length,
    checkedAt: new Date().toISOString(),
  };
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getInitialStatus();
  return <StatusBoard initialData={initialData} />;
}
