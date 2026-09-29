import React, { useState } from "react";
import { Maximize2 } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

/**
 * Pure GPU Compositor Card Node for Hero Tier (Cards 0 to 5)
 * Controls initial trajectory transforms, 600px 4:3 Cloudinary thumbnail sizing,
 * skeleton shimmer overlay, and flight telemetry badges.
 *
 * @param {Object} props
 * @param {Object} props.item - Gallery item object
 * @param {number} props.idx - Index in array
 * @param {boolean} props.isTouchDevice - Mobile / touch flag
 * @param {Function} props.onSelect - Selection click handler
 */
export default function HeroGpuCardNode({ item, idx, isTouchDevice, onSelect }) {
  const [loaded, setLoaded] = useState(false);

  const mod = idx % 6;
  const factor = isTouchDevice ? 0.35 : 1;

  let initY = -260 * factor;
  let initX = 0;
  let initRotZ = -15;
  let initScale = 0.88;

  if (mod === 1) {
    initY = 260 * factor;
    initRotZ = 12;
  } else if (mod === 2) {
    initY = 0;
    initX = -250 * factor;
    initRotZ = -10;
  } else if (mod === 3) {
    initY = -220 * factor;
    initX = -220 * factor;
    initRotZ = -18;
  } else if (mod === 4) {
    initY = 220 * factor;
    initX = 220 * factor;
    initRotZ = 16;
  } else if (mod === 5) {
    initY = 0;
    initX = 250 * factor;
    initRotZ = -8;
  }

  const scaleDiff = 1 - initScale;
  const thumbnailUrl = getOptimizedCloudinaryUrl(item.src, 600, "auto");

  return (
    <div
      style={{
        "--init-y": `${initY}px`,
        "--init-x": `${initX}px`,
        "--init-rot": `${initRotZ}deg`,
        "--scale-diff": `${scaleDiff}`,
        transform: `translate3d(calc(var(--init-x) * var(--assembly-factor, 0)), calc(var(--init-y) * var(--assembly-factor, 0)), 0) rotate(calc(var(--init-rot) * var(--assembly-factor, 0))) scale(calc(1 - var(--scale-diff) * var(--assembly-factor, 0)))`,
        opacity: `calc(1 - 0.15 * var(--assembly-factor, 0))`,
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
      }}
      onClick={onSelect}
      className="group relative rounded-2xl overflow-hidden bg-card border border-border/80 hover:border-primary/80 shadow-xl cursor-pointer select-none transform-gpu w-full aspect-[4/3] flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] hover:z-30"
    >
      {/* Pure GPU Hover Specular Sheen Overlay */}
      {!isTouchDevice && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
      )}

      {/* Lightweight Shimmer Placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted/70 animate-pulse rounded-xl z-10" />
      )}

      {/* Flight Telemetry Badge */}
      <div
        style={{
          opacity: "var(--badge-opacity, 0)",
          willChange: "opacity",
        }}
        className="absolute top-2 left-2 right-2 z-20 pointer-events-none flex items-center justify-between"
      >
        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-mono text-[9px] font-extrabold tracking-wider uppercase shadow-md">
          {item.nodeId || `NODE_${item.id}`}
        </span>
      </div>

      {/* Media Image with 600px Cloudinary Thumbnail & Eager Decoding */}
      <div className="relative w-full h-full overflow-hidden bg-muted/40">
        <img
          src={thumbnailUrl}
          alt={item.title || item.alt || "Anirveda Event Photo"}
          loading="eager"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Dark Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

        {/* Permanent Caption Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20">
          <h4 className="font-Bebas text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors leading-none truncate">
            {item.title || ""}
          </h4>
          <div className="p-1.5 rounded-lg bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
