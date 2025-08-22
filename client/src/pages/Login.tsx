import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);

  return isSignup ? (
    <SignupForm onSwitchToLogin={() => setIsSignup(false)} />
  ) : (
    <LoginForm onSwitchToSignup={() => setIsSignup(true)} />
  );
}
