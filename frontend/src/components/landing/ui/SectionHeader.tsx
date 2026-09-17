import React from "react";
import { motion } from "framer-motion";
import AcademicBadge from "./AcademicBadge";

interface SectionHeaderProps {
  badgeText: string;
  badgeIcon?: React.ReactNode;
  badgeVariant?: "default" | "gold" | "emerald" | "cobalt" | "outline";
  title: string;
  titleAccent?: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function SectionHeader({
  badgeText,
  badgeIcon,
  badgeVariant = "default",
  title,
  titleAccent,
  description,
  align = "center",
  className = "",
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <motion.div
      className={`mb-12 sm:mb-16 lg:mb-20 ${isCenter ? "text-center mx-auto" : "text-left"} max-w-3xl ${className}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease }}
    >
      <div className={`mb-3.5 sm:mb-4 ${isCenter ? "flex justify-center" : "flex justify-start"}`}>
        <AcademicBadge icon={badgeIcon} variant={badgeVariant}>
          {badgeText}
        </AcademicBadge>
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-3.5 sm:mb-4 text-balance">
        {title}{" "}
        {titleAccent && (
          <span className="text-gradient-research font-extrabold">{titleAccent}</span>
        )}
      </h2>

      {description && (
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed text-balance">
          {description}
        </p>
      )}
    </motion.div>
  );
}
