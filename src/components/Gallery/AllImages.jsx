import React, { useState } from "react";
import { Search } from "lucide-react";
import ContactUs from "../ContactUs";
import galleryImages from "../../data/galleryImages";
import { useGalleryScroll } from "../../hooks/useGalleryScroll";
import HeroGpuCardNode from "./HeroGpuCardNode";
import GalleryGridCard from "./GalleryGridCard";
import LightboxModal from "./LightboxModal";

const dataset = galleryImages || [];

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
    <div className="w-full bg-background min-h-screen text-foreground font-sans relative overflow-x-hidden">
      {/* 1. HERO ASSEMBLY RUNWAY: Tightened to eliminate vertical overscroll dead zone */}
      <section
        ref={sectionRef}
        style={{
          "--gallery-progress": "0",
          "--assembly-factor": "1",
          "--badge-opacity": "0",
        }}
        className="relative w-full h-[105vh] sm:h-[112vh] bg-background font-sans select-none will-change-transform"
      >
        {/* Sticky Viewport Container: Top aligned to keep the card block compact */}
        <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-start pt-10 sm:pt-16 overflow-hidden px-3 sm:px-8 select-none">
          {/* Giant Typographic Backdrop Layer */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <h1
              style={{
                transform:
                  "scale(calc(0.92 + 0.08 * min(1, var(--gallery-progress, 0) / 0.85))) translateZ(0)",
                opacity:
                  "calc(0.28 + 0.14 * min(1, var(--gallery-progress, 0) / 0.85))",
                willChange: "transform, opacity",
              }}
              className="font-Bebas text-5xl xs:text-7xl sm:text-8xl md:text-[12rem] lg:text-[15rem] text-foreground/40 sm:text-foreground/25 leading-none select-none pointer-events-none tracking-wider text-center uppercase max-w-full break-words"
            >
              ANIRVEDA
            </h1>
          </div>

          {/* Outer Wrapper with Search HUD */}
          <div className="relative z-10 w-full max-w-6xl flex flex-col">
            {/* Filter & Search HUD */}
            <div className="relative z-20 w-full flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 sm:gap-4 pb-2.5 sm:pb-4">
              <div className="font-mono text-[10px] sm:text-xs text-primary font-bold tracking-widest uppercase flex items-center justify-center gap-2 bg-card/80 border border-border px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm w-fit self-center xs:self-auto">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse" />
                <span>SPATIAL ASSEMBLY MATRIX</span>
              </div>

              <div className="relative w-full xs:w-48 sm:w-72 select-text">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Filter photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card/90 border border-border font-mono text-base sm:text-xs text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:text-primary caret-primary backdrop-blur-md select-text relative z-0"
                />
              </div>
            </div>

            {/* Top 6 Cards Grid: Translates seamlessly down into the feed */}
            <div
              style={{
                transform: "translate3d(0, calc(var(--gallery-progress, 0) * 12px), 0)",
                transition: "transform 0.1s ease-out",
              }}
              className="relative z-10 w-full grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6"
            >
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

      {/* 2. CONTINUOUS STREAM: Calibrated mobile negative margin pulls cards flush */}
      {filteredData.length > 6 && (
        <section className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-8 -mt-20 sm:-mt-6 pb-16 font-sans">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
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
    </div>
  );
}