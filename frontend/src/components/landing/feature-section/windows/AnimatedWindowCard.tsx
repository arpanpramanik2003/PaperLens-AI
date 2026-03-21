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
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-10 blur-3xl`}
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className={`absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr ${feature.color} opacity-5 blur-3xl`}
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Feature Demo</span>
        </div>

        <div className="p-4 sm:p-6">
          <motion.div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
          </motion.div>

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
                <CheckCircle2 className="w-4 h-4 text-green-500/70 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">{highlight}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-6 p-3 rounded-lg bg-secondary/50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Processing</span>
              <span className="text-xs text-accent font-semibold">98%</span>
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
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
