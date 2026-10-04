import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, ExternalLink, ShieldCheck, Tag, Instagram, ImageOff } from "lucide-react";

export default function SponsorModal({ sponsor, onClose }) {
  const [imageError, setImageError] = useState(false);

  // Prevent background viewport scroll while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!sponsor) return null;

  // Resolves the image source using sponsor.img first, followed by fallbacks
  const modalImgSrc =
    sponsor.img ||
    sponsor.logo ||
    sponsor.image ||
    sponsor.src ||
    sponsor.imageSrc ||
    "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6 overflow-hidden">
      {/* Blurred Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md -z-10"
      />

      {/* Centered Modal Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-y-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              {sponsor.tierBadge || sponsor.tierTag || sponsor.tier || "SPONSOR NODE"}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>{sponsor.status || "OFFICIAL PARTNER"}</span>
            </div>
          </div>

          {/* Close Icon Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sponsor Logo Showcase with Fail-Safe Fallback */}
        <div className="w-full h-36 sm:h-44 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-center p-6 my-4 flex-shrink-0 overflow-hidden shadow-inner">
          {modalImgSrc && !imageError ? (
            <img
              src={modalImgSrc}
              alt={sponsor.title || sponsor.name}
              onError={() => setImageError(true)}
              className="max-h-full max-w-full object-contain filter drop-shadow"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5">
              <ImageOff className="w-7 h-7 opacity-40" />
              <span className="font-mono text-xs tracking-wider uppercase opacity-60">
                {sponsor.title || "LOGO NOT AVAILABLE"}
              </span>
            </div>
          )}
        </div>

        {/* Title & Category Tags */}
        <div className="mb-3">
          <h2 className="font-Bebas text-2xl sm:text-3xl text-foreground tracking-wide">
            {sponsor.title || sponsor.name}
          </h2>
          {(sponsor.tierTag || sponsor.category) && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary mt-0.5">
              <Tag className="w-3 h-3" />
              <span className="uppercase">{sponsor.tierTag || sponsor.category}</span>
            </div>
          )}
        </div>

        {/* Description Body */}
        <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
          {sponsor.fullDescription ||
            sponsor.description ||
            "An essential collaborator supporting student hackathons, research summits, and techno-economic development initiatives."}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-border/80 mt-auto">
          {/* Social Links on the Left */}
          <div className="flex items-center gap-2">
            {sponsor.instagram && (
              <a
                href={sponsor.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-accent hover:border-accent/50 border border-border transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {sponsor.website && (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:border-primary/50 border border-border transition-all"
                title="Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Action Buttons on the Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-mono text-xs font-bold transition-all"
            >
              CLOSE
            </button>

            {sponsor.website && (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
              >
                <span>VISIT WEBSITE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}