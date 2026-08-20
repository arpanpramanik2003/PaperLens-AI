import { motion } from "framer-motion";

const institutions = ["Nature", "IEEE", "arXiv", "Springer", "ACM"];

export default function SocialProofSection() {
  return (
    <section className="relative py-8 sm:py-12 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-6">
          Trusted by researchers at
        </p>
        <div className="flex items-center justify-center flex-wrap gap-5 sm:gap-10">
          {institutions.map((inst, i) => (
            <motion.span
              key={inst}
              className="font-mono text-sm sm:text-base font-semibold text-muted-foreground/80 hover:text-foreground cursor-default select-none transition-all duration-300"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{
                scale: 1.06,
              }}
            >
              {inst}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
