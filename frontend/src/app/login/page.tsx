import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · Service Request Tracker",
};

export default function LoginPage() {
  return (
    <div className="mx-auto mt-6 max-w-sm sm:mt-12">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <LoginForm />
    </div>
  );
}
