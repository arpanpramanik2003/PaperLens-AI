import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import React from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
