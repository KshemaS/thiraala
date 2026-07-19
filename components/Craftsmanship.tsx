import Container from "@/components/Container";
import { motion } from "framer-motion";

export default function Craftsmanship() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section className="w-full pt-0 pb-0">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-16"
        >
          <motion.div className="text-center max-w-2xl mx-auto space-y-4" variants={itemVariants}>
            <span className="text-[#DAA87C] font-semibold text-xs tracking-widest uppercase">our process</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
              From Yarn to Yard
            </h2>
            <div className="w-12 h-1 bg-[#DAA87C] mx-auto rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base">
              Every saree tells a story of patience, touch, and mastery. Here is a look at the core steps that go into crafting a thiraala saree.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10" variants={itemVariants}>
            {/* Step 1 */}
            <div className="space-y-4">
              <span className="text-5xl font-extrabold text-[#DAA87C] block">01</span>
              <h3 className="text-xl font-bold text-[#1E3A2C]">Ethical Sourcing</h3>
              <p className="text-[#1E3A2C] text-sm sm:text-base leading-relaxed font-normal">
                We ethically source organic long-staple cotton threads and fine mul cotton fibers to ensure maximum softness, breathability, and skin-friendliness from the very first drape.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <span className="text-5xl font-extrabold text-[#DAA87C] block">02</span>
              <h3 className="text-xl font-bold text-[#1E3A2C]">Traditional Weaving</h3>
              <p className="text-[#1E3A2C] text-sm sm:text-base leading-relaxed font-normal">
                Our master weavers in handloom communities weave the sarees using wooden loom shafts, interlacing fine cotton yarns with signature zari borders to create classic and gold templates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <span className="text-5xl font-extrabold text-[#DAA87C] block">03</span>
              <h3 className="text-xl font-bold text-[#1E3A2C]">Gentle Wash Finishing</h3>
              <p className="text-[#1E3A2C] text-sm sm:text-base leading-relaxed font-normal">
                The woven sarees undergo organic finishing washes to soften the fibers, removing any initial loom starch. The result is a pre-softened drape that flows beautifully immediately.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
