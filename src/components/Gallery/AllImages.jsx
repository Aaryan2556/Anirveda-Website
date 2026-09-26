import React, { useState } from "react";
import { Search } from "lucide-react";
import ContactUs from "../ContactUs";
import galleryImages from "../../data/galleryImages";
import { useGalleryScroll } from "../../hooks/useGalleryScroll";
import HeroGpuCardNode from "./HeroGpuCardNode";
import GalleryGridCard from "./GalleryGridCard";
import LightboxModal from "./LightboxModal";

// Full gallery photo dataset
const dataset = galleryImages || [];

/**
 * Clean Orchestrator Gallery Component
 * Composes 120 FPS passive scroll pipeline, search HUD, sticky assembly runway,
 * continuous media stream, Lightbox dossier modal, and contact footer.
 */
export default function AllImages() {
  const [selectedIdx, setSelectedIdx] = useState(null);

  const {
    sectionRef,
    isTouchDevice,
    searchQuery,
    setSearchQuery,
    filteredData,
  } = useGalleryScroll(dataset);

  const selectedItem = selectedIdx !== null ? filteredData[selectedIdx] : null;

  const handlePrev = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev > 0 ? prev - 1 : filteredData.length - 1));
  };

  const handleNext = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev < filteredData.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      {/* HERO SECTION: Sticky 3D Assembly Runway (First 6 Photos) */}
      <section
        ref={sectionRef}
        style={{
          "--gallery-progress": "0",
          "--assembly-factor": "1",
          "--badge-opacity": "0",
        }}
        className="relative w-full h-[220vh] bg-background font-sans select-none will-change-transform"
      >
        {/* Sticky Viewport Container: Top-aligned flush structure */}
        <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-8 select-none">
          {/* Giant Typographic Backdrop Layer */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <h1
              style={{
                transform:
                  "scale(calc(0.92 + 0.08 * min(1, var(--gallery-progress, 0) / 0.65))) translateZ(0)",
                opacity:
                  "calc(0.15 + 0.10 * min(1, var(--gallery-progress, 0) / 0.65))",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
              className="font-Bebas text-7xl sm:text-9xl md:text-[12rem] lg:text-[15rem] text-foreground/15 leading-none select-none pointer-events-none tracking-tight text-center uppercase transform-gpu"
            >
              ANIRVEDA
            </h1>
          </div>

          {/* Outer Wrapper with Search HUD & Chassis */}
          <div className="relative z-10 w-full max-w-6xl flex flex-col pb-0">
            {/* SINGLE Global HUD Filter & Search Bar */}
            <div className="relative z-20 w-full flex items-center justify-between gap-4 pb-4 sm:pb-6">
              <div className="font-mono text-xs text-primary font-bold tracking-widest uppercase flex items-center gap-2 bg-card/80 border border-border px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span>SPATIAL ASSEMBLY MATRIX</span>
              </div>

              <div className="relative w-48 sm:w-72 select-text">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Filter photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card/90 border border-border font-mono text-xs text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:text-primary caret-primary backdrop-blur-md select-text relative z-0"
                />
              </div>
            </div>

            {/* Hero Assembly Grid: First 6 Cards */}
            <div className="relative z-10 w-full grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {filteredData.slice(0, 6).map((item, idx) => (
                <HeroGpuCardNode
                  key={item.id || idx}
                  item={item}
                  idx={idx}
                  isTouchDevice={isTouchDevice}
                  onSelect={() => setSelectedIdx(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTINUOUS EXTENDED STREAM (Cards 6+): Expands bottom cards to match the top row width */}
{filteredData.length > 6 && (
  <section className="relative z-10 w-full max-w-6xl mx-auto pb-12 font-sans">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {filteredData.slice(6).map((item, sliceIdx) => {
              const globalIdx = sliceIdx + 6;
              return (
                <GalleryGridCard
                  key={item.id || globalIdx}
                  item={item}
                  globalIdx={globalIdx}
                  isTouchDevice={isTouchDevice}
                  onSelect={() => setSelectedIdx(globalIdx)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Contact Footer */}
      <ContactUs />

      {/* Lightbox Modal */}
      {selectedItem && (
        <LightboxModal
          item={selectedItem}
          items={filteredData}
          onClose={() => setSelectedIdx(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </>
  );
}
