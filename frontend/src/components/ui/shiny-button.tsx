import * as React from "react";
import { cn } from "@/lib/utils";

type ShinyButtonVariant = "hero" | "inline";

type ShinyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ShinyButtonVariant;
};

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className, type = "button", variant = "hero", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("shiny-cta", variant === "inline" ? "shiny-cta--inline" : "shiny-cta--hero", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ShinyButton.displayName = "ShinyButton";
