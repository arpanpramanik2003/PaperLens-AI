import { motion } from "framer-motion";

/**
 * Elegant light-theme hero background with visible aurora mesh animation.
 * Features flowing gradient blobs and animated light beams.
 */
export default function LightHeroBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-white">
      {/* Animated aurora mesh — visible flowing gradients */}
      <div className="absolute inset-0 light-aurora">
        <div className="light-aurora-blob light-aurora-blob-1" />
        <div className="light-aurora-blob light-aurora-blob-2" />
        <div className="light-aurora-blob light-aurora-blob-3" />
        <div className="light-aurora-blob light-aurora-blob-4" />
      </div>

      {/* Animated flowing light beam */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.5 }}
      >
        <motion.div
          className="absolute w-[120%] h-[300px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.08) 20%, rgba(6,182,212,0.12) 50%, rgba(236,72,153,0.08) 80%, transparent 100%)",
            top: "30%",
            left: "-10%",
            filter: "blur(40px)",
            transform: "rotate(-8deg)",
          }}
          animate={{
            x: ["-5%", "5%", "-5%"],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Second light beam — crossing */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.4 }}
      >
        <motion.div
          className="absolute w-[120%] h-[250px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.08) 25%, rgba(147,51,234,0.10) 50%, rgba(6,182,212,0.08) 75%, transparent 100%)",
            top: "55%",
            left: "-10%",
            filter: "blur(35px)",
            transform: "rotate(5deg)",
          }}
          animate={{
            x: ["5%", "-5%", "5%"],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </motion.div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.9) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
