import Container from "@/components/Container";
import { motion } from "framer-motion";

export default function AboutPromise() {
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
    <section className="w-full bg-[#1E3A2C] text-[#fcfbfa] py-[60px] md:py-[80px] lg:py-[120px]">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-16"
        >
          <motion.div className="text-center max-w-2xl mx-auto space-y-4" variants={itemVariants}>
            <span className="text-[#DAA87C] font-semibold text-xs tracking-widest uppercase">our promise</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The thiraala Principles</h2>
            <div className="w-12 h-1 bg-[#DAA87C] mx-auto rounded-full"></div>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center" variants={itemVariants}>
            {/* Promise 1 */}
            <div className="space-y-4">
              {/* Breathable Icon */}
              <div className="w-14 h-14 rounded-full bg-white/5 border border-[#DAA87C]/25 flex items-center justify-center text-[#DAA87C] mx-auto mb-6 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 12h12M4 16h8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12c1-2 3-2 4 0-1 2-3 2-4 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#DAA87C]">100% Breathable</h3>
              <p className="text-[#fcfbfa]/80 text-sm sm:text-base font-normal leading-relaxed max-w-xs mx-auto">
                No heavy starch or rigid fabrics. Our sarees are pre-washed and crafted for weightless, breezy drapes in any season.
              </p>
            </div>

            {/* Promise 2 */}
            <div className="space-y-4">
              {/* Direct Support Icon */}
              <div className="w-14 h-14 rounded-full bg-white/5 border border-[#DAA87C]/25 flex items-center justify-center text-[#DAA87C] mx-auto mb-6 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#DAA87C]">Direct Support</h3>
              <p className="text-[#fcfbfa]/80 text-sm sm:text-base font-normal leading-relaxed max-w-xs mx-auto">
                By cutting middlemen, we ensure fair compensations directly to the handloom weavers who keep these heritage crafts alive.
              </p>
            </div>

            {/* Promise 3 */}
            <div className="space-y-4">
              {/* Classic Minimalist Icon */}
              <div className="w-14 h-14 rounded-full bg-white/5 border border-[#DAA87C]/25 flex items-center justify-center text-[#DAA87C] mx-auto mb-6 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 100-6 3 3 0 000 6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 100 6 3 3 0 000-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#DAA87C]">Classic Minimalist</h3>
              <p className="text-[#fcfbfa]/80 text-sm sm:text-base font-normal leading-relaxed max-w-xs mx-auto">
                Designs that outlive seasonal trends. Minimalist borders, curated colors, and clean aesthetics designed for lasting wear.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
