import FleetApp from "@/components/FleetApp";

export const metadata = {
  title: "Fleet Overview · Bytebeam Operations",
  description: "Live overview of fleet vehicles, metrics, and active trips across Bengaluru.",
};

export default function Home() {
  return <FleetApp />;
}
