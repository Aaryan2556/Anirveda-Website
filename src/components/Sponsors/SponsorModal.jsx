import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Instagram, CheckCircle2 } from "lucide-react";

export default function SponsorModal({ sponsor, onClose }) {
  if (!sponsor) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/85 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-card border border-primary/40 p-5 sm:p-8 shadow-2xl"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest">
                TELEMETRY INSPECTION // {sponsor.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors font-mono text-xs flex items-center justify-center"
            >
              ✕ CLOSE [ESC]
            </button>
          </div>

          {/* Logo & Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-24 rounded-xl bg-muted/40 border border-border p-2 flex items-center justify-center">
              <img src={sponsor.img} alt={sponsor.title} className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h2 className="font-Bebas text-3xl sm:text-4xl text-foreground tracking-wide">{sponsor.title}</h2>
              <span className="font-mono text-xs text-secondary tracking-widest uppercase">{sponsor.tierTag}</span>
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-sm text-foreground/90 leading-relaxed mb-6 bg-muted/50 p-4 rounded-xl border border-border">
            {sponsor.description}
          </p>

          {/* Action Links */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>VERIFIED SPONSOR</span>
            </div>

            <div className="flex items-center gap-3">
              {sponsor.website && (
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-accent hover:text-foreground transition-colors shadow-md"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {sponsor.instagram && (
                <a
                  href={sponsor.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:border-accent hover:text-accent transition-colors"
                >
                  <span>Instagram</span>
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
