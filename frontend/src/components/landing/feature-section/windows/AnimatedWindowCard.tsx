import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { Feature } from "../constants";
import { ease } from "../shared";

type AnimatedWindowCardProps = {
  feature: Feature;
  index: number;
};

export default function AnimatedWindowCard({ feature }: AnimatedWindowCardProps) {
  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
    >
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Feature Demo</span>
        </div>

        <div className="p-4 sm:p-6">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-sm`}
          >
            <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>

          <div className="space-y-3 mt-4">
            {feature.highlights.map((highlight, i) => (
              <motion.div
                key={highlight}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">{highlight}</span>
              </motion.div>
            ))}
          </div>

          <div
            className="mt-6 p-3 rounded-lg bg-muted/30 border border-border shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Processing</span>
              <span className="text-xs font-mono text-accent font-semibold">98%</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${feature.color}`}
                initial={{ width: "0%" }}
                whileInView={{ width: "98%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
