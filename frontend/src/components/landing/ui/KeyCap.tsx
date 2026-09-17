import React from "react";

interface KeyCapProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function KeyCap({ children, title, className = "" }: KeyCapProps) {
  return (
    <kbd
      title={title}
      className={`keycap inline-flex items-center justify-center font-mono tracking-wider ${className}`}
    >
      {children}
    </kbd>
  );
}
