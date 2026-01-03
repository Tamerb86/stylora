import DashboardLayout from "@/components/DashboardLayout";
import { WalkInQueue as WalkInQueueComponent } from "@/components/WalkInQueue";
import { useTranslation } from "react-i18next";

export default function WalkInQueue() {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout
      breadcrumbs={[
        { label: t("nav.dashboard"), href: "/dashboard" },
        { label: t("walkInQueue.title") },
      ]}
    >
      <WalkInQueueComponent />
    </DashboardLayout>
  );
}
