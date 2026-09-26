import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Globe, Instagram, ArrowUpRight } from "lucide-react";

export default function SponsorCard({ sponsor, index, onSelectModal }) {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  const springConfig = { damping: 22, stiffness: 220 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ xPct: 50, yPct: 50 });

  const isTouchDevice =
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleMouseMove = (e) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / rect.width) * 100;
    const yPct = (mouseY / rect.height) * 100;
    setMousePos({ xPct, yPct });

    const xNorm = mouseX / rect.width - 0.5;
    const yNorm = mouseY / rect.height - 0.5;

    x.set(xNorm);
    y.set(yNorm);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectModal(sponsor)}
      style={{
        rotateX: isTouchDevice ? 0 : springRotateX,
        rotateY: isTouchDevice ? 0 : springRotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 35, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
      className="group relative rounded-2xl cursor-pointer select-none flex flex-col h-full"
    >
      {/* Clean Glassmorphic Card Surface */}
      <div className="relative h-full w-full rounded-2xl bg-card/75 group-hover:bg-card group-hover:opacity-100 p-6 flex flex-col justify-between overflow-hidden border border-border transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/10">
        
        {/* Specular Glare Overlay */}
        {isHovered && !isTouchDevice && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-30"
            style={{
              background: `radial-gradient(circle at ${mousePos.xPct}% ${mousePos.yPct}%, rgba(212, 175, 55, 0.12) 0%, rgba(255,255,255,0) 60%)`,
            }}
          />
        )}

        {/* Top HUD Row: Status & Tier Badge */}
        <div className="flex items-center justify-between gap-2 mb-4" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-accent tracking-wider uppercase">
              {sponsor.status}
            </span>
          </div>

          <div className="px-2.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground opacity-75 group-hover:opacity-100 group-hover:text-primary group-hover:border-primary/40 font-mono text-[10px] font-bold tracking-wider transition-all duration-300">
            {sponsor.tierBadge}
          </div>
        </div>

        {/* Clean Logo Frame with High Contrast */}
        <div
          className="h-40 w-full rounded-xl bg-muted/40 group-hover:bg-muted/70 border border-border/80 p-4 flex items-center justify-center mb-5 group-hover:border-primary/40 transition-all duration-300 shadow-inner overflow-hidden opacity-85 group-hover:opacity-100"
          style={{ transform: "translateZ(25px)" }}
        >
          <img
            src={sponsor.img}
            alt={sponsor.title}
            className="max-h-full max-w-full object-contain filter transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Title, Category & Description */}
        <div className="flex-1 flex flex-col justify-start mb-4" style={{ transform: "translateZ(30px)" }}>
          <h3 className="font-Bebas text-3xl tracking-wide text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
            {sponsor.title}
          </h3>
          <span className="font-mono text-[11px] font-semibold text-secondary opacity-75 group-hover:opacity-100 tracking-wider uppercase block mb-3 transition-opacity duration-300">
            {sponsor.tierTag}
          </span>

          <p className="font-sans text-xs sm:text-sm text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-foreground transition-all duration-300 line-clamp-3 leading-relaxed">
            {sponsor.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            {sponsor.website && (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-muted/60 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-200"
                title="Official Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
            {sponsor.instagram && (
              <a
                href={sponsor.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-muted/60 border border-border text-muted-foreground hover:text-accent hover:border-accent/50 transition-all duration-200"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
          </div>

          <button
            onClick={() => onSelectModal(sponsor)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground font-mono text-xs font-bold uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm opacity-80 group-hover:opacity-100"
          >
            <span>INSPECT</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}