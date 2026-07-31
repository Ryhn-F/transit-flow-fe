import { DashboardView } from "@/features/stations/DashboardView";

export const metadata = {
  title: "Dashboard | TransitFlow AI",
  description: "Real-time station congestion dashboard",
};

export default function DashboardPage() {
  return <DashboardView />;
}
