import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Icon } from "@iconify/react";
import HolographicDashboard from "./HolographicDashboard";
import MagneticButton from "../ui/MagneticButton";

export default function Main() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.4]);
  const scrollProgressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, rotateX: 8 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
    },
  };

  return (
    <section ref={targetRef} className="relative bg-background pt-2 sm:pt-14 pb-12 sm:pb-16 overflow-x-hidden select-none">
      {/* Scroll Telemetry Progress Line */}
      <motion.div
        style={{ width: scrollProgressWidth }}
        className="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent z-50 pointer-events-none"
      />

      {/* UPPER HERO BANNER CONTAINER WITH TEAM PHOTO */}
      <div className="relative w-full min-h-0 sm:min-h-[580px] flex items-start sm:items-center pt-3 pb-6 sm:pb-32 lg:pb-36 overflow-hidden">
        {/* Team Photo Background Layering */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-background">
          <img
            src="https://res.cloudinary.com/r5piguws/image/upload/v1785948890/VGA_1298_wbrmap.jpg"
            alt="Anirveda Team Hero Background"
            className="absolute inset-0 w-full h-full object-cover object-top sm:object-center opacity-30 filter brightness-75 contrast-125"
          />

          {/* Responsive Directional Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-background via-background/85 md:via-background/70 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Left-Aligned Hero Content Stack with Scroll Scale Compression */}
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-7xl mx-auto pl-4 sm:pl-6 md:pl-8 lg:pl-10 pr-4 w-full"
        >
          <div className="flex flex-col items-start text-left max-w-2xl ml-0 mr-auto mt-0 pt-0">
            {/* Main Title: Bebas Primary Font */}
            <motion.h1
              variants={itemVariants}
              className="font-Bebas text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight sm:tracking-wider leading-[0.95] text-primary uppercase mt-0 mb-1 sm:mb-2 select-none drop-shadow-[0_0_35px_rgba(var(--primary-rgb),0.35)] max-w-full break-words"
            >
              ANIRVEDA
            </motion.h1>

            {/* Subtitle */}
            <motion.h2
              variants={itemVariants}
              className="font-sans text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2 sm:mb-4 drop-shadow-md"
            >
              The Techno-Economics Club
            </motion.h2>

            {/* Mission Statement */}
            <motion.p
              variants={itemVariants}
              className="text-foreground/90 text-xs sm:text-base lg:text-lg font-medium leading-relaxed mb-4 sm:mb-8 max-w-xl text-left drop-shadow-sm"
            >
              Making student pioneers possess both business acumen and technical expertise. Bridging compute, algorithmic systems, and macroeconomic strategy.
            </motion.p>

            {/* Action CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3 sm:gap-5 w-full sm:w-auto"
            >
              {/* Primary CTA: Committee */}
              <MagneticButton magneticStrength={0.4} range={140}>
                <Link to="/committee" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm sm:text-base shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 font-mono uppercase tracking-wider transition-shadow min-h-[44px]"
                  >
                    <span>Committee</span>
                    <Icon className="text-lg" icon="carbon:arrow-right" />
                  </motion.button>
                </Link>
              </MagneticButton>

              {/* Secondary CTA: Events */}
              <MagneticButton magneticStrength={0.4} range={140}>
                <Link to="/events" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl bg-card/80 backdrop-blur-md border border-border text-foreground hover:text-primary hover:border-primary/40 font-bold text-xs sm:text-sm sm:text-base transition-all duration-300 font-mono uppercase tracking-wider flex items-center justify-center space-x-2 min-h-[44px]"
                  >
                    <Icon className="text-lg text-primary" icon="carbon:events" />
                    <span>Events</span>
                  </motion.button>
                </Link>
              </MagneticButton>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* STANDALONE 3D GLOBE SECTION BELOW THE HERO BANNER */}
      <div className="relative w-full px-2 sm:px-4 max-w-full overflow-hidden">
        {/* Ambient Backlights */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Globe Canvas Container */}
        <HolographicDashboard />
      </div>
    </section>
  );
}