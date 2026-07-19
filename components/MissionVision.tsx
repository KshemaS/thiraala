"use client";

import Container from "@/components/Container";
import { motion } from "framer-motion";

export default function MissionVision() {
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
    <section className="w-full bg-gradient-to-b from-[#fcfbfa] via-[#f8f5ee] to-[#fcfbfa] pt-[60px] border-y border-[#1E3A2C]/5">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          
          {/* Left Column: Heading and Context */}
          <motion.div className="lg:col-span-4 space-y-6" variants={itemVariants}>
            <span className="text-[#DAA87C] font-semibold text-xs tracking-widest uppercase">
              purpose & future
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight leading-tight">
              Guided by Elegance & Weaver Heritage
            </h2>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed font-normal">
              We believe that fashion should feel natural and carry a story. Our purpose guides every single thread we weave, balancing comfort and craftsmanship.
            </p>
          </motion.div>

          {/* Right Column: Mission & Vision Cards (Modern high-contrast layout) */}
          <motion.div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8" variants={itemVariants}>
            
            {/* Mission Card - Light Theme */}
            <div className="group relative bg-white p-8 sm:p-10 rounded-[32px] border border-[#DAA87C]/20 shadow-[0_20px_40px_rgba(30,58,44,0.04)] hover:shadow-[0_30px_60px_rgba(30,58,44,0.08)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DAA87C] to-amber-200" />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#DAA87C]/10 flex items-center justify-center text-[#DAA87C]">
                    {/* Thread / Loom Icon */}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[#DAA87C] tracking-wider uppercase">01</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-[#1E3A2C]">
                    Our Mission
                  </h3>
                  <p className="text-[#1E3A2C]/75 text-sm sm:text-[15px] leading-relaxed font-normal">
                    To revive the love for everyday sarees by creating lightweight, premium quality cotton and silk weaves that seamlessly fit into the modern lifestyle—fostering comfort, grace, and direct weaver support.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1E3A2C]/5 flex items-center justify-between">
                <span className="text-[#DAA87C] text-xs font-semibold uppercase tracking-wider">Everyday Comfort</span>
                <span className="w-2 h-2 rounded-full bg-[#DAA87C]"></span>
              </div>
            </div>

            {/* Vision Card - Dark Theme */}
            <div className="group relative bg-[#1E3A2C] p-8 sm:p-10 rounded-[32px] border border-transparent shadow-[0_20px_40px_rgba(30,58,44,0.15)] hover:shadow-[0_30px_60px_rgba(30,58,44,0.25)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-200 to-[#DAA87C]" />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#DAA87C]">
                    {/* Star / Mandala Icon */}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.582 1.838l-3.97 2.887a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.887a1 1 0 00-1.175 0l-3.97 2.887c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.887c-.779-.586-.38-1.838.582-1.838h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[#DAA87C] tracking-wider uppercase">02</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white">
                    Our Vision
                  </h3>
                  <p className="text-[#fcfbfa]/80 text-sm sm:text-[15px] leading-relaxed font-normal">
                    To build a modern heritage brand that stands as a synonym for simple luxury, establishing handloom sarees as an essential choice for global women who value heritage, sustainability, and effortless aesthetics.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[#DAA87C] text-xs font-semibold uppercase tracking-wider">Weaver Empowerment</span>
                <span className="w-2 h-2 rounded-full bg-[#DAA87C]"></span>
              </div>
            </div>

          </motion.div>

        </motion.div>
      </Container>
    </section>
  );
}
