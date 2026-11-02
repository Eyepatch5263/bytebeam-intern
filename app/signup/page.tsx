import AuthCard from "@/components/AuthCard";

export const metadata = {
  title: "Sign Up · Bytebeam Fleet Operations",
  description: "Register for Bytebeam Fleet Operations Console",
};

export default function SignUpPage() {
  return <AuthCard initialMode="signup" />;
}
