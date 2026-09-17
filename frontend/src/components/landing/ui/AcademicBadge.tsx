import React from "react";

type AcademicBadgeVariant = "default" | "gold" | "emerald" | "cobalt" | "outline";

interface AcademicBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: AcademicBadgeVariant;
  pulseDot?: boolean;
  className?: string;
}

export default function AcademicBadge({
  children,
  icon,
  variant = "default",
  pulseDot = false,
  className = "",
}: AcademicBadgeProps) {
  const variantStyles: Record<AcademicBadgeVariant, string> = {
    default:
      "bg-accent/10 border-accent/25 text-foreground/90 dark:text-foreground/95 dark:border-white/12 dark:bg-white/[0.04]",
    gold:
      "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300 dark:border-amber-400/20 dark:bg-amber-400/[0.06]",
    emerald:
      "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]",
    cobalt:
      "bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-300 dark:border-blue-400/20 dark:bg-blue-400/[0.06]",
    outline:
      "bg-transparent border-border text-muted-foreground hover:text-foreground",
  };

  const dotStyles: Record<AcademicBadgeVariant, string> = {
    default: "bg-accent",
    gold: "bg-amber-500",
    emerald: "bg-emerald-500",
    cobalt: "bg-blue-500",
    outline: "bg-muted-foreground",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border shadow-xs tracking-wide select-none backdrop-blur-xs transition-all duration-200 ${variantStyles[variant]} ${className}`}
    >
      {pulseDot && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotStyles[variant]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${dotStyles[variant]}`}
          />
        </span>
      )}
      {icon && <span className="flex-shrink-0 text-current">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
