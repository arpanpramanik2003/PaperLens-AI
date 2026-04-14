import { motion } from "framer-motion";

const institutions = [
  { name: "Nature", glow: "rgba(6, 182, 212, 0.6)" },
  { name: "IEEE", glow: "rgba(34, 211, 238, 0.6)" },
  { name: "arXiv", glow: "rgba(147, 51, 234, 0.5)" },
  { name: "Springer", glow: "rgba(16, 185, 129, 0.5)" },
  { name: "ACM", glow: "rgba(236, 72, 153, 0.5)" },
];

export default function SocialProofSection() {
  return (
    <section className="relative py-8 sm:py-12 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-medium text-slate-500 dark:text-white/50 uppercase tracking-[0.2em] mb-6">
          Trusted by researchers at
        </p>
        <div className="flex items-center justify-center flex-wrap gap-5 sm:gap-10">
          {institutions.map((inst, i) => (
            <motion.span
              key={inst.name}
              className="font-mono text-sm sm:text-base font-semibold text-slate-400 dark:text-white/60 cursor-default select-none transition-all duration-300 hover:text-cyan-600 dark:hover:text-cyan-400"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{
                textShadow: `0 0 12px ${inst.glow}, 0 0 24px ${inst.glow}`,
                scale: 1.08,
              }}
            >
              {inst.name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
