import DashboardLayout from "@/components/DashboardLayout";
import { WalkInQueue as WalkInQueueComponent } from "@/components/WalkInQueue";

export default function WalkInQueue() {
  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Walk-in Kø" },
      ]}
    >
      <WalkInQueueComponent />
    </DashboardLayout>
  );
}
