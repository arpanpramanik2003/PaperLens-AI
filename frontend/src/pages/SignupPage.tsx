import { SignUp } from "@clerk/clerk-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      <div className="relative z-10 w-full max-w-md flex justify-center">
        <SignUp 
          signInUrl="/login" 
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
