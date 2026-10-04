import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ShieldCheck, Download } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

/**
 * Interactive Holographic Lightbox Dossier Modal
 * Features 1600px high-definition Cloudinary preview image, keyboard navigation,
 * and direct raw download trigger.
 *
 * @param {Object} props
 * @param {Object} props.item - Currently selected gallery item
 * @param {Array} props.items - List of filtered items for navigation
 * @param {Function} props.onClose - Dismiss modal handler
 * @param {Function} props.onPrev - Previous item handler
 * @param {Function} props.onNext - Next item handler
 */
export default function LightboxModal({ item, items, onClose, onPrev, onNext }) {
  if (!item) return null;

  const previewUrl = getOptimizedCloudinaryUrl(item.src, 1600, "auto");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-background/90 backdrop-blur-2xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-primary/40 p-4 sm:p-6 shadow-2xl flex flex-col lg:flex-row items-stretch gap-6 transform-gpu"
        >
          {/* Top Shimmer Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-accent" />

          {/* Close Action */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 min-h-[44px] px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors font-mono text-xs flex items-center gap-1"
          >
            <span>[ESC]</span>
            <X className="w-4 h-4" />
          </button>

          {/* Left Column: 1600px Crisp Image Inspection */}
          <div className="relative flex-1 bg-muted/40 rounded-2xl border border-border overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[450px]">
            <img
              src={previewUrl}
              alt={item.title || item.alt || "Anirveda Event Photo"}
              loading="eager"
              decoding="async"
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
            />

            {items && items.length > 1 && (
              <button
                onClick={onPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 border border-border text-foreground hover:text-primary hover:border-primary transition-all backdrop-blur-md shadow-lg"
                title="Previous Media [←]"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {items && items.length > 1 && (
              <button
                onClick={onNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 border border-border text-foreground hover:text-primary hover:border-primary transition-all backdrop-blur-md shadow-lg"
                title="Next Media [→]"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Right Column: Telemetry Summary */}
          <div className="w-full lg:w-80 flex flex-col justify-between space-y-4 py-2 font-mono">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-wider">
                  {item.nodeId || `NODE_${item.id}`}
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase">
                  {item.date || "Aug 2025"}
                </span>
              </div>

              <h3 className="font-Bebas text-3xl text-primary leading-tight tracking-wide mb-3">
                {item.title || item.alt || ""}
              </h3>

              <p className="font-sans text-xs text-foreground/90 leading-relaxed mb-6 bg-muted p-3.5 rounded-xl border border-border">
                {item.description ||
                  "Official archival photography documenting Anirveda events and summit proceedings."}
              </p>

              {item.telemetry && (
                <div className="space-y-2 mb-6">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">
                    OPTICAL TELEMETRY
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-background border border-border flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">APERTURE</span>
                      <span className="text-primary font-bold">{item.telemetry.aperture}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-background border border-border flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">SHUTTER</span>
                      <span className="text-foreground font-bold">{item.telemetry.shutter}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-background border border-border flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">ISO SPEED</span>
                      <span className="text-accent font-bold">{item.telemetry.iso}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-background border border-border flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">FOCAL LENS</span>
                      <span className="text-secondary font-bold">{item.telemetry.focalLength}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-accent font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>VERIFIED MEDIA</span>
              </div>

              {/* Download link points to raw original asset */}
              <a
                href={item.src}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-accent hover:text-foreground transition-colors shadow-md"
              >
                <span>Full Res</span>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
