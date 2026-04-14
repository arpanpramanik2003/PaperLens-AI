import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { features } from "./constants";
import FeatureDemoWindow from "./FeatureDemoWindow";
import { ease } from "./shared";

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section id="features" className="py-12 sm:py-24 scroll-mt-20 relative">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="text-center mb-12 sm:mb-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-foreground">
              Advanced Research Tools
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Powerful features for <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">researchers</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
            Everything you need to accelerate your research work. From paper analysis to experiment planning, we've got you covered.
          </p>
        </motion.div>

        <div className="space-y-12 sm:space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center ${index % 2 === 1 ? "md:grid-flow-col-dense" : ""}`}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease }}
            >
              <motion.div
                className={`${index % 2 === 1 ? "md:col-span-1 md:order-2" : ""}`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} p-2`}>
                      <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-foreground">{feature.title}</h3>
                  </div>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.desc}</p>

                  <div className="pt-4 space-y-2">
                    {feature.highlights.map((highlight) => (
                      <motion.div
                        key={highlight}
                        className="flex items-center gap-3 text-xs sm:text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                      >
                        <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Link to="/signup" className="inline-block">
                    <motion.button
                      className={`mt-4 sm:mt-6 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                        hoveredFeature === index
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Learn more →
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              <motion.div className={`${index === 0 ? "h-80 sm:h-96 md:h-96" : "h-72 sm:h-80 md:h-96"} ${index % 2 === 1 ? "md:order-1" : ""}`} whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                <FeatureDemoWindow feature={feature} index={index} />
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-muted-foreground mb-6">Start transforming your research workflow today</p>
          <Link to="/signup">
            <motion.button
              className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free →
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
