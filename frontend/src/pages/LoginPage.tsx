import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      <div className="relative z-10 w-full max-w-md flex justify-center">
        <SignIn signUpUrl="/signup" forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
