import AuthCard from "@/components/AuthCard";

export const metadata = {
  title: "Sign In · Bytebeam Fleet Operations",
  description: "Sign in to Bytebeam Fleet Operations Console",
};

export default function LoginPage() {
  return <AuthCard initialMode="signin" />;
}
