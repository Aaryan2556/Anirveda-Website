import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowUpRight, Clock, Calendar, User, BookOpen } from "lucide-react";

export default function FeaturedDossierCard({ blog }) {
  if (!blog) return null;

  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

  const springConfig = { damping: 22, stiffness: 220 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const isTouchDevice =
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleMouseMove = (e) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isTouchDevice ? 0 : springRotateX,
        rotateY: isTouchDevice ? 0 : springRotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative w-full rounded-3xl select-none mb-14 cursor-pointer"
    >
      {/* Deep, Clean Solid Card Surface */}
      <div className="relative h-full w-full rounded-3xl bg-card border border-border p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
        
        {/* Soft Ambient Backlight Glow in Top-Right */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

        {/* Left Column: Content & Telemetry */}
        <div className="flex-1 flex flex-col justify-between w-full" style={{ transform: "translateZ(30px)" }}>
          
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-full bg-muted border border-border font-mono text-[11px] font-bold text-secondary tracking-wider uppercase">
              FEATURED DOSSIER
            </span>
            <span className="px-3 py-1 rounded-full bg-muted border border-border font-mono text-[11px] font-bold text-secondary tracking-wider uppercase">
              {blog.authorNode || "NODE_RESEARCH"}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-Bebas text-4xl sm:text-5xl lg:text-6xl text-foreground group-hover:text-primary transition-colors leading-tight tracking-wide mb-4">
            {blog.title}
          </h2>

          {/* Synopsis */}
          <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 mb-6">
            {blog.excerpt}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs text-muted-foreground pt-4 border-t border-border/80 mb-6">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-secondary" />
              <span>{blog.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>{blog.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span className="text-accent font-bold">{blog.readTime || "5 min read"}</span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <Link
              to={`/blogs/${blog.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>READ DOSSIER</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Column: Thumbnail Container */}
        <div
          className="w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden border border-border/80 bg-muted/40 shadow-xl relative flex items-center justify-center group/img"
          style={{ transform: "translateZ(20px)" }}
        >
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover rounded-2xl filter transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>
    </motion.div>
  );
}
