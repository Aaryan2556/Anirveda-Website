import React, { useState, memo } from "react";
import { Maximize2 } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

/**
 * Optimized ArchivalPhotoCard / GalleryGridCard Component
 * Features Cloudinary 600px 4:3 WebP/AVIF thumbnail optimization,
 * [content-visibility:auto], [contain-intrinsic-size:300px_225px] for zero off-screen GPU overhead,
 * lightweight async decoding, and instant Tailwind shimmer placeholder.
 *
 * @param {Object} props
 * @param {Object} props.item - Gallery item object
 * @param {number} props.globalIdx - Global dataset index
 * @param {boolean} props.isTouchDevice - Mobile / touch flag
 * @param {Function} props.onSelect - Click handler to open Lightbox Modal
 */
const GalleryGridCard = memo(function GalleryGridCard({
  item,
  globalIdx,
  isTouchDevice,
  onSelect,
}) {
  const [loaded, setLoaded] = useState(false);
  const thumbnailUrl = getOptimizedCloudinaryUrl(item.src, 600, "auto");

  return (
    <div
      onClick={onSelect}
      className="group relative rounded-2xl overflow-hidden bg-card border border-border/80 hover:border-primary/80 shadow-xl cursor-pointer select-none w-full aspect-[4/3] flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] hover:z-30 [content-visibility:auto] [contain-intrinsic-size:300px_225px]"
    >
      {/* Pure Hover Specular Sheen Overlay */}
      {!isTouchDevice && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
      )}

      {/* Lightweight Shimmer Placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted/70 animate-pulse rounded-xl z-10" />
      )}

      {/* Node Badge */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <span className="px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground font-mono text-[9px] font-bold uppercase shadow-sm backdrop-blur-md">
          {item.nodeId || `NODE_${item.id}`}
        </span>
      </div>

      {/* Media Image with 600px Cloudinary Thumbnail & Async Decoding */}
      <div className="relative w-full h-full overflow-hidden bg-muted/40">
        <img
          src={thumbnailUrl}
          alt={item.title || item.alt || "Anirveda Archival Photo"}
          loading="lazy"
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
          <div className="p-1.5 rounded-lg bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default GalleryGridCard;
