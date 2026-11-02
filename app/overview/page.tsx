import DashboardOverview from "@/components/DashboardOverview";

export const metadata = {
  title: "Fleet Overview · Bytebeam Operations",
  description: "Live overview of fleet vehicles, metrics, and active trips across Bengaluru.",
};

export default function OverviewPage() {
  return <DashboardOverview />;
}
