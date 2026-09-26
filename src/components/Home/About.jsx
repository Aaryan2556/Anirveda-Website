
import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Cpu,
  TrendingUp,
  Radio,
  MapPin,
  Users,
  Award,
  Globe,
  Network,
  Instagram,
  Linkedin,
  Mail,
  ArrowUpRight,
} from "lucide-react";

// Add this helper if it's not already imported
function getOptimizedCloudinaryUrl(url, width = 800) {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_fill/`);
}

export default function About() {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#07090E] overflow-hidden">
      {/* Background Ambient Radial Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 1. Top Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center mb-12 sm:mb-16"
        >
          {/* Floating Badge with Sparkle Icon */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md text-amber-400 font-mono text-xs uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <span>GENESIS & MISSION</span>
          </div>

          {/* Gradient Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
            Where Economics Meets{" "}
            <span className="text-primary block sm:inline">
              Technology
            </span>
          </h2>
          <p className="mt-4 text-slate-400 font-sans text-sm sm:text-base max-w-2xl">
            Exploring dynamic forces of transformation, positive disruption, and macro trends to architect the future of techno-economic intelligence.
          </p>
        </motion.div>

        {/* Bento Grid Layout Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* 2. Primary Bento Card (Span 7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="md:col-span-7 group relative flex flex-col justify-between h-full gap-6 p-7 sm:p-9 rounded-3xl bg-slate-950/70 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] overflow-hidden"
          >
            {/* Subtle Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="space-y-4">
              {/* Highlight Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Official Techno-Economics Club • PDEU | Founded 2016</span>
              </div>

              {/* Core Narrative */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug group-hover:text-primary transition-colors">
                Bridging Dynamic Forces of Change
              </h3>

              <div className="text-slate-300 text-sm sm:text-base leading-relaxed text-justify font-sans space-y-3">
                <p>
                  Founded in 2016 at Pandit Deendayal Energy University (PDEU), Anirveda was born from a pivotal realization: Change is the only constant, and Economics and Technology are the ultimate twin harbingers of positive global transformation.
                </p>
                <p>
                  We decode how technological breakthroughs reshape capital markets, consumer behavior, and sovereign policies for the next generation of leaders.
                </p>
              </div>
            </div>

            {/* 1. Techno-Economic Formula / Thesis Quote Block */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-primary/30 backdrop-blur-md relative overflow-hidden group/thesis hover:border-primary/50 transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
                  Techno-Economic Thesis
                </span>
              </div>
              <p className="font-mono text-sm sm:text-base font-bold text-foreground tracking-wide">
                Technology × Economics = Positive Disruption
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-1 leading-normal">
                Demystifying algorithmic shifts, digital currencies (CBDC), and macroeconomic policy.
              </p>
            </div>

            {/* 2. Mini Milestone / Impact Counter Strip */}
            <div className="grid grid-cols-3 gap-3 py-5 px-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex flex-col border-r border-slate-700/60 pr-2">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Founded</span>
                <span className="font-mono text-base sm:text-lg font-bold text-primary mt-1">2016</span>
                <span className="text-xs text-muted-foreground font-sans mt-0.5">8+ Years Active</span>
              </div>
              <div className="flex flex-col border-r border-slate-700/60 pr-2 pl-2 sm:pl-4">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Publications</span>
                <span className="font-mono text-base sm:text-lg font-bold text-primary mt-1">50+ Releases</span>
                <span className="text-xs text-muted-foreground font-sans mt-0.5">Podcasts & Papers</span>
              </div>
              <div className="flex flex-col pl-2 sm:pl-4">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Focus Areas</span>
                <span className="font-mono text-base sm:text-lg font-bold text-primary mt-1">FinTech • AI</span>
                <span className="text-xs text-muted-foreground font-sans mt-0.5">Macroeconomics</span>
              </div>
            </div>

            {/* 3. Core Strategic Pillars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                  CORE STRATEGIC PILLARS
                </span>
              </div>

              {/* Pillar 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-primary">01 /</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-foreground">Macroeconomic Research</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans sm:text-right">
                  Tracking financial policy, market liquidity, and CBDCs.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-primary">02 /</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-foreground">Tech & Quant Systems</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans sm:text-right">
                  Exploring AI disruption, algorithmic infra & data modeling.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-primary">03 /</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-foreground">Community & Media</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans sm:text-right">
                  Financial & tech literacy via podcasts and summits.
                </p>
              </div>
            </div>

            {/* 4 Feature Pills - Anchored to Bottom */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-auto pt-6 border-t border-border">
              {/* Pill 1: Tech Frontiers (Accent Theme) */}
              <div className="group/pill flex flex-col py-3.5 px-4 rounded-2xl bg-accent/10 border border-accent/30 hover:border-accent/60 hover:bg-accent/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-accent/15 text-accent group-hover/pill:scale-110 transition-transform">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                    Tech Frontiers
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  AI & Web3 Stacks
                </p>
              </div>

              {/* Pill 2: Market Dynamics (Primary Theme) */}
              <div className="group/pill flex flex-col py-3.5 px-4 rounded-2xl bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-primary/15 text-primary group-hover/pill:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                    Market Dynamics
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Macro & FinTech
                </p>
              </div>

              {/* Pill 3: Media & Podcasts (Secondary Theme) */}
              <div className="group/pill flex flex-col py-3.5 px-4 rounded-2xl bg-secondary/10 border border-secondary/30 hover:border-secondary/60 hover:bg-secondary/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-secondary/15 text-secondary group-hover/pill:scale-110 transition-transform">
                    <Radio className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                    Media & Podcasts
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Audio & Insights
                </p>
              </div>
            </div>
          </motion.div>

          {/* 3. Image Showcase Card (Span 5 cols) */}
          <motion.div
  initial={{ opacity: 0, y: 25 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  viewport={{ once: true }}
  className="md:col-span-5 group relative flex flex-col gap-3.5 p-4 sm:p-5 rounded-3xl bg-card/80 backdrop-blur-xl border border-primary/20 hover:border-primary/40 transition-all duration-500 shadow-xl overflow-hidden h-full"
>
  {/* 3 Photo Cards Container */}
  <div className="flex flex-col gap-3 w-full justify-between h-full">
    {/* Photo 1: Top */}
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border group shrink-0">
      <img
        src="https://res.cloudinary.com/r5piguws/image/upload/f_auto,q_auto,w_800,c_fill,ar_16:9/v1785948890/VGA_1298_wbrmap.jpg"
        alt="Economania Annual Event"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/85 backdrop-blur-md border border-primary/30 text-foreground font-mono text-[11px] shadow-md">
        <MapPin className="w-3 h-3 text-primary" />
        <span>Economania Annual Event</span>
      </div>
    </div>

    {/* Photo 2: Middle */}
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border group shrink-0">
      <img
        src="https://res.cloudinary.com/r5piguws/image/upload/f_auto,q_auto,w_800,c_fill,ar_16:9/v1785948885/IMG_2570.HEIC_fgifac.jpg"
        alt="Workshops & Sessions"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/85 backdrop-blur-md border border-accent/30 text-foreground font-mono text-[11px] shadow-md">
        <Sparkles className="w-3 h-3 text-accent" />
        <span>Workshops & Speaker Sessions</span>
      </div>
    </div>

    {/* Photo 3: Bottom */}
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border group shrink-0">
      <img
        src="https://res.cloudinary.com/r5piguws/image/upload/f_auto,q_auto,w_800,c_fill,ar_16:9/v1785948888/IMG_6007.HEIC_nkup8z.jpg"
        alt="Club Delegation"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/85 backdrop-blur-md border border-primary/30 text-foreground font-mono text-[11px] shadow-md">
        <Users className="w-3 h-3 text-primary" />
        <span>Club Delegation</span>
      </div>
    </div>
  </div>
</motion.div>

          {/* 4. Bottom Stat Cards (3 equal cols) */}

          {/* Card A: 8+ Years of Impact */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:col-span-4 group relative p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold text-primary tracking-widest uppercase">
                  EST. 2016
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-primary border border-amber-500/20">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-primary my-1">
                8+ Years
              </div>
              <h4 className="text-lg font-bold text-foreground mt-1 mb-2">
                Of Technological & Economic Impact
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                Continuous excellence in decoding complex market shifts, organizing flagship events like Economania, and expanding student horizons.
              </p>
            </div>
          </motion.div>

          {/* Card B: Global Macro Discourse */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:col-span-4 group relative p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold text-primary tracking-widest uppercase">
                  FOCUS AREAS
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-primary border border-cyan-500/20">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">
                Global Macro Discourse
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans mb-4">
                Analyzing critical current affairs including CBDCs, AI ecosystem impact, Digital Pollution, OTT Platform dynamics, and Twin Deficits.
              </p>
            </div>

            {/* Focus Area Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Badge 1: CBDCs (Accent Theme) */}
              <span className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent font-mono text-xs">
                CBDCs
              </span>

              {/* Badge 2: AI Disruption (Primary Theme) */}
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs">
                AI Disruption
              </span>

              {/* Badge 3: Digital Assets (Secondary Theme) */}
              <span className="px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary font-mono text-xs">
                Digital Assets
              </span>
            </div>
          </motion.div>

          {/* Card C: Cross-Disciplinary Community */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-4 group relative p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-semibold text-primary tracking-widest uppercase">
                  NETWORK
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-primary border border-emerald-500/20">
                  <Network className="w-4 h-4" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">
                Cross-Disciplinary Community
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans mb-4">
                A thriving network of Engineering & Economics minds working synergistically to enhance skills, publish research, and record podcasts.
              </p>
            </div>

            {/* Social Connect Links */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <span className="font-mono text-xs text-muted-foreground">
                Connect with Anirveda
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.instagram.com/anirveda_pdeu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-amber-500/20 text-muted-foreground hover:text-primary border border-slate-700/50 hover:border-amber-500/40 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/anirveda-the-technoeconomics-club/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-amber-500/20 text-muted-foreground hover:text-primary border border-slate-700/50 hover:border-amber-500/40 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=anirvedatecheco@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Email"
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-amber-500/20 text-muted-foreground hover:text-primary border border-slate-700/50 hover:border-amber-500/40 transition-all"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

